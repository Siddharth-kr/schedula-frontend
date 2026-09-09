"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";

type StatusFilter = "all" | "pending" | "confirmed" | "upcoming" | "completed" | "cancelled" | "missed";
type SortMode = "newest" | "earliest";

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isTomorrow(date: Date): boolean {
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  return date.getFullYear() === tom.getFullYear() && date.getMonth() === tom.getMonth() && date.getDate() === tom.getDate();
}

function getRelativeLabel(date: Date): string | null {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return null;
}

// Mini calendar helpers
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const ITEMS_PER_PAGE = 8;

export function DoctorAppointments() {
  const router = useRouter();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }

    async function fetchAppointments(doc: DoctorProfile) {
      try {
        const myAppointments = getAppointmentsForDoctor(doc.id);
        myAppointments.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDoctor(doc);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAppointments(myAppointments);
      } catch {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErrorMsg("Failed to load appointments.");
      } finally {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(false);
      }
    }

    fetchAppointments(session);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments") fetchAppointments(session);
    };
    const handleCustomChange = () => fetchAppointments(session);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
    };
  }, [router]);

  // Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = appointments.filter(a => a.startsAt.startsWith(todayStr) && a.status !== "cancelled").length;
    const upcomingCount = appointments.filter(a => {
      const d = new Date(a.startsAt);
      return d >= new Date() && (a.status === "confirmed" || a.status === "upcoming");
    }).length;
    const completedCount = appointments.filter(a => a.status === "completed").length;
    const cancelledCount = appointments.filter(a => a.status === "cancelled").length;
    const pendingCount = appointments.filter(a => a.status === "pending").length;
    const uniquePatients = new Set(appointments.map(a => a.patient.name)).size;
    return { todayCount, upcomingCount, completedCount, cancelledCount, pendingCount, uniquePatients };
  }, [appointments]);

  // Stats breakdown for the ring chart
  const statBreakdown = useMemo(() => {
    const total = appointments.length || 1;
    const confirmed = appointments.filter(a => a.status === "confirmed" || a.status === "upcoming").length;
    const pending = appointments.filter(a => a.status === "pending").length;
    const completed = appointments.filter(a => a.status === "completed").length;
    const cancelled = appointments.filter(a => a.status === "cancelled").length;
    return {
      total: appointments.length,
      confirmed, pending, completed, cancelled,
      confirmedPct: Math.round((confirmed / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
      completedPct: Math.round((completed / total) * 100),
      cancelledPct: Math.round((cancelled / total) * 100),
    };
  }, [appointments]);

  // Today's schedule
  const todaysSchedule = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appointments
      .filter(a => a.startsAt.startsWith(todayStr) && a.status !== "cancelled")
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [appointments]);

  // Calendar: dates with appointments
  const appointmentDates = useMemo(() => {
    const dates = new Set<string>();
    appointments.forEach(a => {
      dates.add(a.startsAt.split("T")[0]);
    });
    return dates;
  }, [appointments]);

  // Filtering
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.patient.name.toLowerCase().includes(q) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.appointmentType && a.appointmentType.toLowerCase().includes(q)) ||
        a.id.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ta = new Date(a.startsAt).getTime();
      const tb = new Date(b.startsAt).getTime();
      return sortMode === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [appointments, statusFilter, searchQuery, sortMode]);

  // Reset page on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE));
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filteredAppointments.length);

  // Calendar rendering
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) cells.push(i);
    return cells;
  }, [calYear, calMonth]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (isLoading || !doctor) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-border"></div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white border border-border"></div>)}
        </div>
        <div className="space-y-px rounded-xl bg-white border border-border overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0">
              <div className="size-9 animate-pulse rounded-full bg-border"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-border"></div>
                <div className="h-2.5 w-16 animate-pulse rounded bg-border"></div>
              </div>
              <div className="h-3 w-32 animate-pulse rounded bg-border"></div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-border"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sidebarItems: { value: StatusFilter; label: string; icon: string; count?: number }[] = [
    { value: "all", label: "All Appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", count: appointments.length },
    { value: "upcoming", label: "Upcoming", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", count: metrics.upcomingCount },
    { value: "pending", label: "Pending", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", count: metrics.pendingCount },
    { value: "confirmed", label: "Confirmed", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
    { value: "completed", label: "Completed", icon: "M5 13l4 4L19 7" },
    { value: "cancelled", label: "Cancelled", icon: "M6 18L18 6M6 6l12 12" },
    { value: "missed", label: "Missed", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" },
  ];

  const statusBadgeColor: Record<string, string> = {
    pending: "text-amber-600",
    confirmed: "text-blue-600",
    upcoming: "text-teal-600",
    completed: "text-emerald-600",
    cancelled: "text-red-500",
    missed: "text-stone-500",
  };

  const emptyMessages: Record<string, { title: string; desc: string }> = {
    all: { title: "No appointments found", desc: "Try changing your filters or search criteria." },
    pending: { title: "No pending requests", desc: "You're all caught up." },
    confirmed: { title: "No confirmed appointments", desc: "Confirmed appointments will appear here." },
    upcoming: { title: "No upcoming appointments", desc: "Upcoming visits will appear here." },
    completed: { title: "No completed appointments", desc: "Completed visits will show here." },
    cancelled: { title: "No cancelled appointments", desc: "Cancelled appointments will appear here." },
    missed: { title: "No missed appointments", desc: "Missed appointments will appear here." },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC]">
      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1440px] flex">
        
        {/* CENTER COLUMN (LIST) */}
        <div className="flex-1 min-w-0 overflow-y-auto border-r border-[#E2E8F0]">
          <div className="px-5 lg:px-8 py-6 lg:py-8">

          {/* HORIZONTAL FILTERS TABS */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-4 mb-2">
            {sidebarItems.map(item => (
              <button
                key={item.value}
                onClick={() => { setStatusFilter(item.value); setCurrentPage(1); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border ${
                  statusFilter === item.value
                    ? "bg-[#F1F5FF] text-[#2D6CDF] border-[#2D6CDF]/30"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {item.label}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] tabular-nums ${statusFilter === item.value ? "bg-[#2D6CDF] text-white" : "bg-slate-100 text-slate-500"}`}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Appointments</h1>
              <p className="text-sm text-text-secondary mt-0.5">Manage and track all your patient appointments</p>
            </div>
            <button
              onClick={() => router.push("/doctor/availability")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary-dark transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Appointment
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">{errorMsg}</div>
          )}

          {/* METRICS ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Today", value: metrics.todayCount, sub: "Appointments", color: "text-primary", bg: "bg-primary/10", action: () => { setStatusFilter("all"); setSearchQuery(""); }, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { label: "Upcoming", value: metrics.upcomingCount, sub: "Appointments", color: "text-amber-600", bg: "bg-amber-50", action: () => setStatusFilter("upcoming"), icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Completed", value: metrics.completedCount, sub: "This month", color: "text-emerald-600", bg: "bg-emerald-50", action: () => setStatusFilter("completed"), icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Cancelled", value: metrics.cancelledCount, sub: "This month", color: "text-red-500", bg: "bg-red-50", action: () => setStatusFilter("cancelled"), icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { label: "Total Patients", value: metrics.uniquePatients, sub: "All time", color: "text-violet-600", bg: "bg-violet-50", action: () => {}, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map((m, i) => (
              <button key={i} onClick={m.action} className="bg-white rounded-xl border border-border p-4 text-left hover:shadow-sm transition-shadow group">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`size-7 rounded-lg ${m.bg} flex items-center justify-center`}>
                    <svg className={`size-3.5 ${m.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                  </div>
                  <span className="text-xs font-medium text-text-secondary">{m.label}</span>
                </div>
                <p className="text-xl font-bold text-text-primary tabular-nums">{m.value}</p>
                <p className="text-[11px] text-primary font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">View {m.label.toLowerCase()} &rarr;</p>
              </button>
            ))}
          </div>

          {/* FILTER TABS + SEARCH BAR */}
          <div className="bg-white rounded-xl border border-border shadow-sm mb-5 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center gap-0.5 px-4 pt-2 overflow-x-auto hide-scrollbar border-b border-border">
              {(["all", "pending", "confirmed", "upcoming", "completed", "cancelled", "missed"] as StatusFilter[]).map(s => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`relative whitespace-nowrap px-3.5 py-2.5 text-[13px] font-medium capitalize transition-colors ${
                    statusFilter === s ? "text-primary font-semibold" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {s === "all" ? "All" : s}
                  {statusFilter === s && <span className="absolute bottom-0 left-1.5 right-1.5 h-[2px] bg-primary rounded-full"></span>}
                </button>
              ))}
            </div>
            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4 py-3">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="size-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Search patient name or ID..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <select
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  className="px-3 py-2 text-[13px] font-medium rounded-lg border border-border bg-background focus:border-primary outline-none cursor-pointer"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="earliest">Sort: Earliest</option>
                </select>
              </div>
            </div>
          </div>

          {/* APPOINTMENT LIST */}
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-4">
            {paginatedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="size-12 rounded-full bg-background flex items-center justify-center text-text-secondary ring-1 ring-border mb-4">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-text-primary mb-1">{emptyMessages[statusFilter]?.title || "No appointments found"}</h3>
                <p className="text-xs text-text-secondary">{emptyMessages[statusFilter]?.desc || "Try adjusting your filters."}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {paginatedAppointments.map((apt) => {
                  const dateObj = new Date(apt.startsAt);
                  const displayDate = dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                  const displayTime = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                  const relativeLabel = getRelativeLabel(dateObj);
                  const isTodayRow = isToday(dateObj);
                  const patientId = `#PT${apt.id.slice(-4).toUpperCase()}`;

                  return (
                    <div
                      key={apt.id}
                      className={`flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-0 px-5 py-4 transition-colors hover:bg-stone-50/60 ${isTodayRow ? "bg-primary/[0.02]" : ""}`}
                    >
                      {/* Patient */}
                      <div className="flex items-center gap-3 lg:w-[220px] xl:w-[240px] shrink-0">
                        <div className="size-9 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {apt.patient.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{apt.patient.name}</p>
                          <p className="text-[11px] text-text-secondary font-medium">ID: {patientId}</p>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 lg:w-[200px] xl:w-[220px] shrink-0 text-sm text-text-secondary pl-12 lg:pl-0">
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5 shrink-0 text-text-secondary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className={`font-medium ${isTodayRow ? "text-primary" : ""}`}>{relativeLabel || displayDate}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5 shrink-0 text-text-secondary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="font-medium">{displayTime}</span>
                        </span>
                      </div>

                      {/* Type + Mode */}
                      <div className="flex-1 min-w-0 pl-12 lg:pl-0 flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-sm text-text-secondary font-medium truncate">
                          <svg className="size-3.5 shrink-0 text-text-secondary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {apt.appointmentType || apt.reason || "General Consultation"}
                        </span>
                        {apt.preferredCommunication && (
                          <span className="hidden xl:flex items-center gap-1 text-[11px] text-text-secondary/70 font-medium">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            {apt.preferredCommunication}
                          </span>
                        )}
                      </div>

                      {/* Status + Action */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 pl-12 lg:pl-0 lg:w-[200px] shrink-0">
                        <AppointmentStatusBadge status={apt.status} />
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          className="text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors whitespace-nowrap"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {filteredAppointments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
              <p className="text-xs text-text-secondary font-medium">
                Showing {startIdx} to {endIdx} of {filteredAppointments.length} appointments
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="size-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-secondary hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`size-8 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === page
                          ? "bg-primary text-white shadow-sm"
                          : "border border-border bg-white text-text-secondary hover:border-primary/40"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="size-8 rounded-lg border border-border bg-white flex items-center justify-center text-text-secondary hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-[280px] xl:w-[300px] shrink-0 border-l border-border bg-white py-6 px-4 overflow-y-auto gap-6">

        {/* MINI CALENDAR */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">Calendar</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else { setCalMonth(m => m - 1); } }}
                className="size-6 rounded flex items-center justify-center text-text-secondary hover:bg-stone-100 transition-colors"
              >
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else { setCalMonth(m => m + 1); } }}
                className="size-6 rounded flex items-center justify-center text-text-secondary hover:bg-stone-100 transition-colors"
              >
                <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <p className="text-xs font-semibold text-text-primary mb-3">{monthNames[calMonth]} {calYear}</p>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-secondary mb-1">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <span key={d} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 text-center">
            {calendarDays.map((day, idx) => {
              if (day === null) return <span key={`e${idx}`}></span>;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasAppt = appointmentDates.has(dateStr);
              const isTodayCal = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
              return (
                <span
                  key={idx}
                  className={`py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-default ${
                    isTodayCal
                      ? "bg-primary text-white font-bold"
                      : hasAppt
                        ? "text-primary font-bold"
                        : "text-text-primary hover:bg-stone-50"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>
        </div>

        {/* TODAY'S SCHEDULE */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">Today&apos;s Schedule</h3>
            <button onClick={() => router.push("/doctor/availability")} className="text-[11px] font-semibold text-primary hover:underline">View full day</button>
          </div>
          {todaysSchedule.length === 0 ? (
            <p className="text-xs text-text-secondary py-3">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-0">
              {todaysSchedule.slice(0, 6).map((apt) => {
                const time = new Date(apt.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                return (
                  <div key={apt.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-b-0">
                    <span className={`size-2 rounded-full shrink-0 ${statusBadgeColor[apt.status] || "text-text-secondary"}`} style={{ backgroundColor: "currentColor" }}></span>
                    <span className="text-xs font-semibold text-text-primary w-[68px] shrink-0 tabular-nums">{time}</span>
                    <span className="text-xs text-text-secondary font-medium truncate flex-1">{apt.patient.name}</span>
                    <span className={`text-[10px] font-semibold capitalize ${statusBadgeColor[apt.status] || "text-text-secondary"}`}>{apt.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* APPOINTMENT STATS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-primary">Appointment Stats</h3>
          </div>
          {/* Simple visual ring */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative size-[80px] shrink-0">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#2D6CDF" strokeWidth="3"
                  strokeDasharray={`${statBreakdown.confirmedPct * 0.88} ${88 - statBreakdown.confirmedPct * 0.88}`} strokeDashoffset="0" strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="3"
                  strokeDasharray={`${statBreakdown.pendingPct * 0.88} ${88 - statBreakdown.pendingPct * 0.88}`} strokeDashoffset={`-${statBreakdown.confirmedPct * 0.88}`} strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="3"
                  strokeDasharray={`${statBreakdown.completedPct * 0.88} ${88 - statBreakdown.completedPct * 0.88}`} strokeDashoffset={`-${(statBreakdown.confirmedPct + statBreakdown.pendingPct) * 0.88}`} strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#EF4444" strokeWidth="3"
                  strokeDasharray={`${statBreakdown.cancelledPct * 0.88} ${88 - statBreakdown.cancelledPct * 0.88}`} strokeDashoffset={`-${(statBreakdown.confirmedPct + statBreakdown.pendingPct + statBreakdown.completedPct) * 0.88}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-text-primary leading-none">{statBreakdown.total}</span>
                <span className="text-[9px] text-text-secondary font-medium">Total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#2D6CDF]"></span>Confirmed</span>
                <span className="font-semibold text-text-primary tabular-nums">{statBreakdown.confirmed} ({statBreakdown.confirmedPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#F59E0B]"></span>Pending</span>
                <span className="font-semibold text-text-primary tabular-nums">{statBreakdown.pending} ({statBreakdown.pendingPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#10B981]"></span>Completed</span>
                <span className="font-semibold text-text-primary tabular-nums">{statBreakdown.completed} ({statBreakdown.completedPct}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#EF4444]"></span>Cancelled</span>
                <span className="font-semibold text-text-primary tabular-nums">{statBreakdown.cancelled} ({statBreakdown.cancelledPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar nav */}
      <div className="xl:hidden fixed bottom-20 left-4 z-30">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
          className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-white shadow-lg focus:border-primary outline-none"
        >
          {sidebarItems.map(item => (
            <option key={item.value} value={item.value}>{item.label}{item.count !== undefined ? ` (${item.count})` : ""}</option>
          ))}
        </select>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
      </div>
    </div>
  );
}
