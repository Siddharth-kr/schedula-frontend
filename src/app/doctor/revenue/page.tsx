"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDoctorRevenue, type Payment } from "@/lib/payment-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentById } from "@/lib/appointment-store";

import { useAuthStore } from "@/store/authStore";

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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { doctor: session } = useAuthStore();

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
            { label: "Today's Earnings", value: `$${revenueStats.todaysEarnings}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "This Month", value: `$${revenueStats.monthlyEarnings}`, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "text-primary", bg: "bg-primary/10" },
            { label: "Pending Settlements", value: `$${revenueStats.pendingSettlements}`, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-amber-600", bg: "bg-amber-50" },
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
                        ${d.amount}
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
                      <p className="text-sm font-bold text-text-primary">Settled</p>
                      <p className="text-[11px] text-text-secondary font-medium">Transferred to bank</p>
                    </div>
                  </div>
                  <span className="font-bold text-text-primary tabular-nums">
                    ${revenueStats.payments.filter(p => p.settlementStatus === "settled").reduce((s,p)=>s+p.amount, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">Pending</p>
                      <p className="text-[11px] text-text-secondary font-medium">Processing settlement</p>
                    </div>
                  </div>
                  <span className="font-bold text-text-primary tabular-nums">
                    ${revenueStats.pendingSettlements}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* RIGHT COL: Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border shadow-sm flex flex-col h-full">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-base font-bold text-text-primary">Transaction History</h2>
                <div className="flex bg-stone-100 p-1 rounded-lg">
                  {(["all", "today", "week", "month"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      {f === "all" ? "All Time" : f}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto min-h-[400px]">
                {filteredPayments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                    <svg className="size-12 text-stone-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <p className="text-sm font-medium text-text-secondary">No transactions found for this period.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-stone-50/50">
                        <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Patient / ID</th>
                        <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Date</th>
                        <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Amount</th>
                        <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Settlement</th>
                        <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPayments.map(p => (
                        <tr key={p.paymentId} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-text-primary">{p.patientId}</p>
                            <p className="text-[11px] font-medium text-text-secondary mt-0.5 font-mono">{p.paymentId}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-text-primary">{new Date(p.transactionDate).toLocaleDateString()}</p>
                            <p className="text-[11px] text-text-secondary">{new Date(p.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-text-primary">${p.amount}</span>
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
                      ))}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border">
            <div className="p-5 border-b border-border flex items-center justify-between bg-stone-50">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Payment Details
              </h3>
              <button onClick={() => setSelectedPayment(null)} className="text-text-secondary hover:text-text-primary p-1">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-sm font-medium text-text-secondary">Amount Paid</span>
                <span className="text-2xl font-bold text-emerald-600">${selectedPayment.amount}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Transaction ID</span>
                  <span className="text-sm font-medium text-text-primary font-mono">{selectedPayment.paymentId}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Date & Time</span>
                  <span className="text-sm font-medium text-text-primary">{new Date(selectedPayment.transactionDate).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Patient Name</span>
                  <span className="text-sm font-medium text-text-primary">{selectedPayment.patientId}</span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Payment Method</span>
                  <span className="text-sm font-medium text-text-primary">{selectedPayment.paymentMethod}</span>
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
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider font-bold text-text-secondary mb-1">Appointment Type</p>
                      <p className="text-sm font-bold text-primary">{apt.appointmentType || "General Consultation"}</p>
                    </div>
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
