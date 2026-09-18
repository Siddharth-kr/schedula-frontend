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
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

    return {
      uniquePatientsCount,
      totalDoctors,
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
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
    // Generate last 7 days including today
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      
      const count = appointments.filter((a) => {
        return a.startsAt.startsWith(dateString);
      }).length;

      data.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        appointments: count
      });
    }
    return data;
  }, [appointments]);

  const appointmentColumns: AdminTableColumn<Appointment>[] = useMemo(() => [
    {
      key: "patient",
      title: "Patient",
      render: (apt) => (
        <div>
          <div className="font-bold text-stone-900">{apt.patient.name}</div>
          <div className="text-xs text-stone-500">{apt.appointmentType || 'Consultation'}</div>
        </div>
      )
    },
    { key: "clinician", title: "Doctor" },
    {
      key: "startsAt",
      title: "Date",
      render: (apt) => <span className="text-stone-600">{new Date(apt.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
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
          <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-xs">
            {doc.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div className="font-bold text-stone-900">{doc.name}</div>
        </div>
      )
    },
    { key: "specialty", title: "Specialty", render: (doc) => <span className="text-stone-600">{doc.specialty}</span> },
    {
      key: "rating",
      title: "Rating",
      render: (doc) => (
        <div className="flex items-center gap-1 text-stone-600">
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
      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Doctors" 
          value={stats.totalDoctors} 
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          trend="+2 this month"
        />
        <MetricCard 
          title="Total Patients" 
          value={stats.uniquePatientsCount} 
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          trend="+5% vs last month"
        />
        <MetricCard 
          title="Total Appointments" 
          value={stats.totalAppointments} 
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          trend={`${stats.upcomingAppointments} upcoming`}
        />
        <MetricCard 
          title="Pending Verifications" 
          value={0} 
          icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          trend="All clear"
          accent="text-emerald-600 bg-emerald-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-border">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Appointment Trends</h2>
            <select className="text-sm border-none bg-stone-50 rounded-lg px-3 py-1.5 font-medium text-stone-600 outline-none focus:ring-2 focus:ring-primary/20">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="h-72 w-full">
            {chartData.every(d => d.appointments === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-stone-400">
                <svg className="size-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>No appointments in the selected period.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: "#F3F4F6" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                  />
                  <Bar dataKey="appointments" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Overview & Doctor Verification Summary */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-border flex-1">
            <h2 className="text-lg font-bold text-stone-900 mb-6">Appointment Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 border border-indigo-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-indigo-900">Upcoming</p>
                    <p className="text-xs text-indigo-600/70">Scheduled visits</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-indigo-700">{stats.upcomingAppointments}</span>
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
            </div>
          </div>

          <div className="rounded-2xl bg-stone-900 p-6 shadow-sm border border-stone-800 text-white">
            <h2 className="text-lg font-bold mb-2">Doctor Verification</h2>
            <p className="text-stone-400 text-sm mb-4">No pending verifications require your attention right now.</p>
            <Link href="/admin/doctor-verification" className="inline-flex items-center gap-2 text-sm font-medium text-stone-300 hover:text-white transition-colors">
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
            <h2 className="text-lg font-bold text-stone-900">Recent Appointments</h2>
            <Link href="/admin/appointments" className="text-sm font-medium text-primary hover:text-primary-dark">
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
            <h2 className="text-lg font-bold text-stone-900">Recent Doctors</h2>
            <Link href="/admin/doctors" className="text-sm font-medium text-primary hover:text-primary-dark">
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

function MetricCard({ title, value, icon, trend, accent = "text-stone-500 bg-stone-100" }: { title: string, value: string | number, icon: string, trend?: string, accent?: string }) {
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
        <p className="text-3xl font-black text-stone-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-stone-500 mt-1">{title}</p>
        {trend && (
          <p className="text-xs text-stone-400 mt-3 font-medium flex items-center gap-1">
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}


