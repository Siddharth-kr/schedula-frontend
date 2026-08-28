"use client";

import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";

export default function DoctorsPage() {
  const { data: doctors, status } = useDoctors();

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Our Specialists</h1>
          <p className="mt-2 text-[var(--muted)]">Find and book an appointment with our experienced doctors.</p>
        </header>

        {status === "loading" && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading doctors">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 w-full animate-pulse rounded-xl bg-stone-100 sm:h-32" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">We couldn&apos;t load the doctors list.</p>
            <button 
              className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && doctors.length > 0 && (
          <div className="flex flex-col gap-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {status === "ready" && doctors.length === 0 && (
          <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
            <p className="text-lg font-medium text-[var(--ink)]">No doctors available</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Please check back later.</p>
          </div>
        )}
      </div>
    </main>
  );
}
