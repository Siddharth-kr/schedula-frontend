"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDoctor } from "@/features/doctors/api/get-doctor";
import type { Doctor } from "@/types/doctor";
import { BookingForm } from "@/features/booking/components/BookingForm";

export default function BookingPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!doctorId) return;
    
    getDoctor(doctorId)
      .then((doc) => {
        setDoctor(doc);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [doctorId]);

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {status === "loading" && (
          <div className="space-y-4" aria-busy="true">
            <div className="h-10 w-1/3 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-64 w-full animate-pulse rounded-xl bg-stone-100" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">Doctor not found.</p>
            <a href="/doctors" className="mt-4 inline-block rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              Back to Doctors
            </a>
          </div>
        )}

        {status === "ready" && doctor && (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Book Appointment</h1>
              <p className="mt-2 text-[var(--muted)]">Complete your booking with {doctor.name}.</p>
            </header>

            <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
              <BookingForm doctor={doctor} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
