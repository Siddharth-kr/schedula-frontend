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
    <main className="min-h-screen bg-background py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {status === "loading" && (
          <div className="space-y-6 max-w-4xl mx-auto" aria-busy="true">
            <div className="h-10 w-1/3 animate-pulse rounded-lg bg-stone-200" />
            <div className="h-[500px] w-full animate-pulse rounded-2xl bg-stone-100" />
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-error/10 p-10 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">Doctor not found.</p>
            <Link href="/doctors" className="mt-4 inline-block rounded-lg border border-error/30 bg-white px-4 py-2 text-sm font-semibold text-error shadow-sm hover:bg-error/10 active:scale-[0.98]">
              Back to Doctors
            </Link>
          </div>
        )}

        {status === "ready" && doctor && (
          <BookingForm doctor={doctor} />
        )}
      </div>
    </main>
  );
}
