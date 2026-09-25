"use client";

import { useAppSelector } from "@/store/hooks";
import { store } from "@/store";
import { updateAppointmentStatus, rescheduleAppointment } from "@/store/slices/appointmentSlice";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { addReview, updateAppointmentData } from "@/lib/appointment-store";
import { processPayment } from "@/lib/payment-store";
import { getPrescriptionByAppointmentId } from "@/lib/prescription-store";
import { UserPrescription } from "@/features/user-portal/components/UserPrescription";
import { OnlineAppointmentActions } from "@/features/appointments/components/OnlineAppointmentActions";
import { toast } from "react-toastify";


import { getAllSlots, freeSlot, markSlotBooked, getAvailableSlotsForDoctor } from "@/lib/availability-store";
import type { AvailabilitySlot } from "@/types/availability";
import { addNotification } from "@/lib/notification-store";

type FilterStatus = "all" | AppointmentStatus;

export default function PatientAppointmentsPage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState<string | null>(null);

  const [viewingPrescription, setViewingPrescription] = useState<{apt: Appointment, p: Prescription} | null>(null);
  const [reviewingApt, setReviewingApt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const isCancellable = (apt: Appointment) => {
    if (["cancelled", "completed", "missed"].includes(apt.status)) return false;
    if (new Date(apt.startsAt) < new Date()) return false;
    return true;
  };

  const handleCancelAppointment = async () => {
    if (!cancellingApt || !patient) return;
    
    setIsCancelling(true);

    try {
      // 1. Role Isolation check
      if (cancellingApt.patient.name !== patient.name) {
        toast.error("You can only cancel your own appointments.");
        return;
      }
      
      // 2. Validate not in past
      if (new Date(cancellingApt.startsAt) < new Date()) {
        toast.error("Cannot cancel past appointments.");
        return;
      }

      // 3. Free availability slot
      const slot = getAllSlots().find(s => s.appointmentId === cancellingApt.id);
      if (slot) {
        freeSlot(slot.id);
        // Force slot sync since slots aren't in Zustand
        window.dispatchEvent(new Event("schedula_slots_updated"));
      }

      // 4. Update Appointment Status (this also notifies patient and persists)
      store.dispatch(updateAppointmentStatus({ id: cancellingApt.id, status: "cancelled" }));

      // 5. Notify the doctor
      const dateFormatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(cancellingApt.startsAt));
      const timeFormatted = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(cancellingApt.startsAt));
      addNotification({ 
        userId: cancellingApt.doctorId, 
        message: `Your appointment with ${patient.name} on ${dateFormatted} at ${timeFormatted} has been cancelled.`, 
        type: "cancellation", 
        appointmentId: cancellingApt.id 
      });
      // Force notification sync
      window.dispatchEvent(new Event("schedula_notifications_updated"));

      toast.success("Appointment cancelled successfully.");
      setCancellingApt(null);
    } catch (err) {
      toast.error("Failed to cancel appointment.");
    } finally {
      setIsCancelling(false);
    }
  };

  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleStep, setRescheduleStep] = useState<1 | 2>(1);

  const openReschedule = (apt: Appointment) => {
    const slots = getAvailableSlotsForDoctor(apt.doctorId).filter(s => {
      const slotDate = new Date(`${s.date}T${s.startTime}`);
      return slotDate > new Date() && !s.isBooked && !s.isUnavailable;
    });
    setAvailableSlots(slots);
    setReschedulingApt(apt);
    setRescheduleStep(1);
    setSelectedDate("");
    setSelectedSlotId("");
  };

  const availableDates = useMemo(() => {
    const dates = new Set(availableSlots.map(s => s.date));
    return Array.from(dates).sort();
  }, [availableSlots]);

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots.filter(s => s.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedDate, availableSlots]);

  const handleReschedule = async () => {
    if (!reschedulingApt || !patient || !selectedSlotId) return;

    setIsRescheduling(true);

    try {
      if (reschedulingApt.patient.name !== patient.name) {
        toast.error("You can only reschedule your own appointments.");
        return;
      }

      if (new Date(reschedulingApt.startsAt) < new Date()) {
        toast.error("Cannot reschedule past appointments.");
        return;
      }

      const newSlot = availableSlots.find(s => s.id === selectedSlotId);
      // Double check availability
      const currentSlots = getAvailableSlotsForDoctor(reschedulingApt.doctorId);
      const stillAvailable = currentSlots.find(s => s.id === selectedSlotId && !s.isBooked && !s.isUnavailable);
      
      if (!newSlot || !stillAvailable) {
        toast.error("This slot is no longer available. Please select another time.");
        // Refresh slots
        const slots = getAvailableSlotsForDoctor(reschedulingApt.doctorId).filter(s => {
          const slotDate = new Date(`${s.date}T${s.startTime}`);
          return slotDate > new Date() && !s.isBooked && !s.isUnavailable;
        });
        setAvailableSlots(slots);
        setRescheduleStep(1);
        setSelectedSlotId("");
        return;
      }

      // Free old slot
      const oldSlot = getAllSlots().find(s => s.appointmentId === reschedulingApt.id);
      if (oldSlot) {
        freeSlot(oldSlot.id);
      }

      // Book new slot
      markSlotBooked(newSlot.id, reschedulingApt.id);
      
      // Force slot sync
      window.dispatchEvent(new Event("schedula_slots_updated"));

      // Update appointment via Zustand
      store.dispatch(rescheduleAppointment({id: 
        reschedulingApt.id, newDate: newSlot.date, newStartTime: newSlot.startTime
      }));

      // Notify doctor
      const oldDateFormatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(reschedulingApt.startsAt));
      const oldTimeFormatted = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(reschedulingApt.startsAt));
      const newDateFormatted = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${newSlot.date}T${newSlot.startTime}`));
      const newTimeFormatted = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(`${newSlot.date}T${newSlot.startTime}`));
      
      addNotification({ 
        userId: reschedulingApt.doctorId, 
        message: `${patient.name} has rescheduled their appointment from ${oldDateFormatted} at ${oldTimeFormatted} to ${newDateFormatted} at ${newTimeFormatted}.`, 
        type: "rescheduling", 
        appointmentId: reschedulingApt.id 
      });
      window.dispatchEvent(new Event("schedula_notifications_updated"));

      toast.success("Appointment rescheduled successfully.");
      setReschedulingApt(null);
    } catch (err) {
      toast.error("Failed to reschedule appointment.");
    } finally {
      setIsRescheduling(false);
    }
  };

  const { patient } = useAppSelector(state => state.auth);
  const allAppointments = useAppSelector(state => state.appointments.appointments);

  const loadPrescriptions = useCallback((patientApts: Appointment[]) => {
    const pMap: Record<string, Prescription> = {};
    for (const apt of patientApts) {
      if (apt.status === "completed") {
        const p = getPrescriptionByAppointmentId(apt.id);
        if (p) pMap[apt.id] = p;
      }
    }
    setPrescriptions(pMap);
  }, []);

  useEffect(() => {
    if (!patient || patient.role !== "patient") {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPatientName(patient.name);

    const patientAppointments = allAppointments.filter(a => a.patient.name === patient.name);
    patientAppointments.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
    setAppointments(patientAppointments);
    loadPrescriptions(patientAppointments);
    setIsLoading(false);
  }, [patient, allAppointments, loadPrescriptions, router]);

  useEffect(() => {
    const handlePrescriptionUpdate = () => loadPrescriptions(appointments);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_prescriptions") handlePrescriptionUpdate();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_prescriptions_updated", handlePrescriptionUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_prescriptions_updated", handlePrescriptionUpdate);
    };
  }, [appointments, loadPrescriptions]);

  const filteredAppointments = useMemo(() => {
    let result = appointments;
    if (filter !== "all") {
      result = result.filter(a => a.status === filter);
    }
    return [...result].sort((a, b) => {
      const dateA = new Date(a.startsAt).getTime();
      const dateB = new Date(b.startsAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [appointments, filter, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric" }).format(date);
  };

  const formatTime = (startString: string, durationMin: number) => {
    const start = new Date(startString);
    const end = new Date(start.getTime() + durationMin * 60000);
    const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewingApt) {
      addReview(reviewingApt.id, { rating, text: reviewText });
      toast.success("Review submitted successfully");
      setReviewingApt(null);
    }
  };

  const handlePay = (apt: Appointment) => {
    try {
      const payment = processPayment({
        appointmentId: apt.id,
        patientId: apt.patient.name, // Using name as ID for mock
        doctorId: apt.doctorId,
        amount: apt.consultationFee || 100,
        paymentMethod: "Credit Card",
      });
      updateAppointmentData(apt.id, { paymentStatus: "paid", paymentId: payment.paymentId });
      toast.success("Payment successful!");
    } catch (e) {
      toast.error("Payment failed. Please try again.");
    }
  };

  if (!patientName) return null;


  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px]">
        {/* HERO BANNER */}
        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none rounded-r-2xl" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-blue-100 shrink-0">
              <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif mb-1">My Appointments</h1>
              <p className="text-slate-500 text-sm">View and manage your upcoming and previous appointments.</p>
            </div>
          </div>
          
          <Link href="/doctors" className="shrink-0 relative z-10 w-full sm:w-auto">
            <button type="button" className="w-full sm:w-auto bg-[#FF5A5F] hover:bg-[#e0484d] text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              Book an Appointment
            </button>
          </Link>
        </div>

        {/* FILTERS & SORTING */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar w-full xl:w-auto">
            {(["all", "upcoming", "completed", "cancelled", "missed"] as const).map((status) => {
              const count = appointments.filter(a => status === "all" ? true : a.status === status).length;
              const isActive = filter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                    isActive 
                      ? "bg-[#0F2747] border-[#0F2747] text-white shadow-md" 
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {status === "all" && <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>}
                  {status === "upcoming" && <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  {status === "completed" && <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  {status === "cancelled" && <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  {status === "missed" && <svg className="size-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  
                  {status === "all" ? "All Appointments" : status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-primary"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-3 shrink-0 self-end xl:self-auto">
            <span className="text-sm font-medium text-slate-500">Sort by</span>
            <div className="relative">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-primary shadow-sm appearance-none"
              >
                <option value="newest">Date (Newest)</option>
                <option value="oldest">Date (Oldest)</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        {/* APPOINTMENT LIST */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <svg className="animate-spin size-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-medium">Loading your appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center flex flex-col items-center shadow-sm">
            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-serif mb-2">No appointments found</h3>
            <p className="text-slate-500 mb-8 max-w-md text-sm">We could not find any appointments matching your current filters.</p>
            <button onClick={() => setFilter("all")} className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm shadow-sm hover:bg-slate-700 transition-colors">
              View All Appointments
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                
                {/* Status colored left border */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  apt.status === "completed" ? "bg-emerald-500" :
                  apt.status === "confirmed" ? "bg-emerald-500" :
                  apt.status === "cancelled" ? "bg-red-500" :
                  apt.status === "missed" ? "bg-slate-400" :
                  "bg-amber-400"
                }`} />

                {/* Main Card Content */}
                <div className="p-5 pl-7 flex flex-col md:flex-row gap-5 items-start md:items-center">
                  
                  {/* Doctor Info (Left) */}
                  <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                    <div className="size-12 rounded-full bg-blue-50 text-primary font-bold flex items-center justify-center shrink-0 border border-blue-100 text-lg">
                      {apt.clinician.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-extrabold text-slate-900">{apt.clinician}</h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-primary border border-blue-100">
                          {apt.consultationType === "online" ? "Online Consultation" : "In-Person Consultation"}
                        </span>
                        {apt.appointmentType && !["In-Person Consultation", "Video Consultation"].includes(apt.appointmentType) && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                            {apt.appointmentType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-500">{apt.specialty}</p>
                    </div>
                  </div>

                  {/* Schedule Details (Middle) */}
                  <div className="flex flex-col xl:flex-row gap-3 xl:gap-6 flex-1 text-sm font-medium text-slate-600 border-t md:border-0 border-slate-100 pt-4 md:pt-0 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatDate(apt.startsAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatTime(apt.startsAt, apt.durationMinutes)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
                      {apt.consultationType === "online" ? "Video Call" : (apt.room || "Room 20")}
                    </div>
                  </div>

                  {/* Status & Actions (Right) */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-4 md:pt-0 border-t md:border-0 border-slate-100">
                    
                    <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                      {/* Status Badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider self-end ${
                        apt.status === "completed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        apt.status === "confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        apt.status === "cancelled" ? "bg-red-50 text-red-600 border border-red-200" :
                        apt.status === "missed" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                        "bg-amber-50 text-amber-600 border border-amber-200"
                      }`}>
                        <span className={`size-1.5 rounded-full ${
                          apt.status === "completed" || apt.status === "confirmed" ? "bg-emerald-500" :
                          apt.status === "cancelled" ? "bg-red-500" :
                          apt.status === "missed" ? "bg-slate-500" : "bg-amber-500"
                        }`} />
                        {apt.status}
                      </div>

                      {/* Dynamic Action Button */}
                      {apt.status === "confirmed" && apt.consultationType === "online" && (
                        <Link href={`/appointments/${apt.id}/chat`} className="flex items-center gap-1.5 mt-1 text-[13px] font-bold text-slate-700 hover:text-primary transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          Secure Chat
                        </Link>
                      )}
                      {(apt.status === "confirmed" || apt.status === "pending") && apt.consultationType !== "online" && (
                        <button onClick={() => toast.info("Map functionality is not available in this demo.")} className="flex items-center gap-1.5 mt-1 text-[13px] font-bold text-slate-700 hover:text-primary transition-colors bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /></svg>
                          View Location
                        </button>
                      )}
                    </div>

                    <Link href={`/confirmation/${apt.id}`} className="flex items-center justify-center border border-slate-200 text-slate-700 hover:border-primary hover:text-primary transition-colors rounded-xl px-4 py-2.5 text-sm font-bold gap-2 sm:ml-2 shadow-sm bg-white hover:bg-slate-50 w-full sm:w-auto">
                      <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      View Details
                      <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  </div>
                </div>

                {/* Optional Bottom Bar for Payments, Prescriptions, Reviews, and Cancellation */}
                {(apt.consultationFee !== undefined || apt.status === "completed" || isCancellable(apt)) && (
                  <div className="bg-slate-50/80 border-t border-slate-100 px-7 py-3 flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center justify-between">
                    
                    <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto">
                      {/* Payment Status */}
                      {apt.consultationFee !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-500">Fee:</span>
                          <span className="text-sm font-bold text-slate-900">${apt.consultationFee}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            apt.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" :
                            apt.paymentStatus === "failed" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {apt.paymentStatus || "PENDING"}
                          </span>
                          {(!apt.paymentStatus || apt.paymentStatus === "pending" || apt.paymentStatus === "failed") && (
                            <button onClick={() => handlePay(apt)} className="ml-1 text-xs font-bold bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
                              Pay Now
                            </button>
                          )}
                        </div>
                      )}

                      {/* Prescription */}
                      {apt.status === "completed" && (
                        <div className="flex items-center gap-2">
                          {apt.consultationFee !== undefined && <span className="text-slate-300 hidden sm:inline">|</span>}
                          {prescriptions[apt.id] ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Prescription
                              </span>
                              <button onClick={() => setViewingPrescription({apt, p: prescriptions[apt.id]})} className="text-[13px] font-bold text-primary hover:underline">
                                View
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm font-medium text-slate-400">No Prescription</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                      {/* Reviews and Rebook */}
                      {apt.status === "completed" && (
                        <div className="flex items-center gap-3">
                          {!apt.review ? (
                            <button onClick={() => setReviewingApt(apt)} className="text-[13px] font-bold text-slate-600 hover:text-amber-500 transition-colors flex items-center gap-1">
                              <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              Add Review
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-[13px] font-bold text-amber-500">
                              <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              {apt.review.rating}/5
                            </div>
                          )}
                          <span className="text-slate-300">|</span>
                          <Link href={`/doctors?rebook=${apt.doctorId}`} className="text-[13px] font-bold text-primary hover:underline">
                            Book Again
                          </Link>
                        </div>
                      )}

                      {/* Reschedule and Cancel */}
                      {isCancellable(apt) && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => openReschedule(apt)} className="text-[13px] font-bold text-primary hover:underline transition-all">
                            Reschedule
                          </button>
                          <span className="text-slate-300">|</span>
                          <button onClick={() => setCancellingApt(apt)} className="text-[13px] font-bold text-red-500 hover:text-red-700 hover:underline transition-all">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


      </div>

      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 font-serif">Cancel Appointment?</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Are you sure you want to cancel your appointment with <strong>{cancellingApt.clinician}</strong> on <strong>{formatDate(cancellingApt.startsAt)}</strong> at <strong>{formatTime(cancellingApt.startsAt, cancellingApt.durationMinutes)}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2 border-t border-border mt-2">
              <button 
                type="button" 
                onClick={() => setCancellingApt(null)} 
                disabled={isCancelling}
                className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button 
                type="button" 
                onClick={handleCancelAppointment}
                disabled={isCancelling}
                className="rounded-lg bg-error px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Cancelling...
                  </>
                ) : (
                  "Cancel Appointment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {reschedulingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 font-serif">Reschedule Appointment</h2>
            
            {rescheduleStep === 1 ? (
              <div className="space-y-4">
                <p className="text-text-secondary">
                  Current: <strong>{formatDate(reschedulingApt.startsAt)}</strong> at <strong>{formatTime(reschedulingApt.startsAt, reschedulingApt.durationMinutes)}</strong>
                </p>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Select New Date</label>
                  <select 
                    value={selectedDate} 
                    onChange={e => { setSelectedDate(e.target.value); setSelectedSlotId(""); }} 
                    className="w-full rounded-lg border border-border px-3 py-2 outline-none"
                  >
                    <option value="" disabled>-- Select a date --</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{formatDate(`${date}T00:00:00`)}</option>
                    ))}
                  </select>
                </div>
                {selectedDate && (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Select Available Time</label>
                    {slotsForDate.length === 0 ? (
                      <p className="text-sm text-text-secondary">No slots available for this date.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slotsForDate.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlotId(slot.id)}
                            className={`px-3 py-2 text-sm rounded-lg border text-center transition-all ${
                              selectedSlotId === slot.id 
                                ? "bg-primary text-white border-primary" 
                                : "bg-white text-text-primary border-border hover:border-primary hover:text-primary"
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                  <button 
                    type="button" 
                    onClick={() => setReschedulingApt(null)} 
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRescheduleStep(2)}
                    disabled={!selectedSlotId}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-background rounded-xl p-4 border border-border">
                  <h3 className="text-sm font-semibold text-text-secondary uppercase mb-2">Current Appointment</h3>
                  <p className="font-medium text-text-primary">{reschedulingApt.clinician}</p>
                  <p className="text-text-secondary">{formatDate(reschedulingApt.startsAt)} at {formatTime(reschedulingApt.startsAt, reschedulingApt.durationMinutes)}</p>
                </div>

                <div className="flex justify-center text-primary py-1">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                  <h3 className="text-sm font-semibold text-success uppercase mb-2">New Appointment</h3>
                  <p className="font-bold text-text-primary">{reschedulingApt.clinician}</p>
                  {(() => {
                    const selectedSlot = availableSlots.find(s => s.id === selectedSlotId);
                    if (!selectedSlot) return null;
                    return (
                      <p className="font-bold text-success">{formatDate(`${selectedSlot.date}T00:00:00`)} at {selectedSlot.startTime}</p>
                    );
                  })()}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                  <button 
                    type="button" 
                    onClick={() => setRescheduleStep(1)} 
                    disabled={isRescheduling}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                  >
                    Go Back
                  </button>
                  <button 
                    type="button" 
                    onClick={handleReschedule}
                    disabled={isRescheduling}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isRescheduling ? (
                      <>
                        <svg className="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Confirming...
                      </>
                    ) : (
                      "Confirm Reschedule"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    
    </main>
  );
}
