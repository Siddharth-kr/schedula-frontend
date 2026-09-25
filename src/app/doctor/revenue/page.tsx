"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAppSelector } from "@/store/hooks";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorRevenue, type Payment } from "@/lib/payment-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentById } from "@/lib/appointment-store";


export default function DoctorRevenuePage() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [revenueStats, setRevenueStats] = useState({
    totalCompleted: 0,
    todaysEarnings: 0,
    monthlyEarnings: 0,
    pendingSettlements: 0,
    payments: [] as Payment[],
  });
  
  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("month");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed" | "cancelled" | "refunded">("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { doctor: session } = useAppSelector(state => state.auth);
  const allAppointments = useAppSelector(state => state.appointments.appointments);

  useEffect(() => {
    const loadRevenue = () => {
      if (!session) {
        router.push("/doctor/login");
        return;
      }
      setDoctor(session);
      setRevenueStats(getDoctorRevenue(session.id));
      setIsLoading(false);
    };
    
    loadRevenue();
    
    window.addEventListener("schedula_payments_updated", loadRevenue);
    return () => {
      window.removeEventListener("schedula_payments_updated", loadRevenue);
    };
  }, [session, router]);

  if (isLoading || !doctor) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F7F9FC]">
        <div className="size-8 rounded-full border-4 border-border border-t-primary animate-spin"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split("T")[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const filteredPayments = revenueStats.payments.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (filter === "all") return true;
    if (filter === "today") return p.transactionDate.startsWith(todayStr);
    if (filter === "week") return p.transactionDate >= weekStr;
    if (filter === "month") return p.transactionDate.startsWith(thisMonthStr);
    return true;
  }).sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  // Generate chart data (last 7 days logic)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayEarnings = revenueStats.payments
      .filter(p => p.transactionDate.startsWith(dateStr) && p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    chartData.push({
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      amount: dayEarnings
    });
  }
  const maxChartValue = Math.max(...chartData.map(d => d.amount), 1);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-5 lg:px-6 xl:px-10 py-6 sm:py-8">
        
        {/* REVENUE PAGE HEADER */}
        <header className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none rounded-r-2xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-blue-100 shrink-0">
               <svg className="size-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif mb-1">Revenue & Earnings</h1>
              <p className="text-slate-500 text-sm">Track your consultation income and settlements.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl pl-3 pr-4 py-1.5 shadow-sm">
              <span className="text-sm font-bold text-slate-500 shrink-0">Date Range:</span>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 cursor-not-allowed">
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                This Month
              </div>
            </div>

            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          
          {/* Today&apos;s Earnings */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Earnings</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">₹{revenueStats.todaysEarnings}</span>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100/50">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">This Month</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">₹{revenueStats.monthlyEarnings}</span>
            </div>
          </div>

          {/* Pending Settlements */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/50">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Settlements</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">₹{revenueStats.pendingSettlements}</span>
            </div>
          </div>

          {/* Total Paid Consultations */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100/50">
                  <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paid Consultations</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-900 leading-none">{revenueStats.totalCompleted}</span>
            </div>
          </div>
          
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[46%_54%] gap-6 mb-8">
          
          {/* LEFT COLUMN: Insights & Charts */}
          <div className="flex flex-col gap-6">
            
            {/* Earnings Trend */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-[320px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <svg className="size-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                    Earnings Trend (7 Days)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daily consultation earnings for the last 7 days.</p>
                </div>
                <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Last 7 Days
                </div>
              </div>
              
              <div className="flex-1 w-full relative">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                      <YAxis tickFormatter={(value) => `₹${value}`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip 
                        formatter={(value) => [`₹${value}`, "Earnings"]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#2563EB' }}
                      />
                      <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <svg className="size-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    <span className="text-sm font-bold text-slate-500">Not enough data to display trend</span>
                  </div>
                )}
              </div>
            </div>

            {/* Settlement Overview */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <svg className="size-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Settlement Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Track the status of your earnings and settlements.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Settled to Bank</p>
                    <p className="text-[11px] text-slate-500 leading-tight">Funds successfully transferred</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 shrink-0">₹{
                    revenueStats.payments.filter(p => p.settlementStatus === "settled").reduce((acc, curr) => acc + curr.amount, 0)
                  }</span>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="size-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Processing</p>
                    <p className="text-[11px] text-slate-500 leading-tight">Arriving in 1-2 business days</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 shrink-0">₹{revenueStats.pendingSettlements}</span>
                </div>
              </div>
            </div>

            {/* Quick Insights */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <svg className="size-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  Quick Insights
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Total Earnings</span>
                  <span className="text-lg font-black text-slate-900 leading-tight">₹{revenueStats.monthlyEarnings}</span>
                  <span className="text-[9px] font-medium text-slate-500 mt-0.5">This Month</span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Settlements</span>
                  <span className="text-lg font-black text-slate-900 leading-tight">₹{
                    revenueStats.payments.filter(p => p.settlementStatus === "settled").reduce((acc, curr) => acc + curr.amount, 0)
                  }</span>
                  <span className="text-[9px] font-medium text-slate-500 mt-0.5">Transferred</span>
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pending Amount</span>
                  <span className="text-lg font-black text-slate-900 leading-tight">₹{revenueStats.pendingSettlements}</span>
                  <span className="text-[9px] font-medium text-slate-500 mt-0.5">In Process</span>
                </div>
              </div>
            </div>

          </div>
          
          {/* RIGHT COLUMN: Transaction History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-0.5">
                  <svg className="size-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  Transaction History
                </h3>
                <p className="text-xs text-slate-500">All your consultation payments and settlements.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "pending" | "failed" | "cancelled" | "refunded")}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "all" | "today" | "week" | "month")}
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              {filteredPayments.length === 0 ? (
                <div className="p-12 h-full flex flex-col items-center justify-center min-h-[300px]">
                  <div className="size-14 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                    <svg className="size-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-base font-bold text-slate-900">No transactions found</p>
                  <p className="text-sm text-slate-500 mt-1">Try adjusting your filters to see more results.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      <th className="px-5 py-3">Patient & ID</th>
                      <th className="px-5 py-3">Date & Time</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Payment Status</th>
                      <th className="px-5 py-3">Settlement</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPayments.map(p => {
                      const apt = allAppointments.find(a => a.id === p.appointmentId);
                      const patientName = apt ? apt.patient.name : p.patientId;
                      return (
                      <tr key={p.paymentId} className="hover:bg-slate-50/50 transition-colors h-[75px]">
                        <td className="px-5">
                          <p className="text-[13px] font-bold text-slate-900 leading-tight">{patientName}</p>
                          <p className="text-[11px] font-medium text-slate-400 font-mono mt-0.5">{p.paymentId}</p>
                        </td>
                        <td className="px-5">
                          <p className="text-[13px] font-medium text-slate-700 leading-tight">{new Date(p.transactionDate).toLocaleDateString()}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{new Date(p.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5">
                          <span className="text-[14px] font-black text-slate-900">₹{p.amount}</span>
                        </td>
                        <td className="px-5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            p.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                            p.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' : 
                            p.status === 'refunded' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            p.settlementStatus === 'settled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {p.settlementStatus}
                          </span>
                        </td>
                        <td className="px-5 text-right">
                          <button 
                            onClick={() => setSelectedPayment(p)}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors shadow-sm"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {/* DETAILS MODAL */}
      {/* DETAILS MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Payment Details
                <span className="ml-2 inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Demo</span>
              </h3>
              <button onClick={() => setSelectedPayment(null)} className="text-text-secondary hover:text-text-primary p-1">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-text-secondary">Amount {selectedPayment.status === "paid" ? "Paid" : ""}</span>
                <span className="text-2xl font-bold text-text-primary">₹{selectedPayment.amount}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Transaction ID</span>
                  <span className="text-sm font-medium text-text-primary font-mono">{selectedPayment.paymentId}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Payment Status</span>
                  <span className={`inline-flex items-center gap-1.5 font-bold text-sm ${
                    selectedPayment.status === 'paid' ? 'text-success' : 
                    selectedPayment.status === 'failed' ? 'text-error' : 
                    selectedPayment.status === 'refunded' ? 'text-slate-600' : 
                    'text-amber-500'
                  }`}>
                    <span className={`size-2 rounded-full ${
                      selectedPayment.status === 'paid' ? 'bg-success' : 
                      selectedPayment.status === 'failed' ? 'bg-error' : 
                      selectedPayment.status === 'refunded' ? 'bg-slate-400' : 
                      'bg-amber-500'
                    }`}></span>
                    {selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Date & Time</span>
                  <span className="text-sm font-medium text-text-primary">{new Date(selectedPayment.transactionDate).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Patient Name</span>
                  <span className="text-sm font-medium text-text-primary">
                    {(() => {
                      const apt = allAppointments.find(a => a.id === selectedPayment.appointmentId);
                      return apt ? apt.patient.name : selectedPayment.patientId;
                    })()}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Payment Method</span>
                  <span className="text-sm font-medium text-text-primary">{selectedPayment.paymentMethod || "Demo Payment"}</span>
                </div>
              </div>
              
              <div>
                <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-2">Settlement Status</span>
                <div className={`p-3 rounded-lg border flex items-center gap-3 ${selectedPayment.settlementStatus === 'settled' ? 'bg-success/5 border-success/20' : 'bg-amber-50 border-amber-200'}`}>
                  {selectedPayment.settlementStatus === 'settled' ? (
                    <div className="size-8 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="size-8 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                  <div>
                    <p className={`text-sm font-bold ${selectedPayment.settlementStatus === 'settled' ? 'text-success' : 'text-amber-700'}`}>
                      {selectedPayment.settlementStatus === 'settled' ? 'Settled to Bank Account' : 'Processing Settlement'}
                    </p>
                    <p className="text-[11px] font-medium text-text-secondary mt-0.5">
                      {selectedPayment.settlementStatus === 'settled' ? 'Funds have been successfully transferred.' : 'Funds will arrive in 1-2 business days.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {(() => {
                const apt = getAppointmentById(selectedPayment.appointmentId);
                return apt ? (
                  <div className="pt-4 border-t border-border flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Appointment Details</p>
                        <p className="text-sm font-bold text-primary">{apt.appointmentType || "General Consultation"}</p>
                      </div>
                      <Link 
                        href={`/doctor/appointments/${apt.id}`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View Appointment
                      </Link>
                    </div>
                    <p className="text-xs text-text-secondary">Appointment ID: <span className="font-mono">{apt.id}</span></p>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="p-4 border-t border-border bg-stone-50 text-center">
              <button onClick={() => setSelectedPayment(null)} className="w-full py-2.5 rounded-lg bg-white border border-border text-sm font-bold text-text-primary hover:bg-stone-100 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
