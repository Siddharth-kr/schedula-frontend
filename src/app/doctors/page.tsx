"use client";

import { useState, useMemo } from "react";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";

const SPECIALTIES = [
  { id: "General Medicine", icon: "🩺" },
  { id: "Cardiology", icon: "❤️" },
  { id: "Dermatology", icon: "✨" },
  { id: "Pediatrics", icon: "🧸" },
  { id: "Neurology", icon: "🧠" },
  { id: "Orthopedics", icon: "🦴" },
  { id: "Gynecology", icon: "⚕️" },
  { id: "ENT", icon: "👂" },
  { id: "Ophthalmology", icon: "👁️" }
];

export default function DoctorsPage() {
  const { data: doctors, status } = useDoctors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  
  // Filters
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [feeRange, setFeeRange] = useState<number>(300);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("recommended");
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter Logic
  const filteredAndSortedDoctors = useMemo(() => {
    let result = [...doctors];

    // Search query (Name, Bio, Specialty, Qualification)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => 
        doc.name.toLowerCase().includes(q) || 
        doc.specialty.toLowerCase().includes(q) ||
        (doc.qualification && doc.qualification.toLowerCase().includes(q)) ||
        (doc.bio && doc.bio.toLowerCase().includes(q))
      );
    }

    // Specialization shortcut
    if (selectedSpecialty) {
      result = result.filter(doc => doc.specialty === selectedSpecialty);
    }

    // Filters
    if (availabilityFilter === "today") {
      result = result.filter(doc => doc.availableNextDays === 0);
    } else if (availabilityFilter === "tomorrow") {
      result = result.filter(doc => doc.availableNextDays <= 1);
    } else if (availabilityFilter === "3days") {
      result = result.filter(doc => doc.availableNextDays <= 3);
    }

    if (feeRange < 300) {
      result = result.filter(doc => doc.consultationFee <= feeRange);
    }

    if (ratingFilter > 0) {
      result = result.filter(doc => doc.rating >= ratingFilter);
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "fee_low":
        result.sort((a, b) => a.consultationFee - b.consultationFee);
        break;
      case "fee_high":
        result.sort((a, b) => b.consultationFee - a.consultationFee);
        break;
      case "experience":
        result.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      case "availability":
        result.sort((a, b) => a.availableNextDays - b.availableNextDays);
        break;
      default:
        // "recommended" - mix of rating and reviews
        result.sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount));
        break;
    }

    return result;
  }, [doctors, searchQuery, selectedSpecialty, availabilityFilter, feeRange, ratingFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty(null);
    setAvailabilityFilter("all");
    setFeeRange(300);
    setRatingFilter(0);
    setSortBy("recommended");
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      
      {/* HERO & SEARCH */}
      <div className="bg-white border-b border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-text-primary font-serif mb-4">Find the Right Doctor</h1>
            <p className="text-lg text-text-secondary">Search by name, specialty, condition or hospital and book an appointment instantly.</p>
          </div>
          
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-xl">🔍</span>
              </div>
              <input 
                type="text" 
                placeholder="Search doctors, conditions, or specialties..." 
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-shadow placeholder:text-text-secondary/60 font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-64 opacity-60 cursor-not-allowed">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-xl">📍</span>
              </div>
              <input 
                type="text" 
                placeholder="All Locations" 
                disabled
                className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-2xl text-base cursor-not-allowed shadow-sm font-medium"
              />
            </div>
            <button type="button" className="bg-primary text-white font-bold py-4 px-8 rounded-2xl hover:bg-primary-dark transition-colors shadow-sm hidden sm:block shrink-0">
              Search
            </button>
          </div>

          {/* SPECIALTIES SHORTCUTS */}
          <div className="max-w-5xl mx-auto mt-10">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest text-center mb-4">Browse by Specialization</p>
            <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
              {SPECIALTIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.id ? null : s.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    selectedSpecialty === s.id 
                      ? "bg-primary text-white border-primary shadow-md" 
                      : "bg-white text-text-primary border-border hover:border-primary/50 hover:bg-stone-50 shadow-sm"
                  }`}
                >
                  <span className="text-base">{s.icon}</span> {s.id}
                </button>
              ))}
              <button
                onClick={() => setSelectedSpecialty(null)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  selectedSpecialty === null
                    ? "bg-text-primary text-white border-text-primary shadow-md" 
                    : "bg-white text-text-primary border-border hover:bg-stone-50 shadow-sm"
                }`}
              >
                View All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto mt-8">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <p className="font-bold text-text-primary">{filteredAndSortedDoctors.length} Doctors Found</p>
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-xl text-sm font-bold text-text-primary shadow-sm"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* FILTER SIDEBAR */}
          <aside className={`w-full lg:w-[280px] xl:w-[300px] shrink-0 bg-white border border-border rounded-2xl shadow-sm p-6 lg:sticky lg:top-8 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-primary font-serif">Filters</h2>
              <button onClick={handleClearFilters} className="text-xs font-bold text-primary hover:underline">Clear All</button>
            </div>
            
            <div className="space-y-8">
              
              {/* Availability Filter */}
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Availability</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'all'} onChange={() => setAvailabilityFilter('all')} className="size-4 text-primary focus:ring-primary border-border" />
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Any time</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'today'} onChange={() => setAvailabilityFilter('today')} className="size-4 text-primary focus:ring-primary border-border" />
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Available Today</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'tomorrow'} onChange={() => setAvailabilityFilter('tomorrow')} className="size-4 text-primary focus:ring-primary border-border" />
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Available Tomorrow</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === '3days'} onChange={() => setAvailabilityFilter('3days')} className="size-4 text-primary focus:ring-primary border-border" />
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Next 3 Days</span>
                  </label>
                </div>
              </div>

              <hr className="border-border" />

              {/* Consultation Type (Mock UI) */}
              <div className="opacity-60">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Consultation Type</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="size-4 rounded border-border text-primary cursor-not-allowed" />
                    <span className="text-sm font-medium text-text-primary">In-Person</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <input type="checkbox" disabled className="size-4 rounded border-border text-primary cursor-not-allowed" />
                    <span className="text-sm font-medium text-text-primary">Video Consultation</span>
                  </label>
                </div>
              </div>

              <hr className="border-border" />

              {/* Fee Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest">Max Fee</h3>
                  <span className="text-sm font-bold text-primary">${feeRange === 300 ? "300+" : feeRange}</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="300" step="10"
                  value={feeRange}
                  onChange={(e) => setFeeRange(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <hr className="border-border" />

              {/* Rating */}
              <div>
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-3">Rating</h3>
                <div className="space-y-2.5">
                  {[4, 3].map(stars => (
                    <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="rating" checked={ratingFilter === stars} onChange={() => setRatingFilter(stars)} className="size-4 text-primary focus:ring-primary border-border" />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
                        <span className="flex text-[#F59E0B]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`size-4 ${i < stars ? 'text-[#F59E0B]' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          ))}
                        </span>
                        & up
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMobileFiltersOpen(false)}
              className="mt-8 w-full bg-primary text-white font-bold py-3 px-4 rounded-xl lg:hidden"
            >
              Apply Filters
            </button>
          </aside>

          {/* DOCTOR RESULTS */}
          <div className="flex-1 min-w-0">
            
            {/* Header / Sorting */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary font-serif">{filteredAndSortedDoctors.length} Doctors Found</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-secondary">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="bg-white border border-border rounded-xl px-4 py-2 text-sm font-bold text-text-primary focus:outline-none focus:border-primary shadow-sm"
                >
                  <option value="recommended">Most Relevant</option>
                  <option value="rating">Highest Rated</option>
                  <option value="fee_low">Lowest Consultation Fee</option>
                  <option value="fee_high">Highest Consultation Fee</option>
                  <option value="experience">Most Experienced</option>
                  <option value="availability">Earliest Availability</option>
                </select>
              </div>
            </div>

            {/* Mobile Sorting */}
            <div className="lg:hidden mb-6 flex items-center gap-3">
              <span className="text-sm font-medium text-text-secondary whitespace-nowrap">Sort by:</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-4 py-2 text-sm font-bold text-text-primary focus:outline-none focus:border-primary shadow-sm"
              >
                <option value="recommended">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="fee_low">Lowest Fee</option>
                <option value="fee_high">Highest Fee</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>

            {/* Grid */}
            {status === "loading" && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-[380px] w-full animate-pulse rounded-2xl bg-white border border-border shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-4 mb-4">
                        <div className="size-16 rounded-full bg-slate-200" />
                        <div className="flex-1 space-y-2 pt-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="space-y-2 mt-6">
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-5/6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-8">
                      <div className="h-10 bg-slate-200 rounded-xl" />
                      <div className="h-10 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status === "error" && (
              <div className="rounded-2xl border border-red-100 bg-error/5 p-12 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-error mb-5">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-error font-serif mb-2">Unable to load doctors.</h3>
                <p className="text-text-secondary max-w-md mx-auto mb-6">There was a problem fetching the doctor directory. Please check your connection and try again.</p>
                <button 
                  className="rounded-xl border border-error/30 bg-white px-8 py-3 text-sm font-bold text-error shadow-sm hover:bg-error/5 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "ready" && filteredAndSortedDoctors.length > 0 && (
              <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
                {filteredAndSortedDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}

            {status === "ready" && filteredAndSortedDoctors.length === 0 && (
              <div className="rounded-2xl border border-border bg-white p-16 text-center shadow-sm">
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-background text-text-secondary mb-6 border border-border">
                  <span className="text-3xl">🥼</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary font-serif mb-2">No doctors match your current filters.</h3>
                <p className="text-text-secondary max-w-md mx-auto mb-8 text-lg">Try removing a filter, broadening your fee range, or searching for another specialty.</p>
                <button 
                  onClick={handleClearFilters}
                  className="rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-sm hover:bg-primary-dark transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
