"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { getDoctorSession, getSlotsForDoctor } from "@/lib/availability-store";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { DoctorProfile, AvailabilitySlot } from "@/types/availability";
import type { Appointment } from "@/types/appointment";

export function DoctorDashboard() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    setDoctor(session);
    setAppointments(getAppointmentsForDoctor(session.id));
    setSlots(getSlotsForDoctor(session.id));
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_slots") loadData();
    };
    const handleCustomChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);
    window.addEventListener("schedula_slots_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
      window.removeEventListener("schedula_slots_updated", handleCustomChange);
    };
  }, []);

  const todaysApts = useMemo(() => appointments.filter(a => isSameDay(new Date(a.startsAt), new Date())), [appointments]);
  const todaysAvailable = useMemo(() => slots.filter(s => s.date === format(new Date(), "yyyy-MM-dd") && !s.isBooked && !s.isUnavailable).length, [slots]);
  const todaysCompleted = todaysApts.filter(a => a.status === "completed").length;
  const todaysCancelled = todaysApts.filter(a => a.status === "cancelled").length;
  const todaysPending = todaysApts.filter(a => a.status === "pending").length;
  const todaysConfirmed = todaysApts.filter(a => a.status === "confirmed").length;

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="bg-white border-b border-border py-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-primary text-2xl font-bold text-white shadow-sm">
              {doctor.name.replace("Dr. ", "").charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-dark">Welcome back, {doctor.name}</h1>
              <p className="text-text-secondary mt-1 font-medium">Here&apos;s your schedule overview for today.</p>
            </div>
          </div>
          <Link href="/doctor/availability" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.98]">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Manage Schedule
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-12 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Metrics */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Today&apos;s Summary</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
                <p className="text-3xl font-bold text-text-primary">{todaysApts.length}</p>
                <p className="text-[11px] uppercase font-bold text-text-secondary mt-2">Total Bookings</p>
              </div>
              <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
                <p className="text-3xl font-bold text-success">{todaysConfirmed}</p>
                <p className="text-[11px] uppercase font-bold text-text-secondary mt-2">Confirmed</p>
              </div>
              <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
                <p className="text-3xl font-bold text-primary">{todaysPending}</p>
                <p className="text-[11px] uppercase font-bold text-text-secondary mt-2">Pending</p>
              </div>
              <div className="rounded-2xl bg-white border border-border p-5 shadow-sm">
                <p className="text-3xl font-bold text-error">{todaysCancelled}</p>
                <p className="text-[11px] uppercase font-bold text-text-secondary mt-2">Cancelled</p>
              </div>
            </div>
          </section>

          {/* Upcoming Appointments */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">Upcoming Today</h2>
              <Link href="/doctor/appointments" className="text-sm font-bold text-primary hover:underline">View All Appointments</Link>
            </div>
            
            <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
              {todaysApts.filter(a => a.status === "confirmed" || a.status === "pending").length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <p>No upcoming appointments for today.</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {todaysApts
                    .filter(a => a.status === "confirmed" || a.status === "pending")
                    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                    .map(apt => (
                      <li key={apt.id}>
                        <Link href={`/doctor/appointments/${apt.id}`} className="flex items-center justify-between p-5 hover:bg-background transition-colors">
                          <div className="flex items-center gap-5">
                            <div className="text-center shrink-0 w-16">
                              <p className="text-xs font-bold text-text-secondary uppercase">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(apt.startsAt))}</p>
                              <p className="text-lg font-bold text-primary-dark">{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(apt.startsAt))}</p>
                            </div>
                            <div className="w-px h-10 bg-border"></div>
                            <div>
                              <p className="font-bold text-text-primary">{apt.patient.name}</p>
                              <p className="text-sm text-text-secondary">{apt.reason}</p>
                            </div>
                          </div>
                          <div>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${apt.status === "confirmed" ? "bg-success/10 text-success" : "bg-background border border-border text-text-secondary"}`}>
                              {apt.status}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Schedule Action */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-4">Schedule</h2>
            <div className="rounded-2xl bg-white border border-border p-6 shadow-sm flex flex-col items-center text-center">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary mb-4">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <h3 className="font-bold text-primary-dark mb-1">Manage Schedule</h3>
              <p className="text-sm text-text-secondary mb-6">View your full calendar, manage your availability, and drag-and-drop appointments.</p>
              <Link href="/doctor/availability" className="w-full flex items-center justify-center rounded-xl bg-background border border-border px-5 py-2.5 text-sm font-bold text-primary-dark transition-all hover:border-primary hover:text-primary active:scale-[0.98]">
                Open Calendar
              </Link>
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}
