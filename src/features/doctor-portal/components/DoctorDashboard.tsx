"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession, clearDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import type { Appointment } from "@/types/appointment";

export function DoctorDashboard() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Authenticate doctor session
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    // 2. Fetch all appointments and filter for this doctor
    async function fetchAppointments() {
      setDoctor(session);
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const json = await res.json();
        
        // Filter appointments strictly by clinician name matching the logged-in doctor
        const allAppointments: Appointment[] = json.data || [];
        const myAppointments = allAppointments.filter(
          (apt) => apt.clinician === session!.name
        );
        
        // Sort by date ascending (closest first)
        myAppointments.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        
        setAppointments(myAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, [router]);

  if (isLoading || !doctor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--brand)]"></div>
          <p className="text-sm font-medium text-[var(--muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearDoctorSession();
    router.push("/doctor/login");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-6 border-b border-[var(--line)] pb-8 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] font-serif">
            Welcome, {doctor.name}
          </h1>
          <p className="mt-2.5 max-w-xl text-base text-[var(--muted)]">
            Here is your schedule and practice overview.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:bg-slate-50 hover:text-[var(--error)] active:scale-[0.98]"
        >
          Sign out
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Column: Appointments */}
        <div className="lg:col-span-2 space-y-8">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] bg-slate-50/50 px-6 py-5">
              <h2 className="font-semibold text-[var(--ink)]">Upcoming Appointments</h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-[var(--line)]">
                {appointments.length} Total
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-slate-50/30 py-16 text-center">
                <div className="grid size-14 place-items-center rounded-full bg-slate-100 text-[var(--muted)]">
                  <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mt-5 text-base font-semibold text-[var(--ink)]">No upcoming appointments</h3>
                <p className="mt-2 text-sm text-[var(--muted)] max-w-sm">Your schedule is currently clear. Ensure your availability is set.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line)]" role="list">
                {appointments.map((apt) => {
                  const aptDate = new Date(apt.startsAt);
                  const dateStr = aptDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });
                  const timeStr = aptDate.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  
                  return (
                    <li
                      key={apt.id}
                      className="flex flex-col justify-between gap-4 px-6 py-5 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--brand)]/10 text-base font-bold text-[var(--brand-deep)] ring-1 ring-[var(--brand)]/20">
                          {apt.patient.initials}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[var(--ink)] text-base">{apt.patient.name}</h4>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm font-medium text-[var(--muted)]">
                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {dateStr}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
                            apt.status === "confirmed"
                              ? "bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/20"
                              : apt.status === "pending"
                              ? "bg-amber-50 text-amber-800 ring-amber-200"
                              : "bg-[var(--error)]/10 text-[var(--error)] ring-[var(--error)]/20"
                          }`}
                        >
                          {apt.status}
                        </span>
                        <span className="text-sm font-medium text-[var(--muted)] bg-slate-50 px-2 py-0.5 rounded border border-[var(--line)]">{apt.reason}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right Column: Quick Actions & Profile */}
        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
            <h2 className="border-b border-[var(--line)] bg-slate-50/50 px-6 py-5 font-semibold text-[var(--ink)]">Quick Actions</h2>
            <div className="flex flex-col p-4 gap-2">
              <Link
                href="/doctor/profile"
                className="group flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">My Profile</span>
                </div>
                <svg className="size-4 text-[var(--muted)] group-hover:text-[var(--brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link
                href="/doctor/appointments"
                className="group flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">All Appointments</span>
                </div>
                <svg className="size-4 text-[var(--muted)] group-hover:text-[var(--brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/doctor/availability"
                className="group flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Manage Availability</span>
                </div>
                <svg className="size-4 text-[var(--muted)] group-hover:text-[var(--brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          {/* Profile Snapshot Card */}
          <section className="rounded-2xl bg-[var(--ink)] p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="size-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-200">Practice Snapshot</h3>
            <div className="mt-5 flex items-center gap-4 relative z-10">
              <div className="grid size-14 place-items-center rounded-full bg-white/10 font-serif text-xl font-bold text-white ring-1 ring-white/20">
                {doctor.name.replace("Dr. ", "").charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white text-lg">{doctor.name}</p>
                <p className="text-sm font-medium text-[var(--brand)] brightness-125">{doctor.specialty}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 relative z-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Experience</p>
                <p className="mt-1 font-bold text-lg">{doctor.experienceYears} Years</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Consultation Fee</p>
                <p className="mt-1 font-bold text-lg">${doctor.consultationFee}</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
