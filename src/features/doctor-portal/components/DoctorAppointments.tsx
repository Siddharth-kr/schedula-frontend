"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";

type StatusFilter = "all" | "pending" | "confirmed" | "upcoming" | "completed" | "cancelled" | "missed";
type DateFilter = "all" | "today" | "tomorrow" | "week";
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

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
}

function getRelativeLabel(date: Date): string | null {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return null;
}

export function DoctorAppointments() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");

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
        setErrorMsg("Failed to load appointments. Please try again later.");
      } finally {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(false);
      }
    }
    
    fetchAppointments(session);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments") {
        fetchAppointments(session);
      }
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
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    const todayCount = appointments.filter(a => a.startsAt.startsWith(todayStr) && a.status !== "cancelled").length;
    const pendingCount = appointments.filter(a => a.status === "pending").length;
    const upcomingCount = appointments.filter(a => {
      const d = new Date(a.startsAt);
      return d >= now && d <= weekFromNow && (a.status === "confirmed" || a.status === "upcoming");
    }).length;
    const completedCount = appointments.filter(a => a.status === "completed").length;

    return { todayCount, pendingCount, upcomingCount, completedCount };
  }, [appointments]);

  // Derived filtered list
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    // Status
    if (statusFilter !== "all") {
      list = list.filter(a => a.status === statusFilter);
    }

    // Date
    if (dateFilter !== "all") {
      list = list.filter(a => {
        const d = new Date(a.startsAt);
        if (dateFilter === "today") return isToday(d);
        if (dateFilter === "tomorrow") return isTomorrow(d);
        if (dateFilter === "week") return isThisWeek(d);
        return true;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.patient.name.toLowerCase().includes(q) ||
        (a.reason && a.reason.toLowerCase().includes(q)) ||
        (a.appointmentType && a.appointmentType.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const ta = new Date(a.startsAt).getTime();
      const tb = new Date(b.startsAt).getTime();
      return sortMode === "newest" ? tb - ta : ta - tb;
    });

    return list;
  }, [appointments, statusFilter, dateFilter, searchQuery, sortMode]);

  const hasActiveFilters = statusFilter !== "all" || dateFilter !== "all" || searchQuery.trim() !== "";

  if (isLoading || !doctor) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 h-10 w-48 animate-pulse rounded-xl bg-border"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-border"></div>)}
        </div>
        <div className="h-14 animate-pulse rounded-2xl bg-white border border-border mb-6"></div>
        <div className="space-y-1 rounded-2xl bg-white border border-border overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4 p-5 border-b border-border last:border-b-0">
              <div className="size-10 animate-pulse rounded-full bg-border"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-border"></div>
                <div className="h-3 w-48 animate-pulse rounded bg-border"></div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-border"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "upcoming", label: "Upcoming" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "missed", label: "Missed" },
  ];

  const emptyMessages: Record<string, { title: string; desc: string }> = {
    all: { title: "No appointments found", desc: "Try changing your filters or search criteria." },
    pending: { title: "No pending requests", desc: "You're all caught up — no appointments awaiting your review." },
    confirmed: { title: "No confirmed appointments", desc: "Confirmed appointments will appear here." },
    upcoming: { title: "No upcoming appointments", desc: "Upcoming appointments will appear here." },
    completed: { title: "No completed appointments yet", desc: "Completed appointments will show here after visits." },
    cancelled: { title: "No cancelled appointments", desc: "Cancelled appointments will appear here." },
    missed: { title: "No missed appointments", desc: "Missed appointments will appear here." },
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Appointments</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your patient appointments and schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/doctor/availability")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-semibold text-text-primary shadow-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Calendar View
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
          {errorMsg}
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="size-4.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.todayCount}</p>
          <p className="text-xs font-medium text-text-secondary mt-1">Today&apos;s Appointments</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="size-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.pendingCount}</p>
          <p className="text-xs font-medium text-text-secondary mt-1">Pending Requests</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <svg className="size-4.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.upcomingCount}</p>
          <p className="text-xs font-medium text-text-secondary mt-1">Upcoming (7 days)</p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg className="size-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-text-primary">{metrics.completedCount}</p>
          <p className="text-xs font-medium text-text-secondary mt-1">Completed</p>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white rounded-2xl border border-border shadow-sm mb-6">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 overflow-x-auto hide-scrollbar">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                statusFilter === tab.value
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
              {statusFilter === tab.value && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"></span>
              )}
            </button>
          ))}
        </div>
        <div className="border-t border-border" />
        {/* Search + Date + Sort Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="size-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search patients, appointments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as DateFilter)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="earliest">Earliest First</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={() => { setStatusFilter("all"); setDateFilter("all"); setSearchQuery(""); }}
                className="px-3 py-2.5 text-xs font-bold text-text-secondary hover:text-error rounded-xl border border-border bg-background transition-colors whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULT COUNT */}
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-text-secondary font-medium">
          {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
          {hasActiveFilters ? " matching filters" : ""}
        </p>
      </div>

      {/* APPOINTMENT LIST */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="size-14 rounded-full bg-background flex items-center justify-center text-text-secondary ring-1 ring-border mb-5">
              <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1">
              {emptyMessages[statusFilter]?.title || "No appointments found"}
            </h3>
            <p className="text-sm text-text-secondary max-w-xs">
              {emptyMessages[statusFilter]?.desc || "Try adjusting your filters or search query."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(100px,0.8fr)_minmax(100px,0.6fr)] gap-4 px-6 py-3 bg-stone-50 border-b border-border text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <span>Patient</span>
              <span>Date & Time</span>
              <span>Type</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-border">
              {filteredAppointments.map(apt => {
                const dateObj = new Date(apt.startsAt);
                const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const displayTime = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const relativeLabel = getRelativeLabel(dateObj);
                const isTodayRow = isToday(dateObj);

                return (
                  <div
                    key={apt.id}
                    className={`group transition-colors hover:bg-stone-50/70 ${isTodayRow ? "border-l-[3px] border-l-primary bg-primary/[0.02]" : ""}`}
                  >
                    {/* DESKTOP ROW */}
                    <div className="hidden lg:grid grid-cols-[minmax(220px,2fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(100px,0.8fr)_minmax(100px,0.6fr)] gap-4 items-center px-6 py-4">
                      {/* Patient */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center ring-1 ring-primary/20">
                          {apt.patient.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-text-primary text-sm truncate">{apt.patient.name}</p>
                          {apt.patient.age && (
                            <p className="text-xs text-text-secondary font-medium">Age: {apt.patient.age}</p>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm text-text-secondary font-medium">
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {relativeLabel ? (
                            <span className={`font-semibold ${isTodayRow ? "text-primary" : "text-text-primary"}`}>{relativeLabel}</span>
                          ) : (
                            <span>{displayDate}</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {displayTime}
                        </span>
                      </div>

                      {/* Type */}
                      <p className="text-sm font-medium text-text-secondary truncate">
                        {apt.appointmentType || apt.reason || "Consultation"}
                      </p>

                      {/* Status */}
                      <AppointmentStatusBadge status={apt.status} />

                      {/* Action */}
                      <div className="text-right">
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                        >
                          View
                          <svg className="size-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                      </div>
                    </div>

                    {/* MOBILE CARD */}
                    <div className="lg:hidden p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center ring-1 ring-primary/20">
                            {apt.patient.initials}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-sm">{apt.patient.name}</p>
                            {apt.patient.age && (
                              <p className="text-xs text-text-secondary font-medium">Age: {apt.patient.age}</p>
                            )}
                          </div>
                        </div>
                        <AppointmentStatusBadge status={apt.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-secondary font-medium mb-3 pl-[52px]">
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {relativeLabel || displayDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {displayTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-[52px]">
                        <p className="text-xs text-text-secondary font-medium truncate max-w-[200px]">
                          {apt.appointmentType || apt.reason || "Consultation"}
                        </p>
                        <Link
                          href={`/doctor/appointments/${apt.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                        >
                          View Details
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
