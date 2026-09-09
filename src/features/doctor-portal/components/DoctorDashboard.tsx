"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { getUserNotifications } from "@/lib/notification-store";
import type { AppNotification, NotificationType } from "@/lib/notification-store";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";

export function DoctorDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }

    function fetchData() {
      const myAppointments = getAppointmentsForDoctor(session!.id);
      const myNotifications = getUserNotifications(session!.id);
      
      setDoctor(session);
      setAppointments(myAppointments);
      setNotifications(myNotifications);
      setIsLoading(false);
    }

    fetchData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_notifications") fetchData();
    };
    const handleCustomChange = () => fetchData();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);
    window.addEventListener("schedula_notifications_updated", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
      window.removeEventListener("schedula_notifications_updated", handleCustomChange);
    };
  }, [router]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todaysApts = appointments.filter(a => a.startsAt.startsWith(todayStr));
    
    return {
      totalBookings: todaysApts.length,
      confirmed: todaysApts.filter(a => a.status === "confirmed").length,
      pending: todaysApts.filter(a => a.status === "pending").length,
      cancelled: todaysApts.filter(a => a.status === "cancelled").length,
      totalPatients: new Set(appointments.map(a => a.patient.name)).size
    };
  }, [appointments]);

  // Today's Appointments
  const todaysSchedule = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return appointments
      .filter(a => a.startsAt.startsWith(todayStr))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [appointments]);

  // Upcoming Days
  const upcomingDays = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const future = appointments.filter(a => a.startsAt > todayStr + "T23:59:59" && a.status !== "cancelled");
    
    const byDate = future.reduce((acc, a) => {
      const d = a.startsAt.split("T")[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push(a);
      return acc;
    }, {} as Record<string, Appointment[]>);

    return Object.keys(byDate)
      .sort()
      .slice(0, 3)
      .map(date => ({
        date,
        appointments: byDate[date]
      }));
  }, [appointments]);

  // Weekly Data (last 7 days)
  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayApts = appointments.filter(a => a.startsAt.startsWith(dateStr) && a.status !== "cancelled");
      data.push({
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        count: dayApts.length,
      });
    }
    return data;
  }, [appointments]);
  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);

  // Top Appointment Types
  const topTypes = useMemo(() => {
    const types = appointments.reduce((acc, a) => {
      const t = a.appointmentType || a.reason || "General Consultation";
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count], i) => {
        const colors = ["#2D6CDF", "#10B981", "#F59E0B", "#8B5CF6"];
        return { label, count, color: colors[i] };
      });
  }, [appointments]);
  const totalTypesCount = topTypes.reduce((sum, t) => sum + t.count, 0) || 1;

  // Recent Activity
  const recentActivity = useMemo(() => {
    if (notifications.length > 0) {
      return notifications.slice(0, 4);
    }
    // Fallback if no real notifications: show recent appointments
    return appointments
      .slice()
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .slice(0, 3)
      .map(a => ({
        id: a.id,
        message: `${a.patient.name}'s appointment is ${a.status}`,
        type: a.status as NotificationType,
        createdAt: new Date().toISOString(),
        read: true,
        userId: doctor?.id || "",
      } as AppNotification));
  }, [notifications, appointments, doctor]);

  if (isLoading || !doctor) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-[#F7F9FC]">
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="size-8 rounded-full border-4 border-border border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC]">
      {/* MAIN CONTENT */}
      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center shadow-sm shrink-0">
              {doctor.name.replace("Dr. ", "").charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                Good morning, {doctor.name} <span className="inline-block animate-wave origin-bottom-right">👋</span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">Here&apos;s what&apos;s happening with your practice today.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/doctor/availability"
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-white text-sm font-semibold text-text-primary shadow-sm hover:bg-stone-50 transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Appointment
            </Link>
            <Link
              href="/doctor/availability"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary-dark transition-colors"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Manage Schedule
            </Link>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {[
            { label: "Total Bookings", value: metrics.totalBookings, sub: "Today", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "text-primary", bg: "bg-primary/10" },
            { label: "Confirmed", value: metrics.confirmed, sub: "Today", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Pending", value: metrics.pending, sub: "Today", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Cancelled", value: metrics.cancelled, sub: "Today", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-red-500", bg: "bg-red-50" },
            { label: "Total Patients", value: metrics.totalPatients, sub: "All time", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "text-violet-600", bg: "bg-violet-50" },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className={`size-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <svg className={`size-4 ${m.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                </div>
                <span className="text-xs font-semibold text-text-secondary">{m.label}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{m.value}</p>
              <p className="text-[11px] text-text-secondary font-medium mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Today's Schedule */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <h2 className="text-base font-bold text-text-primary">Today&apos;s Schedule</h2>
                </div>
                <Link href="/doctor/appointments" className="text-[13px] font-semibold text-primary hover:underline">
                  View full schedule
                </Link>
              </div>
              
              <div className="flex-1 p-2">
                {todaysSchedule.length === 0 ? (
                  <div className="p-8 text-center text-text-secondary">
                    <p className="text-sm font-medium">No appointments scheduled for today.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {todaysSchedule.map((apt) => {
                      const time = new Date(apt.startsAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                      return (
                        <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 hover:bg-stone-50/60 transition-colors rounded-lg">
                          {/* Time & Dot */}
                          <div className="flex items-center gap-3 w-[100px] shrink-0">
                            <span className={`size-2 rounded-full shrink-0 ${
                              apt.status === "confirmed" ? "bg-blue-600" :
                              apt.status === "pending" ? "bg-amber-600" :
                              apt.status === "completed" ? "bg-emerald-600" : "bg-text-secondary"
                            }`}></span>
                            <span className="text-sm font-bold text-text-primary">{time}</span>
                          </div>
                          
                          {/* Patient */}
                          <div className="flex items-center gap-3 w-full sm:w-[220px] shrink-0">
                            <div className="size-10 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                              {apt.patient.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-text-primary truncate">{apt.patient.name}</p>
                              <p className="text-xs text-text-secondary font-medium">ID: #PT{apt.id.slice(-4).toUpperCase()}</p>
                            </div>
                          </div>
                          
                          {/* Details */}
                          <div className="flex-1 min-w-0 hidden md:block">
                            <p className="text-sm font-medium text-text-primary truncate">{apt.appointmentType || apt.reason || "General Consultation"}</p>
                            <p className="text-[11px] text-text-secondary font-medium flex items-center gap-1 mt-0.5">
                              <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              In-Person
                            </p>
                          </div>
                          
                          {/* Status & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-[140px] shrink-0">
                            <AppointmentStatusBadge status={apt.status} />
                            <Link href={`/doctor/appointments/${apt.id}`} className="p-1 rounded hover:bg-stone-100 text-text-secondary transition-colors">
                              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <section className="bg-white rounded-xl border border-border shadow-sm p-5">
                <h2 className="text-base font-bold text-text-primary mb-4">Recent Activity</h2>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-text-secondary py-4 text-center">No recent activity.</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((notif, i) => {
                      const isConfirmed = notif.message.toLowerCase().includes("confirmed") || notif.type === "confirmation";
                      const isNew = notif.message.toLowerCase().includes("request") || notif.type === "booking";
                      return (
                        <div key={i} className="flex gap-3">
                          <div className={`size-8 rounded-full shrink-0 flex items-center justify-center ${
                            isConfirmed ? "bg-emerald-50 text-emerald-600" :
                            isNew ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"
                          }`}>
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {isConfirmed ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /> :
                               isNew ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> :
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary leading-snug">{notif.message}</p>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {new Date(notif.createdAt).toLocaleDateString()} &bull; {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Top Appointment Types */}
              <section className="bg-white rounded-xl border border-border shadow-sm p-5">
                <h2 className="text-base font-bold text-text-primary mb-4">Top Appointment Types</h2>
                <div className="flex items-center gap-6">
                  <div className="relative size-[100px] shrink-0">
                    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                      {topTypes.map((t, i) => {
                        const dasharray = (t.count / totalTypesCount) * 88;
                        const offset = topTypes.slice(0, i).reduce((sum, prev) => sum + (prev.count / totalTypesCount) * 88, 0);
                        return (
                          <circle key={t.label} cx="18" cy="18" r="14" fill="none" stroke={t.color} strokeWidth="4"
                            strokeDasharray={`${dasharray} ${88 - dasharray}`} strokeDashoffset={-offset} strokeLinecap="round" />
                        );
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-text-primary leading-none">{totalTypesCount}</span>
                      <span className="text-[9px] font-medium text-text-secondary">Total</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {topTypes.map((t) => {
                      const percentage = Math.round((t.count / totalTypesCount) * 100);
                      return (
                        <div key={t.label} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-text-primary font-medium truncate">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: t.color }}></span>
                            <span className="truncate">{t.label}</span>
                          </span>
                          <span className="font-semibold text-text-secondary ml-2">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* COLUMN 2: Upcoming & Weekly */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <section className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-bold text-text-primary">Upcoming Appointments</h2>
                <Link href="/doctor/appointments" className="text-[13px] font-semibold text-primary hover:underline">View All</Link>
              </div>
              <div className="p-2">
                {upcomingDays.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary text-sm">No upcoming appointments.</div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {upcomingDays.map((dayGroup) => {
                      const d = new Date(dayGroup.date);
                      const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
                      const dateNum = d.getDate();
                      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                      
                      return (
                        <div key={dayGroup.date} className="flex gap-4 p-3 hover:bg-stone-50/60 transition-colors rounded-lg">
                          <div className="w-12 h-14 shrink-0 bg-primary/5 rounded-lg border border-primary/10 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-primary">{month}</span>
                            <span className="text-lg font-bold text-primary-dark leading-none mt-0.5">{dateNum}</span>
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="text-sm font-bold text-text-primary">{dayName}, {month} {dateNum}</p>
                            <p className="text-[13px] text-text-secondary font-medium mt-0.5">
                              {dayGroup.appointments.length} Appointment{dayGroup.appointments.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Weekly Overview */}
            <section className="bg-white rounded-xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-text-primary">Weekly Overview</h2>
                <select className="text-xs font-semibold text-text-secondary border-none bg-transparent outline-none cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>This Month</option>
                </select>
              </div>
              <div className="flex items-end justify-between h-36 gap-2 px-1">
                {weeklyData.map((d, i) => {
                  const height = maxWeeklyCount > 0 ? (d.count / maxWeeklyCount) * 100 : 0;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className={`text-[11px] font-bold transition-opacity ${isToday ? "text-primary opacity-100" : "text-text-primary opacity-0 group-hover:opacity-100"}`}>
                        {d.count > 0 ? d.count : ""}
                      </span>
                      <div className="w-full max-w-[24px] bg-primary/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden" style={{ height: "100%" }}>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700 ${isToday ? "bg-primary" : "bg-primary/60 group-hover:bg-primary/80"}`}
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-bold uppercase mt-1 ${isToday ? "text-primary" : "text-text-secondary"}`}>{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-5 mt-6 pt-5 border-t border-border">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                  <span className="size-2 rounded-full bg-primary/80"></span> Appointments
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary">
                  <span className="size-2 rounded-full bg-primary"></span> Today
                </span>
              </div>
            </section>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
        }
        .animate-wave {
          animation: wave 1.5s infinite;
          transform-origin: 70% 70%;
        }
      `}} />
    </div>
  );
}
