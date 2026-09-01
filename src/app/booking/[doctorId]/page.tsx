"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        {status === "loading" && (
          <div className="space-y-6" aria-busy="true">
            <div className="h-10 w-1/3 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-[500px] w-full animate-pulse rounded-2xl bg-stone-100" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">Doctor not found.</p>
            <Link href="/doctors" className="mt-4 inline-block rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98]">
              Back to Doctors
            </Link>
          </div>
        )}

        {status === "ready" && doctor && (
          <>
            <header className="mb-8 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">Book Appointment</h1>
              <p className="mt-3 text-base text-[var(--muted)]">Complete your booking with <span className="font-semibold text-[var(--ink)]">{doctor.name}</span>.</p>
            </header>

            <div className="rounded-3xl border border-[var(--line)] bg-stone-50/30 p-4 sm:p-6">
              <BookingForm doctor={doctor} />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
