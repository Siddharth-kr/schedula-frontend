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
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--canvas)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {status === "loading" && (
          <div className="space-y-4" aria-busy="true">
            <div className="mx-auto size-16 animate-pulse rounded-full bg-slate-200" />
            <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-100" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center shadow-sm" role="alert">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-[var(--error)] mb-5">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-[var(--error)]">Appointment not found</p>
            <Link href="/" className="mt-5 inline-block rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-[var(--error)] hover:bg-red-50 shadow-sm transition-colors">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "ready" && appointment && (
          <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white text-center shadow-xl shadow-[var(--brand)]/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[var(--success)]/10 px-6 py-12 sm:px-10">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[var(--success)] text-white shadow-md ring-8 ring-[var(--success)]/20">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] font-serif">
                {appointment.status === 'completed' ? 'Appointment Completed' : appointment.status === 'missed' ? 'Appointment Missed' : appointment.status === 'cancelled' ? 'Appointment Cancelled' : 'Booking Details'}
              </h1>
              <p className="mt-3 text-sm font-medium text-[var(--success)]">
                Your appointment with {appointment.clinician} is currently {appointment.status}.
              </p>
            </div>
            
            <div className="px-6 py-8 text-left sm:px-10">
              <dl className="space-y-6 text-sm">
                <div className="flex justify-between border-b border-[var(--line)] pb-5">
                  <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Patient</dt>
                  <dd className="font-bold text-[var(--ink)] text-right text-base">{appointment.patient.name}</dd>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-5">
                  <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Doctor</dt>
                  <dd className="font-bold text-[var(--ink)] text-right text-base">
                    {appointment.clinician}
                    <span className="block text-right text-sm font-semibold text-[var(--brand)] mt-0.5">{appointment.specialty}</span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-5">
                  <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Date & Time</dt>
                  <dd className="font-bold text-[var(--ink)] text-right text-base">
                    {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    <br />
                    <span className="text-[var(--muted)] text-sm">
                      {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Status</dt>
                  <dd>
                    <AppointmentStatusBadge status={appointment.status} />
                  </dd>
                </div>
              </dl>
              
              {appointment.status === "completed" && (
                <div className="mt-8 space-y-4 border-t border-[var(--line)] pt-6">
                  {appointment.prescription ? (
                    <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-4 text-left">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-[var(--ink)]">Prescription Available</h3>
                        <button className="text-xs font-bold text-[var(--brand)] hover:underline" onClick={() => toast.success("Prescription downloaded successfully.")}>
                          Download PDF
                        </button>
                      </div>
                      <p className="text-xs text-[var(--muted)] mb-1"><strong>Diagnosis:</strong> {appointment.prescription.diagnosis}</p>
                      <p className="text-xs text-[var(--muted)] mb-1"><strong>Medicines:</strong> {appointment.prescription.medicines}</p>
                      <p className="text-xs text-[var(--muted)]"><strong>Instructions:</strong> {appointment.prescription.instructions}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[var(--line)] bg-slate-50 p-4 text-center">
                      <p className="text-sm font-medium text-[var(--muted)]">Prescription Not Available</p>
                    </div>
                  )}

                  {!appointment.review && !isReviewing && (
                    <button className="w-full rounded-xl border border-[var(--brand)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--brand)] shadow-sm transition-all hover:bg-[var(--brand)]/5" onClick={() => setIsReviewing(true)}>
                      Review Doctor
                    </button>
                  )}
                  {isReviewing && (
                    <div className="rounded-xl border border-[var(--line)] bg-slate-50 p-4 text-left">
                      <h3 className="font-bold text-[var(--ink)] mb-3 text-sm">Write a Review</h3>
                      <div className="mb-3 flex items-center gap-2">
                        <label className="text-xs font-semibold text-[var(--muted)]">Rating:</label>
                        <select className="rounded border border-[var(--line)] px-2 py-1 text-sm outline-none bg-white" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                        </select>
                      </div>
                      <textarea className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)] mb-3 bg-white" rows={3} placeholder="Optional review..." value={reviewText} onChange={(e) => setReviewText(e.target.value)}></textarea>
                      <div className="flex justify-end gap-2">
                        <button className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-slate-200 transition-colors" onClick={() => setIsReviewing(false)}>Cancel</button>
                        <button className="rounded-lg bg-[var(--brand)] px-4 py-1.5 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors shadow-sm" onClick={() => {
                          addReview(appointment.id, { rating, text: reviewText });
                          setAppointment({...appointment, review: { rating, text: reviewText }});
                          setIsReviewing(false);
                          toast.success("Review submitted successfully.");
                        }}>Submit Review</button>
                      </div>
                    </div>
                  )}
                  {appointment.review && (
                    <div className="rounded-xl border border-[var(--line)] bg-white p-4 text-left">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">Your Review</h3>
                      <p className="text-sm text-[var(--ink)] font-medium">Rating: {appointment.review.rating} / 5</p>
                      {appointment.review.text && <p className="text-sm text-[var(--muted)] mt-1">{appointment.review.text}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50/80 px-6 py-8 sm:flex sm:flex-row-reverse sm:gap-4 sm:px-10 border-t border-[var(--line)]">
              <Link 
                href="/doctors"
                className="block w-full rounded-xl bg-[var(--brand)] px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-[var(--brand)]/20 transition-all hover:bg-[var(--brand-deep)] active:scale-[0.98] sm:w-auto text-center"
              >
                {appointment.status === 'completed' ? 'Rebook Appointment' : 'Book Another'}
              </Link>
              <Link 
                href="/appointments"
                className="mt-3 block w-full rounded-xl border border-[var(--line)] bg-white px-5 py-3.5 text-sm font-bold text-[var(--ink)] shadow-sm transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-[0.98] sm:mt-0 sm:w-auto text-center"
              >
                My Appointments
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
