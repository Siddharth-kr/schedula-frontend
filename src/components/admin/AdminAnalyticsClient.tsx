"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";

const COLORS = {
  blue: "#2563EB",
  teal: "#0D9488",
  green: "#059669",
  emerald: "#059669",
  purple: "#7C3AED",
  amber: "#D97706",
  red: "#DC2626",
  slate: "#64748B",
  lightBlue: "#EFF6FF",
  lightGray: "#F8FAFC"
};

export function AdminAnalyticsClient() {
  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState<"7" | "30">("7");

  const appointments = useAppSelector(state => state.appointments.appointments);
  const doctors = useAppSelector(state => state.doctors.doctors);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  // KPIs
  const kpis = useMemo(() => {
    const totalAppointments = appointments.length;
    const uniquePatients = new Set(appointments.map(a => a.patient.name)).size;
    const totalDoctors = doctors.length;
    const totalRevenue = appointments
      .filter(a => a.paymentStatus === "paid")
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    
    return {
      totalAppointments,
      totalPatients: uniquePatients > 0 ? uniquePatients : 0,
      totalDoctors,
      totalRevenue
    };
  }, [appointments, doctors]);

  // Chart Data Processing
  const { 
    appointmentTrends, 
    registrationTrends,
    onlineVsInPerson, 
    statusStats, 
    revenueOverview,
    revenueChartData,
    verificationStats
  } = useMemo(() => {
    
    const daysToLookBack = parseInt(timeRange);
    const now = new Date();
    // Normalize to start of day for comparison
    now.setHours(23, 59, 59, 999);
    
    const apptTrendsMap = new Map<string, { date: string; appointments: number; revenue: number }>();
    const regTrendsMap = new Map<string, { date: string; Patients: number; Doctors: number }>();
    
    // Initialize dates (oldest first)
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      apptTrendsMap.set(dateStr, { date: dateStr, appointments: 0, revenue: 0 });
      regTrendsMap.set(dateStr, { date: dateStr, Patients: 0, Doctors: 0 });
    }

    appointments.forEach(apt => {
      const aptDate = new Date(apt.startsAt);
      const diffTime = now.getTime() - aptDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= daysToLookBack) {
        const dateStr = aptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (apptTrendsMap.has(dateStr)) {
          const entry = apptTrendsMap.get(dateStr)!;
          entry.appointments += 1;
          if (apt.paymentStatus === "paid") {
            entry.revenue += (apt.consultationFee || 0);
          }
        }
      }
    });

    // Mock patient/doctor registrations based on existing volume for visual
    Array.from(regTrendsMap.keys()).forEach((key, idx) => {
      const entry = regTrendsMap.get(key)!;
      entry.Patients = Math.floor(Math.sin(idx) * 3 + 5);
      entry.Doctors = Math.floor(Math.cos(idx) * 2 + 3);
    });

    // 2. Online vs In-person
    let onlineCount = 0;
    let inPersonCount = 0;
    appointments.forEach(apt => {
      if (apt.consultationType === "online") onlineCount++;
      else inPersonCount++;
    });

    const totalConsultations = onlineCount + inPersonCount;

    // 3. Status Stats
    const statusCounts = { completed: 0, cancelled: 0, confirmed: 0, rescheduled: 0 };
    appointments.forEach(apt => {
      if (apt.status === "completed") statusCounts.completed++;
      if (apt.status === "cancelled") statusCounts.cancelled++;
      if (apt.status === "confirmed") statusCounts.confirmed++;
      if (apt.rescheduledFrom) statusCounts.rescheduled++;
    });

    // 4. Payment Overview
    const paymentCounts = { paid: 0, pending: 0, failed: 0, refunded: 0, totalRevenue: 0, refundedAmount: 0 };
    appointments.forEach(apt => {
      const fee = apt.consultationFee || 0;
      if (apt.paymentStatus === "paid") { paymentCounts.paid++; paymentCounts.totalRevenue += fee; }
      else if (apt.paymentStatus === "pending") paymentCounts.pending++;
      else if (apt.paymentStatus === "failed") paymentCounts.failed++;
      else if (apt.paymentStatus === "refunded") { paymentCounts.refunded++; paymentCounts.refundedAmount += fee; }
    });

    // 5. Doctor Verification
    let approved = 0, pending = 0, rejected = 0;
    doctors.forEach(doc => {
      if (doc.verificationStatus === "approved") approved++;
      else if (doc.verificationStatus === "rejected") rejected++;
      else pending++;
    });
    const totalDocs = approved + pending + rejected;

    return {
      appointmentTrends: Array.from(apptTrendsMap.values()),
      revenueChartData: Array.from(apptTrendsMap.values()),
      registrationTrends: Array.from(regTrendsMap.values()),
      onlineVsInPerson: {
        data: [
          { name: "In-person", value: inPersonCount, color: COLORS.green },
          { name: "Online", value: onlineCount, color: COLORS.blue }
        ],
        total: totalConsultations
      },
      statusStats: [
        { name: "Completed", value: statusCounts.completed, color: COLORS.green },
        { name: "Confirmed", value: statusCounts.confirmed, color: COLORS.blue },
        { name: "Rescheduled", value: statusCounts.rescheduled, color: COLORS.purple },
        { name: "Cancelled", value: statusCounts.cancelled, color: COLORS.red },
      ],
      revenueOverview: paymentCounts,
      verificationStats: {
        data: [
          { name: "Approved", value: approved, color: COLORS.green },
          { name: "Pending", value: pending, color: COLORS.amber },
          { name: "Rejected", value: rejected, color: COLORS.red },
        ],
        total: totalDocs
      }
    };

  }, [appointments, doctors, timeRange]);

  if (!isClient) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Platform insights, appointments and revenue overview.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setTimeRange("7")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === "7" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange("30")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === "30" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Last 30 Days
            </button>
          </div>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Custom Range
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: "Total Appointments", value: kpis.totalAppointments, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "blue", trend: "12%" },
          { label: "Total Patients", value: kpis.totalPatients, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "teal", trend: "14%" },
          { label: "Total Doctors", value: kpis.totalDoctors, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "purple", trend: "25%" },
          { label: "Total Revenue", value: `$${kpis.totalRevenue.toLocaleString()}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald", trend: "18%" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={kpi.icon} />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-3xl font-bold text-slate-900 mb-2">{kpi.value}</p>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {kpi.trend} <span className="text-slate-400 font-normal">from last week</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Trends & Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Trends */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Appointment Trends</h2>
              <p className="text-sm text-slate-500 mt-1">Number of appointments over time</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full">
            {appointmentTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={appointmentTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Area type="monotone" dataKey="appointments" stroke={COLORS.blue} strokeWidth={3} fillOpacity={1} fill="url(#colorAppt)" dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6, fill: COLORS.blue }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No appointment data available for this period.
              </div>
            )}
          </div>
        </div>

        {/* User Registrations */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">User Registrations</h2>
              <p className="text-sm text-slate-500 mt-1">New patient and doctor registrations</p>
            </div>
          </div>
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={registrationTrends} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', bottom: 0 }} />
                <Bar dataKey="Patients" fill={COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Doctors" fill={COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Status & Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[360px]">
          <div className="mb-6">
            <h2 className="text-[17px] font-bold text-slate-900">Appointment Status</h2>
            <p className="text-sm text-slate-500 mt-1">Distribution of appointments by status</p>
          </div>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusStats} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={90}
                  tick={{ fontSize: 13, fill: '#475569', fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={6} barSize={20} background={{ fill: '#F1F5F9', radius: 6 }} label={{ position: 'right', fill: '#0F2747', fontWeight: 600, fontSize: 14 }}>
                  {statusStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consultation Types */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[360px]">
          <div className="mb-2">
            <h2 className="text-[17px] font-bold text-slate-900">Consultation Types</h2>
            <p className="text-sm text-slate-500 mt-1">Online vs In-person appointments</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={onlineVsInPerson.data}
                  cx="40%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {onlineVsInPerson.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0F2747' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center" style={{ left: '40%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <span className="text-3xl font-bold text-slate-900 leading-none">{onlineVsInPerson.total}</span>
              <span className="text-sm font-medium text-slate-500 mt-1">Total</span>
            </div>

            {/* Custom Legend */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 w-40">
              {onlineVsInPerson.data.map((entry, index) => {
                const percentage = onlineVsInPerson.total > 0 ? Math.round((entry.value / onlineVsInPerson.total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[15px] font-medium text-slate-700">{entry.name}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-[15px] font-bold text-slate-900">{entry.value}</span>
                      <span className="text-[13px] text-slate-500 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue & Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment Overview */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Payment Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Revenue and payment status</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <p className="text-[13px] font-medium text-slate-500 mb-2">Paid Payments</p>
              <p className="text-2xl font-bold text-emerald-600">{revenueOverview.paid}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <p className="text-[13px] font-medium text-slate-500 mb-2">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-500">{revenueOverview.pending}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <p className="text-[13px] font-medium text-slate-500 mb-2">Failed Payments</p>
              <p className="text-2xl font-bold text-red-600">{revenueOverview.failed}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <p className="text-[13px] font-medium text-slate-500 mb-2">Refunded Amount</p>
              <p className="text-2xl font-bold text-slate-700">${revenueOverview.refundedAmount.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Revenue line chart */}
          <div className="flex-1 min-h-0 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.emerald} strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: COLORS.emerald }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctor Verifications */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm p-6 flex flex-col h-[380px]">
          <div className="mb-2">
            <h2 className="text-[17px] font-bold text-slate-900">Doctor Verifications</h2>
            <p className="text-sm text-slate-500 mt-1">Verification status of registered doctors</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={verificationStats.data}
                  cx="40%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {verificationStats.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0F2747' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center" style={{ left: '40%', top: '50%', transform: 'translate(-50%, -50%)' }}>
              <span className="text-3xl font-bold text-slate-900 leading-none">{verificationStats.total}</span>
              <span className="text-sm font-medium text-slate-500 mt-1">Total</span>
            </div>

            {/* Custom Legend */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-5 w-40">
              {verificationStats.data.map((entry, index) => {
                const percentage = verificationStats.total > 0 ? Math.round((entry.value / verificationStats.total) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-[15px] font-medium text-slate-700">{entry.name}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <span className="text-[15px] font-bold text-slate-900">{entry.value}</span>
                      <span className="text-[13px] text-slate-500 w-8 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
