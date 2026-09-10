"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAppointment } from "@/features/appointments/api/get-appointment";
import { addReview } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";
import { toast } from "react-toastify";

export default function ConfirmationPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isReviewing, setIsReviewing] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (!appointmentId) return;
    
    getAppointment(appointmentId)
      .then((apt) => {
        setAppointment(apt);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [appointmentId]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {status === "loading" && (
          <div className="space-y-4" aria-busy="true">
            <div className="mx-auto size-16 animate-pulse rounded-full bg-slate-200" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-background" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-error/10 p-10 text-center shadow-sm" role="alert">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-error mb-5">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-error">Appointment not found</p>
            <Link href="/" className="mt-5 inline-block rounded-xl border border-error/30 bg-white px-5 py-2.5 text-sm font-bold text-error hover:bg-error/10 shadow-sm transition-colors">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "ready" && appointment && (
          <div className="overflow-hidden rounded-3xl border border-border bg-white text-center shadow-xl shadow-[var(--color-primary)]/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-success/10 px-6 py-12 sm:px-10">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-success text-white shadow-md ring-8 ring-[var(--success)]/20">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary font-serif">
                {appointment.status === 'completed' ? 'Appointment Completed' : appointment.status === 'missed' ? 'Appointment Missed' : appointment.status === 'cancelled' ? 'Appointment Cancelled' : 'Booking Details'}
              </h1>
              <p className="mt-3 text-sm font-medium text-success">
                Your appointment with {appointment.clinician} is currently {appointment.status}.
              </p>
            </div>
            
            <div className="px-6 py-8 text-left sm:px-10">
              <dl className="space-y-6 text-sm">
                <div className="flex justify-between border-b border-border pb-5">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Patient</dt>
                  <dd className="font-bold text-text-primary text-right text-base">{appointment.patient.name}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-5">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Doctor</dt>
                  <dd className="font-bold text-text-primary text-right text-base">
                    {appointment.clinician}
                    <span className="block text-right text-sm font-semibold text-primary mt-0.5">{appointment.specialty}</span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border pb-5">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Date & Time</dt>
                  <dd className="font-bold text-text-primary text-right text-base">
                    {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    <br />
                    <span className="text-text-secondary text-sm">
                      {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border pb-5">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Type</dt>
                  <dd className="font-bold text-text-primary text-right text-base">{appointment.appointmentType || "Consultation"}</dd>
                </div>
                <div className="flex justify-between border-b border-border pb-5">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Appointment ID</dt>
                  <dd className="font-mono text-sm text-text-secondary text-right">{appointment.id}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-text-secondary font-semibold uppercase tracking-wider text-xs">Status</dt>
                  <dd>
                    <AppointmentStatusBadge status={appointment.status} />
                  </dd>
                </div>
              </dl>
              
              {appointment.status === "completed" && (
                <div className="mt-8 space-y-4 border-t border-border pt-6">
                  {appointment.prescription ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-text-primary">Prescription Available</h3>
                        <button className="text-xs font-bold text-primary hover:underline" onClick={() => toast.success("Prescription downloaded successfully.")}>
                          Download PDF
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary mb-1"><strong>Diagnosis:</strong> {appointment.prescription.diagnosis}</p>
                      <p className="text-xs text-text-secondary mb-1"><strong>Medicines:</strong> {appointment.prescription.medicines}</p>
                      <p className="text-xs text-text-secondary"><strong>Instructions:</strong> {appointment.prescription.instructions}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background p-4 text-center">
                      <p className="text-sm font-medium text-text-secondary">Prescription Not Available</p>
                    </div>
                  )}

                  {!appointment.review && !isReviewing && (
                    <button className="w-full rounded-xl border border-primary bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary/5" onClick={() => setIsReviewing(true)}>
                      Review Doctor
                    </button>
                  )}
                  {isReviewing && (
                    <div className="rounded-xl border border-border bg-background p-4 text-left">
                      <h3 className="font-bold text-text-primary mb-3 text-sm">Write a Review</h3>
                      <div className="mb-3 flex items-center gap-2">
                        <label className="text-xs font-semibold text-text-secondary">Rating:</label>
                        <select className="rounded border border-border px-2 py-1 text-sm outline-none bg-white" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </select>
                      </div>
                      <textarea className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary mb-3 bg-white" rows={3} placeholder="Optional review..." value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-slate-200 transition-colors" onClick={() => setIsReviewing(false)}>Cancel</button>
                        <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm" onClick={() => {
                          addReview(appointment.id, { rating, text: reviewText });
                          setAppointment({...appointment, review: { rating, text: reviewText }});
                          setIsReviewing(false);
                          toast.success("Review submitted successfully.");
                        }}>Submit Review</button>
                      </div>
                    </div>
                  )}
                  {appointment.review && (
                    <div className="rounded-xl border border-border bg-white p-4 text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Your Review</h3>
                      <p className="text-sm text-text-primary font-medium">Rating: {appointment.review.rating} / 5</p>
                      {appointment.review.text && <p className="text-sm text-text-secondary mt-1">{appointment.review.text}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-background/80 px-6 py-8 flex flex-col sm:flex-row gap-4 sm:justify-end border-t border-border">
              <Link href="/" className="block w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98] sm:w-auto text-center">
                Back to Dashboard
              </Link>
              <Link href="/appointments" className="block w-full rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-bold text-text-primary shadow-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98] sm:w-auto text-center">
                View My Appointments
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
