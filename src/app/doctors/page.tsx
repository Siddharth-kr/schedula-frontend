"use client";

import { useState } from "react";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";
import { Input } from "@/components/ui/Input";

export default function DoctorsPage() {
  const { data: doctors, status } = useDoctors();
  const [search, setSearch] = useState("");

  const filteredDoctors = doctors.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase()) || 
    doc.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">Our Specialists</h1>
            <p className="mt-2 max-w-2xl text-base text-[var(--muted)]">Find the right specialist and book an appointment instantly.</p>
          </div>
          <div className="w-full sm:w-72">
            <Input 
              label="Search doctors" 
              placeholder="Search by name or specialty..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {status === "loading" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading doctors">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-72 w-full animate-pulse rounded-2xl bg-stone-100 ring-1 ring-stone-200" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-10 text-center" role="alert">
            <p className="text-lg font-medium text-red-800">We couldn&apos;t load the doctors list.</p>
            <button 
              className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 active:scale-[0.98]"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && filteredDoctors.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {status === "ready" && filteredDoctors.length === 0 && (
          <div className="rounded-xl border border-[var(--line)] bg-white p-12 text-center">
            <p className="text-lg font-medium text-[var(--ink)]">No doctors available</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Please check back later.</p>
          </div>
        )}
      </div>
    </main>
  );
}
