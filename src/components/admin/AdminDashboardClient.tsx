"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { mockUsers } from "@/lib/mock-data/users";
import Link from "next/link";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminErrorState } from "./AdminErrorState";
import { AdminPageSkeleton } from "./AdminSkeleton";
import type { Appointment } from "@/types/appointment";
import type { Doctor } from "@/types/doctor";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

export function AdminDashboardClient() {
  const appointments = useAppSelector((state) => state.appointments.appointments);
  const doctors = useAppSelector((state) => state.doctors.doctors);
  const admin = useAppSelector(state => state.auth.admin);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trendDays, setTrendDays] = useState<7 | 30>(7);
  const error = null;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    // Simulate data loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    // Unique patients from mock users and appointments
    const patientEmails = Object.values(mockUsers)
      .filter((u) => u.role === "patient")
      .map((u) => u.email);
    const appointmentPatients = appointments.map((a) => a.patient.name);
    const uniquePatientsCount = new Set([...patientEmails, ...appointmentPatients]).size;

    const totalDoctors = doctors.length;
    const totalAppointments = appointments.length;

    const upcomingAppointments = appointments.filter(
      (a) => a.status === "upcoming" || a.status === "pending" || a.status === "confirmed"
    ).length;
    const completedAppointments = appointments.filter((a) => a.status === "completed").length;
    const cancelledAppointments = appointments.filter((a) => a.status === "cancelled").length;
    const rescheduledAppointments = appointments.filter((a) => !!a.rescheduledFrom).length;

    return {
      uniquePatientsCount,
      totalDoctors,
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      rescheduledAppointments
    };
  }, [appointments, doctors]);

  const recentAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
      .slice(0, 5);
  }, [appointments]);

  const recentDoctors = useMemo(() => {
    return [...doctors].slice(0, 4);
  }, [doctors]);

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    // Normalize to local midnight
    today.setHours(0, 0, 0, 0);

    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const localDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const dayAppointments = appointments.filter((a) => {
        // Exclude cancelled and specifically rescheduled (where they create a duplicate or inactive old record)
        // Wait, if it's "rescheduledFrom" but active (status=upcoming), it counts!
        // We only exclude if status is literally "cancelled".
        if (a.status === "cancelled") return false;
        
        return a.startsAt.startsWith(localDateString);
      });
      
      let online = 0;
      let inPerson = 0;
      
      dayAppointments.forEach(a => {
        let type = 'in-person';
        if (a.consultationType) {
          if (a.consultationType.toLowerCase() === 'online') type = 'online';
        } else if (a.appointmentType) {
          const typeStr = a.appointmentType.toLowerCase();
          if (typeStr.includes('video') || typeStr.includes('chat') || typeStr.includes('online')) {
            type = 'online';
          }
        }
        
        if (type === 'online') online++;
        else inPerson++;
      });

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        inPerson,
        online,
        total: dayAppointments.length
      });
    }
    return data;
  }, [appointments, trendDays]);

  const appointmentColumns: AdminTableColumn<Appointment>[] = useMemo(() => [
    {
      key: "patient",
      title: "Patient",
      render: (apt) => (
        <div>
          <div className="font-bold text-slate-900">{apt.patient.name}</div>
          <div className="text-xs text-slate-500">{apt.appointmentType || 'Consultation'}</div>
        </div>
      )
    },
    { key: "clinician", title: "Doctor" },
    {
      key: "startsAt",
      title: "Date",
      render: (apt) => <span className="text-slate-600">{new Date(apt.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
    },
    {
      key: "status",
      title: "Status",
      render: (apt) => <AdminStatusBadge status={apt.status} />
    }
  ], []);

  const doctorColumns: AdminTableColumn<Doctor>[] = useMemo(() => [
    {
      key: "name",
      title: "Doctor",
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
            {doc.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div className="font-bold text-slate-900">{doc.name}</div>
        </div>
      )
    },
    { key: "specialty", title: "Specialty", render: (doc) => <span className="text-slate-600">{doc.specialty}</span> },
    {
      key: "rating",
      title: "Rating",
      render: (doc) => (
        <div className="flex items-center gap-1 text-slate-600">
          <svg className="size-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          {doc.rating}
        </div>
      )
    },
    {
      key: "status",
      title: "Status",
      render: () => <AdminStatusBadge status="verified" />
    }
  ], []);

  if (!isClient) {
    return null; // Avoid hydration mismatch
  }

  if (error) {
    return <AdminErrorState title="Failed to load dashboard data" message="There was an error communicating with the data store." onRetry={() => window.location.reload()} />;
  }

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide text-sm mb-1 text-slate-500">WELCOME BACK, {admin?.name ? admin.name.toUpperCase() : 'ADMIN'}</h1>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Here&apos;s what&apos;s happening today</h2>
          <p className="text-sm text-slate-500 max-w-2xl">Manage your healthcare platform, monitor activity, and ensure smooth operations.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2 border border-slate-100">
          <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-slate-700">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Doctors" 
          value={stats.totalDoctors} 
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          trend="↑ +2 this month"
          accent="text-blue-600 bg-blue-50"
        />
        <MetricCard 
          title="Total Patients" 
          value={stats.uniquePatientsCount} 
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          trend="↑ +5% vs last month"
          accent="text-teal-600 bg-teal-50"
        />
        <MetricCard 
          title="Total Appointments" 
          value={stats.totalAppointments} 
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          trend={`• ${stats.upcomingAppointments} upcoming`}
          accent="text-indigo-600 bg-indigo-50"
        />
        <MetricCard 
          title="Pending Verifications" 
          value={0} 
          icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          trend="All clear"
          accent="text-amber-600 bg-amber-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Appointment Trends</h2>
              </div>
              <p className="text-sm text-slate-500">Appointment activity by consultation type</p>
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <select 
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value) as 7 | 30)}
                className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-1.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-600/20 cursor-pointer shadow-sm"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-slate-600">In-person</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-teal-500"></span>
                  <span className="text-slate-600">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full mt-4">
            {chartData.every(d => d.total === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                <svg className="size-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No appointments in the selected period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748B" }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "#F8FAFC" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-sm min-w-[150px]">
                            <p className="font-bold text-slate-900 mb-2">{label}</p>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-blue-600"></span>
                                <span className="text-sm text-slate-600">In-person</span>
                              </div>
                              <span className="text-sm font-medium text-slate-900">{payload.find(p => p.dataKey === 'inPerson')?.value || 0}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-teal-500"></span>
                                <span className="text-sm text-slate-600">Online</span>
                              </div>
                              <span className="text-sm font-medium text-slate-900">{payload.find(p => p.dataKey === 'online')?.value || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-900">Total</span>
                              <span className="text-sm font-bold text-slate-900">{payload[0].payload.total}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="inPerson" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="online" fill="#14B8A6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Overview & Doctor Verification Summary */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex-1">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Appointment Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900">Upcoming</p>
                    <p className="text-xs text-blue-600/70">Scheduled visits</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-700">{stats.upcomingAppointments}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Completed</p>
                    <p className="text-xs text-emerald-600/70">Historical visits</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-emerald-700">{stats.completedAppointments}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-900">Cancelled</p>
                    <p className="text-xs text-red-600/70">Cancelled visits</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-red-700">{stats.cancelledAppointments}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-purple-50 border border-purple-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900">Rescheduled</p>
                    <p className="text-xs text-purple-600/70">Changed visits</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-purple-700">{stats.rescheduledAppointments}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200 text-slate-900">
            <h2 className="text-lg font-bold mb-2">Doctor Verification</h2>
            <p className="text-slate-500 text-sm mb-4">No pending verifications require your attention right now.</p>
            <Link href="/admin/doctor-verification" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Manage verifications
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <div className="rounded-2xl bg-white shadow-sm border border-border flex flex-col overflow-hidden">
          <div className="p-6 flex items-center justify-between bg-white border-b border-border">
            <h2 className="text-lg font-bold text-slate-900">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <AdminTable 
            columns={appointmentColumns} 
            data={recentAppointments} 
            keyExtractor={(apt) => apt.id} 
            emptyStateTitle="No recent appointments found."
            emptyStateMessage=""
            className="border-none shadow-none rounded-none"
          />
        </div>

        {/* Recent Doctors */}
        <div className="rounded-2xl bg-white shadow-sm border border-border flex flex-col overflow-hidden">
          <div className="p-6 flex items-center justify-between bg-white border-b border-border">
            <h2 className="text-lg font-bold text-slate-900">Recent Doctors</h2>
            <Link href="/admin/doctors" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <AdminTable 
            columns={doctorColumns} 
            data={recentDoctors} 
            keyExtractor={(doc) => doc.id} 
            emptyStateTitle="No doctors found."
            emptyStateMessage=""
            className="border-none shadow-none rounded-none"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, accent = "text-slate-500 bg-slate-100" }: { title: string, value: string | number, icon: string, trend?: string, accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${accent}`}>
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        {trend && (
          <p className="text-xs text-slate-400 mt-3 font-medium flex items-center gap-1">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}


