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
    <div className="w-full bg-background min-h-screen pb-12">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        
        {/* Header Section */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-serif text-text-primary">Rating Analyzer</h1>
            <p className="text-text-secondary mt-1 text-sm">
              Understand patient feedback and track your overall rating performance.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button 
              onClick={handleExportReport}
              className="px-4 py-2.5 bg-white border border-border text-text-primary rounded-xl text-sm font-medium hover:bg-background transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">Timeframe:</span>
              <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
              className="border border-border rounded-lg px-4 py-2 bg-white text-sm font-medium text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
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

        {doctorReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">No Reviews Yet</h2>
            <p className="text-text-secondary max-w-md">
              Patient ratings will appear here once patients submit feedback following their completed appointments.
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              {/* Overall Rating Card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Overall Rating</span>
                {totalReviews > 0 ? (
                  <div className="flex items-end gap-2 mt-auto">
                    <span className="text-4xl font-bold text-text-primary flex items-center gap-2">
                      <span className="text-accent">⭐</span> {overallRating}
                    </span>
                    <span className="text-sm text-text-secondary mb-1">/ 5.0</span>
                  </div>
                ) : (
                  <span className="text-lg font-medium text-text-secondary mt-auto">No data in period</span>
                )}
              </div>

              {/* Total Reviews Card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Total Reviews</span>
                {totalReviews > 0 ? (
                  <div className="mt-auto">
                    <span className="text-4xl font-bold text-text-primary">{totalReviews}</span>
                    <span className="text-sm text-text-secondary ml-2">reviews</span>
                  </div>
                ) : (
                  <span className="text-lg font-medium text-text-secondary mt-auto">0 reviews</span>
                )}
              </div>

              {/* Positive Feedback Card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Positive Feedback</span>
                {totalReviews > 0 ? (
                  <div className="mt-auto">
                    <span className="text-4xl font-bold text-text-primary text-green-600">{positivePercentage}%</span>
                    <span className="text-sm text-text-secondary ml-2">rated ≥ 4.0</span>
                  </div>
                ) : (
                  <span className="text-lg font-medium text-text-secondary mt-auto">No data in period</span>
                )}
              </div>

              {/* Rating Change Card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Period Change</span>
                <div className="mt-auto">
                  {ratingChange ? (
                    <>
                      <span className={`text-4xl font-bold ${ratingChange.startsWith("+") ? "text-green-600" : ratingChange.startsWith("-") ? "text-red-600" : "text-text-primary"}`}>
                        {ratingChange}
                      </span>
                      <span className="text-sm text-text-secondary ml-2">vs previous</span>
                    </>
                  ) : dateRange === "all" ? (
                    <span className="text-sm text-text-secondary">Not applicable for All Time</span>
                  ) : (
                    <span className="text-sm text-text-secondary">Insufficient historical data</span>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Rating Trend Chart */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">Rating Trend</h3>
                  <p className="text-sm text-text-secondary">Average rating performance over time</p>
                </div>
                
                <div className="flex-1 w-full min-h-[300px] flex items-center justify-center">
                  {trendData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="label" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          domain={[0, 5]} 
                          ticks={[1, 2, 3, 4, 5]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="rating" 
                          stroke="#2D6CDF" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#2D6CDF", strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center p-8 bg-background/50 rounded-xl w-full border border-dashed border-border">
                      <svg className="size-10 mx-auto text-text-secondary/50 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      <p className="text-sm font-medium text-text-secondary">Not enough historical data to display a rating trend.</p>
                      <p className="text-xs text-text-secondary/70 mt-1">At least two distinct periods of reviews are needed.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">Rating Distribution</h3>
                  <p className="text-sm text-text-secondary">Breakdown of patient feedback</p>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {totalReviews > 0 ? (
                    distribution.map((item) => {
                      const percentage = Math.round((item.count / totalReviews) * 100);
                      return (
                        <div key={item.stars} className="flex items-center gap-4">
                          <div className="w-12 text-sm font-bold text-text-primary flex items-center justify-end gap-1 shrink-0">
                            {item.stars} <span className="text-accent text-xs">⭐</span>
                          </div>
                          <div className="flex-1 h-3 bg-background rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="w-16 text-right shrink-0">
                            <span className="text-sm font-bold text-text-primary">{item.count}</span>
                            <span className="text-xs text-text-secondary ml-1">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center p-8 bg-background/50 rounded-xl w-full border border-dashed border-border h-full flex flex-col items-center justify-center">
                      <p className="text-sm font-medium text-text-secondary">No distribution data for this period.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Performance & Reporting Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold font-serif text-text-primary mb-6">Performance & Reporting</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Milestones Card */}
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-1 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      Milestones
                    </h3>
                    <p className="text-sm text-text-secondary">Your feedback achievements</p>
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-3">
                    {milestones.map((m, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${m.achieved ? "bg-green-50/50 border-green-100" : "bg-background/50 border-transparent opacity-60"}`}>
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.achieved ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium ${m.achieved ? "text-green-800" : "text-gray-500"}`}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas to Improve & Response Rate */}
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm lg:col-span-2 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-text-primary">Actionable Insights</h3>
                    <p className="text-sm text-text-secondary">Areas to improve and response tracking</p>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-background rounded-xl border border-border flex flex-col justify-center items-center text-center">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-text-secondary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mb-1">Areas to Improve</h4>
                      <p className="text-xs text-text-secondary max-w-[200px]">
                        Structured rating categories are not currently available in the feedback system.
                      </p>
                    </div>

                    <div className="p-6 bg-background rounded-xl border border-border flex flex-col justify-center items-center text-center">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-text-secondary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mb-1">Response Rate</h4>
                      <p className="text-xs text-text-secondary max-w-[200px]">
                        Review responses are not currently supported by the feedback system.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Review Intelligence Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold font-serif text-text-primary mb-6">Review Intelligence</h2>
              
              <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                {/* Controls */}
                <div className="p-4 md:p-6 border-b border-border flex flex-col md:flex-row md:items-center gap-4 bg-background/30">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search reviews by keyword..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary bg-white outline-none"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-primary"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm text-text-secondary font-medium">Rating:</span>
                    <select
                      value={ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value === "all" ? "all" : Number(e.target.value) as 5 | 4 | 3 | 2 | 1)}
                      className="block w-full md:w-auto py-2.5 pl-3 pr-10 border border-border rounded-xl text-sm focus:ring-primary focus:border-primary bg-white font-medium outline-none"
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

                {/* Review List */}
                <div className="divide-y divide-border">
                  {displayedReviews.length > 0 ? (
                    displayedReviews.map((review, i) => (
                      <div key={review.id || i} className="p-4 md:p-6 hover:bg-background/30 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex text-accent">
                                {[...Array(5)].map((_, idx) => (
                                  <svg key={idx} className={`h-4 w-4 ${idx < review.rating ? "text-accent" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm font-medium text-text-secondary">
                                {review.date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-text-primary text-sm md:text-base leading-relaxed mb-4">
                              {review.text || <span className="italic text-text-secondary">No written feedback provided.</span>}
                            </p>
                          </div>
                          <div className="shrink-0 flex items-center gap-3 md:w-48 p-3 bg-background rounded-xl border border-border">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {review.patient?.initials || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-primary">Verified Patient</p>
                              {review.patient?.age && <p className="text-xs text-text-secondary">{review.patient.age} yrs</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <svg className="h-12 w-12 text-text-secondary/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-lg font-bold text-text-primary mb-1">No reviews found</h3>
                      <p className="text-text-secondary text-sm max-w-md mx-auto">
                        We couldn&apos;t find any reviews matching your current filters and search query. Try adjusting your criteria.
                      </p>
                      <button 
                        onClick={() => { setSearchQuery(""); setRatingFilter("all"); }}
                        className="mt-6 px-4 py-2 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
