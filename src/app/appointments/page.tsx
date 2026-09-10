"use client";

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
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/authStore";
import { useAppointmentStore } from "@/store/appointmentStore";
import { getAllSlots, freeSlot, markSlotBooked, getAvailableSlotsForDoctor } from "@/lib/availability-store";
import type { AvailabilitySlot } from "@/types/availability";
import { addNotification } from "@/lib/notification-store";

type FilterStatus = "all" | AppointmentStatus;

export default function PatientAppointmentsPage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});
  const [filter, setFilter] = useState<FilterStatus>("all");
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
      useAppointmentStore.getState().updateAppointmentStatus(cancellingApt.id, "cancelled");

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
      useAppointmentStore.getState().rescheduleAppointment(
        reschedulingApt.id, 
        newSlot.date, 
        newSlot.startTime
      );

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

  const { patient } = useAuthStore();
  const allAppointments = useAppointmentStore(state => state.appointments);

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
    if (filter === "all") return appointments;
    return appointments.filter(a => a.status === filter);
  }, [appointments, filter]);

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
    <main className="min-h-[calc(100vh-4rem)] bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-4 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-serif mb-2">My Appointments</h1>
            <p className="text-text-secondary">View and manage your upcoming and previous appointments.</p>
          </div>
          <Link href="/doctors" className="shrink-0">
            <Button type="button" variant="accent">Book an Appointment</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-secondary space-y-4">
            <p className="font-medium">Loading your appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-8 text-center flex flex-col items-center shadow-sm">
            <h3 className="text-xl font-bold text-text-primary font-serif mb-2">No appointments yet</h3>
            <p className="text-text-secondary mb-8 max-w-md">You haven&apos;t booked any appointments yet.</p>
            <Link href="/doctors">
              <Button type="button" className="px-8">Find a Doctor</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {(["all", "upcoming", "completed", "cancelled", "missed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === status 
                      ? "bg-primary-dark text-white shadow-sm" 
                      : "bg-white border border-border text-text-secondary hover:border-primary hover:text-text-primary"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-text-secondary">No appointments found for the selected filter.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="flex flex-col bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between p-6 gap-6">
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                            Dr. {apt.clinician}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                            {apt.appointmentType || "In-person Consultation"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text-secondary mb-3">{apt.specialty}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-text-primary">
                          <span className="font-medium">{formatDate(apt.startsAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                          <span>{formatTime(apt.startsAt, apt.durationMinutes)}</span>
                        </div>
                        
                        {/* PAYMENT SECTION */}
                        {(apt.consultationFee !== undefined) && (
                          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border">
                            <span className="text-sm text-text-secondary">Fee:</span>
                            <span className="text-sm font-bold text-text-primary">${apt.consultationFee}</span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              apt.paymentStatus === 'paid' ? 'bg-success/10 text-success' :
                              apt.paymentStatus === 'refunded' ? 'bg-slate-100 text-slate-500' :
                              apt.paymentStatus === 'failed' ? 'bg-error/10 text-error' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {apt.paymentStatus ? apt.paymentStatus.toUpperCase() : 'PENDING'}
                            </span>
                            {(!apt.paymentStatus || apt.paymentStatus === 'pending' || apt.paymentStatus === 'failed') && (
                              <button
                                onClick={() => handlePay(apt)}
                                className="ml-2 text-xs font-bold bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark transition-colors"
                              >
                                Pay Now
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end sm:text-right gap-4 border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto shrink-0">
                        <div className="flex flex-col gap-2 items-end">
                          {apt.status === "completed" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Completed</span>}
                          {apt.status === "confirmed" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success">Confirmed</span>}
                          {apt.status === "pending" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-background0/10 text-text-secondary">Pending</span>}
                          {apt.status === "cancelled" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-error/10 text-error">Cancelled</span>}
                          
                          {/* TELEMEDICINE ACTIONS */}
                          {(apt.status === "confirmed" || apt.status === "completed") && (apt.appointmentType === "Video Consultation") && (
                            <Link href={`/appointments/${apt.id}/video`}>
                              <button className="flex items-center gap-1.5 mt-2 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                Join Video
                              </button>
                            </Link>
                          )}
                          {(apt.status === "confirmed" || apt.status === "completed") && (apt.appointmentType === "Secure Chat" || apt.appointmentType === "Video Consultation") && (
                            <Link href={`/appointments/${apt.id}/chat`}>
                              <button className="flex items-center gap-1.5 mt-1 text-xs font-bold border border-border text-text-primary px-3 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors bg-white">
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                Secure Chat
                              </button>
                            </Link>
                          )}

                          <Link href={`/confirmation/${apt.id}`} className="mt-2 text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-all">
                            View Details
                          </Link>

                          {isCancellable(apt) && (
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => openReschedule(apt)}
                                className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-all"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setCancellingApt(apt)}
                                className="text-sm font-semibold text-error hover:text-red-700 hover:underline transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {apt.status === "completed" && (
                      <div className="bg-background border-t border-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                          {prescriptions[apt.id] ? (
                            <>
                              <span className="text-sm font-bold text-emerald-600">Prescription Available</span>
                              <button onClick={() => setViewingPrescription({apt, p: prescriptions[apt.id]})} className="text-sm font-semibold text-primary hover:underline border-l pl-2 ml-2 border-border">
                                View Prescription
                              </button>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-text-secondary">Prescription Not Available</span>
                          )}
                        </div>
                        <div className="flex gap-3 items-center">
                          {!apt.review ? (
                            <button onClick={() => setReviewingApt(apt)} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors">
                              Review
                            </button>
                          ) : (
                            <span className="text-sm text-text-secondary">â˜… {apt.review.rating}/5</span>
                          )}
                          <Link href={`/booking/${apt.doctorId}`}>
                            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors">
                              Rebook
                            </button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {viewingPrescription && (
        <UserPrescription 
          prescription={viewingPrescription.p} 
          appointment={viewingPrescription.apt} 
          onClose={() => setViewingPrescription(null)} 
        />
      )}

      {reviewingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">How was your appointment?</h2>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Rating</label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 outline-none">
                  <option value={5}>â˜…â˜…â˜…â˜…â˜… (5)</option>
                  <option value={4}>â˜…â˜…â˜…â˜…â˜† (4)</option>
                  <option value={3}>â˜…â˜…â˜…â˜†â˜† (3)</option>
                  <option value={2}>â˜…â˜…â˜†â˜†â˜† (2)</option>
                  <option value={1}>â˜…â˜†â˜†â˜†â˜† (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Review (Optional)</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 outline-none" placeholder="Write your review..."></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewingApt(null)} className="px-4 py-2 text-sm font-medium text-text-secondary">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cancellingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-4 font-serif">Cancel Appointment?</h2>
            <p className="text-text-secondary mb-6 leading-relaxed">
              Are you sure you want to cancel your appointment with <strong>Dr. {cancellingApt.clinician}</strong> on <strong>{formatDate(cancellingApt.startsAt)}</strong> at <strong>{formatTime(cancellingApt.startsAt, cancellingApt.durationMinutes)}</strong>?
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
                  <p className="font-medium text-text-primary">Dr. {reschedulingApt.clinician}</p>
                  <p className="text-text-secondary">{formatDate(reschedulingApt.startsAt)} at {formatTime(reschedulingApt.startsAt, reschedulingApt.durationMinutes)}</p>
                </div>

                <div className="flex justify-center text-primary py-1">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                <div className="bg-success/10 rounded-xl p-4 border border-success/20">
                  <h3 className="text-sm font-semibold text-success uppercase mb-2">New Appointment</h3>
                  <p className="font-bold text-text-primary">Dr. {reschedulingApt.clinician}</p>
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
