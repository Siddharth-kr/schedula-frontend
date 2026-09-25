"use client";

import { useAppSelector } from "@/store/hooks";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DateRangeOption = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

export default function RatingAnalyzerPage() {
  const router = useRouter();
  const doctor = useAppSelector((state) => state.auth.doctor);
  const allAppointments = useAppSelector((state) => state.appointments.appointments);

  const [dateRange, setDateRange] = useState<DateRangeOption>("all");
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !doctor) {
      router.push("/doctor/login");
    }
  }, [isMounted, doctor, router]);

  // Filter reviews for the authenticated doctor
  const doctorReviews = useMemo(() => {
    if (!doctor) return [];
    return allAppointments
      .filter((a) => a.doctorId === doctor.id && a.review)
      .map((a) => ({
        id: a.id,
        rating: a.review!.rating,
        text: a.review!.text || "",
        date: new Date(a.startsAt),
        patient: a.patient,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allAppointments, doctor]);

  // Handle date filtering
  const filteredReviews = useMemo(() => {
    if (dateRange === "all") return doctorReviews;

    const now = new Date();
    const cutoff = new Date();
    switch (dateRange) {
      case "7d":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "30d":
        cutoff.setDate(now.getDate() - 30);
        break;
      case "3m":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return doctorReviews.filter((r) => r.date >= cutoff);
  }, [doctorReviews, dateRange]);

  const previousPeriodReviews = useMemo(() => {
    if (dateRange === "all") return [];
    
    const now = new Date();
    const currentCutoff = new Date();
    const previousCutoff = new Date();
    
    switch (dateRange) {
      case "7d":
        currentCutoff.setDate(now.getDate() - 7);
        previousCutoff.setDate(now.getDate() - 14);
        break;
      case "30d":
        currentCutoff.setDate(now.getDate() - 30);
        previousCutoff.setDate(now.getDate() - 60);
        break;
      case "3m":
        currentCutoff.setMonth(now.getMonth() - 3);
        previousCutoff.setMonth(now.getMonth() - 6);
        break;
      case "6m":
        currentCutoff.setMonth(now.getMonth() - 6);
        previousCutoff.setMonth(now.getMonth() - 12);
        break;
      case "1y":
        currentCutoff.setFullYear(now.getFullYear() - 1);
        previousCutoff.setFullYear(now.getFullYear() - 2);
        break;
    }

    return doctorReviews.filter((r) => r.date >= previousCutoff && r.date < currentCutoff);
  }, [doctorReviews, dateRange]);

  // Calculations
  const totalReviews = filteredReviews.length;
  
  const overallRating = totalReviews > 0
    ? (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  const positiveCount = filteredReviews.filter(r => r.rating >= 4).length;
  const positivePercentage = totalReviews > 0
    ? Math.round((positiveCount / totalReviews) * 100)
    : 0;

  // Change calculation
  let ratingChange: string | null = null;
  if (dateRange !== "all" && previousPeriodReviews.length > 0 && totalReviews > 0) {
    const prevRating = previousPeriodReviews.reduce((sum, r) => sum + r.rating, 0) / previousPeriodReviews.length;
    const currRating = parseFloat(overallRating);
    const diff = currRating - prevRating;
    ratingChange = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  }

  // Distribution
  const distribution = useMemo(() => {
    const dist = [
      { stars: 5, count: 0 },
      { stars: 4, count: 0 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 0 },
    ];
    filteredReviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[5 - Math.floor(r.rating)].count++;
      }
    });
    return dist;
  }, [filteredReviews]);

  // Trend Chart Data
  const trendData = useMemo(() => {
    if (filteredReviews.length < 2) return [];

    const grouped = new Map<string, { total: number; count: number }>();
    
    filteredReviews.forEach((r) => {
      const monthYear = r.date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const current = grouped.get(monthYear) || { total: 0, count: 0 };
      grouped.set(monthYear, { total: current.total + r.rating, count: current.count + 1 });
    });

    return Array.from(grouped.entries()).map(([label, data]) => ({
      label,
      rating: parseFloat((data.total / data.count).toFixed(1))
    }));
  }, [filteredReviews]);

  const displayedReviews = useMemo(() => {
    return filteredReviews
      .filter((r) => {
        if (ratingFilter !== "all" && r.rating !== ratingFilter) return false;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          if (!r.text.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredReviews, ratingFilter, searchQuery]);

  // Milestones
  const milestones = useMemo(() => {
    return [
      { label: "First review received", achieved: doctorReviews.length >= 1 },
      { label: "10+ reviews", achieved: doctorReviews.length >= 10 },
      { label: "50+ reviews", achieved: doctorReviews.length >= 50 },
      { label: "100+ reviews", achieved: doctorReviews.length >= 100 },
      { label: "Maintained 4.5+ average", achieved: parseFloat(overallRating) >= 4.5 && doctorReviews.length > 0 },
      { label: "Maintained 4.8+ average", achieved: parseFloat(overallRating) >= 4.8 && doctorReviews.length > 0 },
    ];
  }, [doctorReviews.length, overallRating]);

  // Export report
  const handleExportReport = () => {
    if (!doctor) return;
    
    const reportDate = new Date().toLocaleDateString();
    let text = `=======================================\n`;
    text += `  SCHEDULA - RATING PERFORMANCE REPORT \n`;
    text += `=======================================\n\n`;
    text += `Doctor: Dr. ${doctor.name}\n`;
    text += `Specialty: ${doctor.specialty}\n`;
    text += `Generated: ${reportDate}\n`;
    text += `Selected Timeframe: ${dateRange}\n\n`;
    
    text += `--- SUMMARY METRICS ---\n`;
    text += `Total Reviews: ${totalReviews}\n`;
    text += `Average Rating: ${overallRating} / 5.0\n`;
    text += `Positive Feedback (>= 4 stars): ${positivePercentage}%\n\n`;
    
    text += `--- RATING DISTRIBUTION ---\n`;
    distribution.forEach(d => {
      text += `${d.stars} Stars: ${d.count} reviews\n`;
    });
    text += `\n`;

    text += `--- MILESTONES ACHIEVED ---\n`;
    const achievedMilestones = milestones.filter(m => m.achieved);
    if (achievedMilestones.length > 0) {
      achievedMilestones.forEach(m => text += `[X] ${m.label}\n`);
    } else {
      text += `No milestones achieved yet.\n`;
    }
    text += `\n`;

    text += `--- AREAS TO IMPROVE / RESPONSE RATE ---\n`;
    text += `Structured rating categories and doctor responses are not currently supported by the Schedula feedback system.\n\n`;

    text += `--- RECENT FEEDBACK (${displayedReviews.length} shown) ---\n`;
    displayedReviews.slice(0, 10).forEach((r, idx) => {
      text += `${idx + 1}. [${r.rating} Stars] - ${r.date.toLocaleDateString()}\n`;
      text += `   "${r.text || "No written feedback"}"\n`;
    });
    if (displayedReviews.length > 10) {
      text += `   ... and ${displayedReviews.length - 10} more.\n`;
    }

    // Download file
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rating_report_${doctor.name.replace(/\\s+/g, '_').toLowerCase()}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Early return after all hooks
  if (!isMounted || !doctor) return null;
  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-5 lg:px-6 xl:px-10 py-6 sm:py-8">
        {/* HEADER SECTION */}
        <header className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none rounded-r-2xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-blue-100 shrink-0">
               <svg className="size-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif mb-1">Rating Analyzer</h1>
              <p className="text-slate-500 text-sm">Understand patient feedback and track your overall rating performance.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 relative z-10">
            <button 
              onClick={handleExportReport}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
            
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl pl-3 pr-1 py-1 shadow-sm">
              <span className="text-sm font-bold text-slate-500 shrink-0">Timeframe:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                className="bg-transparent text-sm font-bold text-slate-900 focus:outline-none focus:ring-0 py-1 border-none cursor-pointer pr-8"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last 1 Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </header>

        {/* CONDITIONAL RENDER FOR EMPTY STATE */}
        {doctorReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
              <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-4 border border-blue-100">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold font-serif text-slate-900 mb-2">No reviews yet</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                You haven&apos;t received any patient reviews yet. Once your patients start rating their appointments, insights will appear here.
              </p>
          </div>
        ) : (
          <>
            {/* METRIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Overall Rating */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100/50">
                      <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overall Rating</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">{overallRating}</span>
                  <span className="text-sm font-medium text-slate-400 mb-1">/ 5.0</span>
                </div>
              </div>

              {/* Total Reviews */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 border border-blue-100/50">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reviews</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">{totalReviews}</span>
                  <span className="text-sm font-medium text-slate-400 mb-1">reviews</span>
                </div>
              </div>

              {/* Positive Feedback */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Positive Feedback</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-slate-900 leading-none">{positivePercentage}%</span>
                  <span className="text-[11px] font-medium text-slate-400 mb-1">rated ≥ 4.0</span>
                </div>
              </div>

              {/* Period Change */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center h-[130px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period Change</span>
                  </div>
                </div>
                <div>
                  {ratingChange ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black leading-none ${parseFloat(ratingChange) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {parseFloat(ratingChange) > 0 ? "↑" : parseFloat(ratingChange) < 0 ? "↓" : ""} {ratingChange}
                      </span>
                      <span className="text-xs font-medium text-slate-400">vs last period</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-500 leading-tight pr-4">
                      Not applicable for <br/> All Time
                    </p>
                  )}
                </div>
              </div>
              
            </div>

            {/* ANALYTICS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
              
              {/* Rating Trend */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <svg className="size-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                      Rating Trend
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Average rating performance over time</p>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
                  {trendData.length >= 2 ? (
                    <div className="w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                          <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '13px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#2563EB' }}
                          />
                          <Line type="monotone" dataKey="rating" stroke="#2563EB" strokeWidth={3} activeDot={{ r: 6, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center p-6 border border-dashed border-slate-200 rounded-xl bg-slate-50 w-full flex flex-col items-center justify-center h-[220px]">
                      <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-3 text-slate-400">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">Not enough historical data</h4>
                      <p className="text-xs text-slate-500 max-w-[200px]">At least two distinct periods are needed to display a rating trend.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <svg className="size-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Rating Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Breakdown of patient feedback</p>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {distribution.map((d) => {
                    const percent = totalReviews > 0 ? Math.round((d.count / totalReviews) * 100) : 0;
                    return (
                      <div key={d.stars} className="flex items-center gap-4 text-sm font-medium">
                        <div className="flex items-center gap-1.5 w-10 shrink-0 text-slate-700">
                          {d.stars} <svg className="size-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </div>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              d.stars >= 4 ? 'bg-primary' : d.stars === 3 ? 'bg-amber-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="w-14 text-right shrink-0">
                          <span className="font-bold text-slate-700">{d.count}</span>
                          <span className="text-slate-400 text-[11px] ml-1">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PERFORMANCE & REPORTING */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50 p-5 sm:px-6">
                <h3 className="text-base font-bold text-slate-900">Performance & Reporting</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Milestones */}
                <div className="p-5 sm:p-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Milestones</h4>
                  <div className="space-y-3">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`size-5 shrink-0 rounded-full flex items-center justify-center border ${
                          m.achieved ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}>
                          {m.achieved ? (
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <div className="size-1.5 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <span className={`text-sm font-medium ${m.achieved ? 'text-slate-700' : 'text-slate-400'}`}>
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actionable Insights */}
                <div className="p-5 sm:p-6 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Actionable Insights</h4>
                  <div className="flex-1 flex flex-col gap-4 justify-center">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-700 mb-1">Areas to Improve</h5>
                      <p className="text-xs text-slate-500">Structured rating categories are not currently available in the feedback system.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h5 className="text-xs font-bold text-slate-700 mb-1">Response Rate</h5>
                      <p className="text-xs text-slate-500">Review responses are not currently supported by the feedback system.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REVIEW INTELLIGENCE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
              {/* Header Controls */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-0.5">
                    <svg className="size-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Review Intelligence
                  </h3>
                  <p className="text-xs text-slate-500">Detailed patient feedback and reviews.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 xl:w-[500px]">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search reviews by keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500">Rating:</span>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value) as 5 | 4 | 3 | 2 | 1)}
                      className="bg-white border border-slate-200 rounded-xl py-2 pl-3 pr-8 text-sm font-bold text-slate-700 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm cursor-pointer"
                    >
                      <option value="all">All Ratings</option>
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Review List */}
              <div className="divide-y divide-slate-100 flex flex-col">
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((review, i) => (
                    <div key={review.id || i} className="px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      
                      {/* Stars and Date */}
                      <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 shrink-0 w-32 md:w-36">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, idx) => (
                            <svg key={idx} className={`size-[15px] ${idx < review.rating ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-[13px] font-medium text-slate-500">
                          {review.date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Review Text */}
                      <div className="flex-1 text-[14px] text-slate-700 leading-relaxed font-medium">
                        {review.text || <span className="italic text-slate-400 font-normal">No written feedback provided.</span>}
                      </div>

                      {/* Patient Badge */}
                      <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 bg-white rounded-lg border border-slate-200 shadow-sm w-fit md:w-[150px]">
                        <div className="size-7 shrink-0 rounded-md bg-blue-50 text-primary flex items-center justify-center font-bold text-xs border border-blue-100">
                          {review.patient?.initials || "?"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 leading-tight">Verified Patient</span>
                          {review.patient?.age && <span className="text-[10px] text-slate-500 leading-tight">{review.patient.age} yrs</span>}
                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="size-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                      <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">No reviews found</h3>
                    <p className="text-slate-500 text-sm max-w-[300px] mb-4">
                      We couldn&apos;t find any reviews matching your current filters and search query.
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(""); setRatingFilter("all"); }}
                      className="px-5 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

}
