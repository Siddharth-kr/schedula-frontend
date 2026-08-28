"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAppointment } from "@/features/appointments/api/get-appointment";
import type { Appointment } from "@/types/appointment";

export default function ConfirmationPage() {
  const params = useParams();
  const appointmentId = params.appointmentId as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

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
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg">
        {status === "loading" && (
          <div className="space-y-4" aria-busy="true">
            <div className="mx-auto size-16 animate-pulse rounded-full bg-stone-200" />
            <div className="h-40 w-full animate-pulse rounded-2xl bg-stone-100" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">Appointment not found.</p>
            <Link href="/" className="mt-4 inline-block rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === "ready" && appointment && (
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-center shadow-sm">
            <div className="bg-emerald-50 px-6 py-8">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Booking Confirmed!</h1>
              <p className="mt-2 text-sm text-emerald-700">
                Your appointment with {appointment.clinician} has been successfully scheduled.
              </p>
            </div>
            
            <div className="px-6 py-6 text-left">
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-[var(--line)] pb-4">
                  <dt className="text-[var(--muted)]">Patient</dt>
                  <dd className="font-medium text-[var(--ink)]">{appointment.patient.name}</dd>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-4">
                  <dt className="text-[var(--muted)]">Doctor</dt>
                  <dd className="font-medium text-[var(--ink)]">
                    {appointment.clinician}
                    <span className="block text-right text-xs font-normal text-[var(--muted)]">{appointment.specialty}</span>
                  </dd>
                </div>
                <div className="flex justify-between border-b border-[var(--line)] pb-4">
                  <dt className="text-[var(--muted)]">Date & Time</dt>
                  <dd className="font-medium text-[var(--ink)]">
                    {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    <br />
                    <span className="text-[var(--muted)]">
                      {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--muted)]">Status</dt>
                  <dd className="font-medium capitalize text-emerald-600">{appointment.status}</dd>
                </div>
              </dl>
            </div>
            
            <div className="bg-stone-50 px-6 py-5 sm:flex sm:flex-row-reverse sm:gap-3">
              <Link 
                href="/doctors"
                className="block w-full rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-deep)] sm:w-auto"
              >
                Book Another
              </Link>
              <Link 
                href="/"
                className="mt-3 block w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] hover:bg-stone-50 sm:mt-0 sm:w-auto"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
