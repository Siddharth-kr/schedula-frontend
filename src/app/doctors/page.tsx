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
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--canvas)] px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] font-serif">Our Specialists</h1>
            <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">Find the right specialist and book an appointment instantly.</p>
          </div>
          <div className="w-full sm:w-80">
            <Input 
              label="" 
              placeholder="Search by name or specialty..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {status === "loading" && (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading doctors">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-64 w-full animate-pulse rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center" role="alert">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-red-100 text-[var(--error)] mb-4">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-[var(--error)]">We couldn&apos;t load the doctors list.</p>
            <button 
              className="mt-4 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--error)] shadow-sm hover:bg-red-50 active:scale-[0.98] transition-colors"
              onClick={() => window.location.reload()}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && filteredDoctors.length > 0 && (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {status === "ready" && filteredDoctors.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-slate-50/50 p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-slate-100 text-[var(--muted)] mb-5">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xl font-bold text-[var(--ink)] font-serif">No doctors found</p>
            <p className="mt-2 text-base text-[var(--muted)]">Try adjusting your search query.</p>
          </div>
        )}
      </div>
    </main>
  );
}
