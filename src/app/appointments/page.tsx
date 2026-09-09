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
    </main>
  );
}
