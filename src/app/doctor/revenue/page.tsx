"use client";
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
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">Revenue & Earnings</h1>
            <p className="text-sm text-text-secondary mt-1">Track your consultation income and settlements.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg border border-border bg-white text-sm font-semibold shadow-sm flex items-center gap-2 hover:bg-stone-50 transition-colors">
              <svg className="size-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's Earnings", value: `₹${revenueStats.todaysEarnings}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "This Month", value: `₹${revenueStats.monthlyEarnings}`, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending Settlements", value: `₹${revenueStats.pendingSettlements}`, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Paid Consultations", value: revenueStats.totalCompleted, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-violet-600", bg: "bg-violet-50" },
          ].map((m, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-secondary">{m.label}</span>
                <div className={`size-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <svg className={`size-4 ${m.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-text-primary tabular-nums">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COL: Analytics & Chart */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-bold text-text-primary mb-6">Earnings Trend (7 Days)</h2>
              <div className="flex items-end justify-between h-48 gap-2 px-1">
                {chartData.map((d, i) => {
                  const height = maxChartValue > 0 ? (d.amount / maxChartValue) * 100 : 0;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                      <span className={`text-[10px] font-bold transition-opacity ${isToday ? "text-emerald-600 opacity-100" : "text-text-primary opacity-0 group-hover:opacity-100"}`}>
                        ₹{d.amount}
                      </span>
                      <div className="w-full max-w-[32px] bg-emerald-50 rounded-t-md relative flex flex-col justify-end overflow-hidden" style={{ height: "100%" }}>
                        <div 
                          className={`w-full rounded-t-md transition-all duration-700 ${isToday ? "bg-emerald-500" : "bg-emerald-400/60 group-hover:bg-emerald-400"}`}
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <span className={`text-[11px] font-bold uppercase mt-1 ${isToday ? "text-emerald-600" : "text-text-secondary"}`}>{d.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h2 className="text-base font-bold text-text-primary mb-4">Settlement Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Settled to Bank</p>
                      <p className="text-xs text-text-secondary mt-0.5">Funds successfully transferred</p>
                    </div>
                  </div>
                  <span className="font-bold text-text-primary">
                    ₹{revenueStats.payments.filter(p => p.settlementStatus === "settled" && p.status === "paid").reduce((s, p) => s + p.amount, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Processing</p>
                      <p className="text-xs text-text-secondary mt-0.5">Arriving in 1-2 business days</p>
                    </div>
                  </div>
                  <span className="font-bold text-text-primary">
                    ₹{revenueStats.pendingSettlements}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COL: Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-border gap-4">
                <h2 className="text-base font-bold text-text-primary">Transaction History</h2>
                <div className="flex items-center gap-2">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | "paid" | "pending" | "failed" | "cancelled" | "refunded")}
                    className="text-sm border border-border rounded-lg px-3 py-2 bg-stone-50 text-text-primary font-medium focus:ring-2 focus:ring-primary/20 outline-none"
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
                    className="text-sm border border-border rounded-lg px-3 py-2 bg-stone-50 text-text-primary font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Past 7 Days</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {filteredPayments.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="size-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                      <svg className="size-6 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-base font-bold text-text-primary">No transactions found</p>
                    <p className="text-sm text-text-secondary mt-1">Try adjusting your filters to see more results.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-stone-50/50 text-[11px] uppercase tracking-wider font-bold text-text-secondary">
                        <th className="px-5 py-3 font-semibold">Patient & ID</th>
                        <th className="px-5 py-3 font-semibold">Date & Time</th>
                        <th className="px-5 py-3 font-semibold">Amount</th>
                        <th className="px-5 py-3 font-semibold">Payment Status</th>
                        <th className="px-5 py-3 font-semibold">Settlement</th>
                        <th className="px-5 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPayments.map(p => {
                        const apt = allAppointments.find(a => a.id === p.appointmentId);
                        const patientName = apt ? apt.patient.name : p.patientId;
                        return (
                        <tr key={p.paymentId} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-text-primary">{patientName}</p>
                            <p className="text-[11px] font-medium text-text-secondary mt-0.5 font-mono">{p.paymentId}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-text-primary">{new Date(p.transactionDate).toLocaleDateString()}</p>
                            <p className="text-[11px] text-text-secondary">{new Date(p.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-text-primary">₹{p.amount}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'paid' ? 'bg-success/10 text-success' : 
                              p.status === 'failed' ? 'bg-error/10 text-error' : 
                              p.status === 'refunded' ? 'bg-slate-100 text-slate-600' : 
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.settlementStatus === 'settled' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {p.settlementStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button 
                              onClick={() => setSelectedPayment(p)}
                              className="text-xs font-bold text-primary hover:text-primary-dark hover:underline"
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
      </div>
      
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
