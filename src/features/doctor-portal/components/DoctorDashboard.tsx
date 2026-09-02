"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession, clearDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import type { Appointment } from "@/types/appointment";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import { DashboardCalendar } from "./DashboardCalendar";

export function DoctorDashboard() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [todayMetrics, setTodayMetrics] = useState({
    total: 0,
    confirmed: 0,
    cancelled: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Authenticate doctor session
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    async function fetchAppointments() {
      if (!session) return;
      setDoctor(session);
      try {
        const myAppointments = getAppointmentsForDoctor(session.id);
        
        // Compute today's metrics
        const todayStr = new Date().toISOString().split("T")[0];
        const todaysAppointments = myAppointments.filter((apt: Appointment) => apt.startsAt.startsWith(todayStr));
        
        setTodayMetrics({
          total: todaysAppointments.length,
          confirmed: todaysAppointments.filter((a: Appointment) => a.status === "confirmed").length,
          cancelled: todaysAppointments.filter((a: Appointment) => a.status === "cancelled").length,
          pending: todaysAppointments.filter((a: Appointment) => a.status === "pending").length,
        });
        
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments") {
        fetchAppointments();
      }
    };
    const handleCustomChange = () => fetchAppointments();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
    };
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      {/* 4-Card Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Bookings */}
        <div className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">Today&apos;s Bookings</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-serif text-3xl font-bold text-[var(--ink)]">{todayMetrics.total}</span>
            <span className="mb-1 text-xs font-medium text-[var(--muted)]">appointments today</span>
          </div>
        </div>

        {/* Confirmed */}
        <div className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">Confirmed</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-serif text-3xl font-bold text-[var(--ink)]">{todayMetrics.confirmed}</span>
            <span className="mb-1 text-xs font-medium text-[var(--muted)]">confirmed today</span>
          </div>
        </div>

        {/* Cancelled */}
        <div className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">Cancelled</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-serif text-3xl font-bold text-[var(--ink)]">{todayMetrics.cancelled}</span>
            <span className="mb-1 text-xs font-medium text-[var(--muted)]">cancelled today</span>
          </div>
        </div>

        {/* Pending */}
        <div className="flex flex-col rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-[#3D8A7E]/10 text-[#3D8A7E]">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-sm font-semibold text-[var(--ink)]">Pending</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-serif text-3xl font-bold text-[var(--ink)]">{todayMetrics.pending}</span>
            <span className="mb-1 text-xs font-medium text-[var(--muted)]">awaiting confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column: Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <DashboardCalendar />
        </div>

        {/* Right Column: Quick Actions & Profile */}
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
            <h2 className="border-b border-[var(--line)] bg-slate-50/50 px-5 py-4 font-semibold text-[var(--ink)]">Quick Actions</h2>
            <div className="flex flex-col p-4 gap-2">
              <Link
                href="/doctor/profile"
                className="group flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                href="/doctor/availability"
                className="group flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">Availability</span>
                </div>
                <svg className="size-4 text-[var(--muted)] group-hover:text-[var(--brand)] transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              
              <Link
                href="/doctor/appointments"
                className="group flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="group flex items-center justify-between rounded-xl px-4 py-2.5 transition-colors hover:bg-slate-50 hover:text-[var(--brand)]"
              >
                <div className="flex items-center gap-4">
                  <div className="grid size-8 place-items-center rounded-lg bg-slate-100 text-[var(--ink)] ring-1 ring-[var(--line)] group-hover:bg-white group-hover:text-[var(--brand)] group-hover:shadow-sm">
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
