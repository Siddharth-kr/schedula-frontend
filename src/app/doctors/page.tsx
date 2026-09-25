"use client";

import { useState, useMemo } from "react";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";
import { InteractiveBodyMap, BodyView } from "@/components/body-map/InteractiveBodyMap";
import { bodyRegionSpecialties } from "@/lib/body-map-data";

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
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [bodyView, setBodyView] = useState<BodyView>("front");

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
    
    console.log("=== PATIENT DISCOVERY DEBUG ===");
    console.log("Total doctors received from useDoctors():", result.length);
    console.table(
      result.map(d => ({
        id: d.id,
        name: d.name,
        verificationStatus: d.verificationStatus,
        active: d.active,
        specialty: d.specialty,
        availableNextDays: d.availableNextDays,
        consultationFee: d.consultationFee,
        rating: d.rating
      }))
    );

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

    // Specialization / Body Region filtering
    if (selectedRegionId) {
      const currentRegion = bodyRegionSpecialties[selectedRegionId];
      if (currentRegion) {
        if (selectedSpecialty) {
          result = result.filter(doc => doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) || selectedSpecialty.toLowerCase().includes(doc.specialty.toLowerCase()));
        } else {
          result = result.filter(doc => currentRegion.specialties.some(s => s.toLowerCase().includes(doc.specialty.toLowerCase()) || doc.specialty.toLowerCase().includes(s.toLowerCase())));
        }
      }
    } else if (selectedSpecialty) {
      result = result.filter(doc => doc.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()) || selectedSpecialty.toLowerCase().includes(doc.specialty.toLowerCase()));
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
  }, [doctors, searchQuery, selectedRegionId, selectedSpecialty, availabilityFilter, feeRange, ratingFilter, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty(null);
    setSelectedRegionId(null);
    setAvailabilityFilter("all");
    setFeeRange(300);
    setRatingFilter(0);
    setSortBy("recommended");
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-800">
      
      {/* HERO & SEARCH */}
      <div className="relative bg-white border-b border-slate-200 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 size-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12 lg:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            
            <div className="flex-1 max-w-3xl">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-3">Your Health, Our Priority</p>
              <h1 className="text-4xl lg:text-[2.75rem] leading-tight font-black tracking-tight text-slate-900 font-serif mb-4">
                Find the Right Doctor
              </h1>
              <p className="text-[1.1rem] text-slate-500 mb-8 max-w-xl leading-relaxed">
                Search by name, specialty, condition or explore by body part to find the best specialist for your needs and book an appointment instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 w-full max-w-3xl">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Search doctors, specialties, conditions, or hospitals..." 
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent border-0 focus:ring-0 text-base placeholder:text-slate-400 font-medium text-slate-800"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="hidden sm:block w-px bg-slate-200 my-2"></div>
                <div className="relative w-full sm:w-56 opacity-60 cursor-not-allowed">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <input 
                    type="text" 
                    placeholder="All Locations" 
                    disabled
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent border-0 text-base cursor-not-allowed font-medium text-slate-800"
                  />
                </div>
                <button type="button" className="bg-primary text-white font-bold py-3.5 px-8 rounded-xl hover:bg-primary-dark transition-colors shadow-sm w-full sm:w-auto shrink-0">
                  Search
                </button>
              </div>
            </div>

            <div className="hidden lg:block relative shrink-0">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 relative z-10 -mr-8">
                <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-extrabold text-slate-800">Qualified Specialists</p>
                  <p className="text-xs text-slate-500 font-medium">Trusted healthcare professionals</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-10">
        
        {/* DISCOVERY SECTION (Body Map & Specialties) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          
          {/* LEFT: BODY MAP */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center sm:items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none -z-0"></div>
            
            <div className="relative z-10 w-full">
              <div className="flex items-center gap-3 mb-1">
                <div className="size-10 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Browse by Body Part</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Not sure which specialist? Select an area.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-8 w-full">
                
                {/* Body Map Container */}
                <div className="relative size-[280px] bg-[#F8FAFC] rounded-2xl shadow-inner border border-slate-200 p-2 shrink-0">
                  <div className="absolute top-3 left-3 z-20 flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <button 
                      onClick={() => setBodyView("front")} 
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${bodyView === "front" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Front
                    </button>
                    <button 
                      onClick={() => setBodyView("back")} 
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${bodyView === "back" ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                      Back
                    </button>
                  </div>
                  
                  <InteractiveBodyMap 
                    onSelectRegion={(id) => { setSelectedRegionId(id); setSelectedSpecialty(null); }}
                    selectedRegionId={selectedRegionId}
                    view={bodyView}
                  />
                </div>

                {/* Selected Region Panel */}
                <div className="flex-1 w-full min-h-[280px] flex flex-col justify-center">
                  {selectedRegionId && bodyRegionSpecialties[selectedRegionId] ? (
                    <div className="w-full bg-white border border-blue-100 rounded-xl p-5 shadow-[0_4px_20px_rgb(59,130,246,0.08)] animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">Selected Area</p>
                          <h3 className="text-lg font-black text-slate-800">{bodyRegionSpecialties[selectedRegionId].label}</h3>
                        </div>
                        <button onClick={() => {setSelectedRegionId(null); setSelectedSpecialty(null);}} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Clear Area">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      
                      <p className="text-xs text-slate-500 mb-3 font-medium">Recommended Specialists:</p>
                      <div className="flex flex-col gap-2">
                        {bodyRegionSpecialties[selectedRegionId].specialties.map(spec => (
                          <button
                            key={spec}
                            onClick={() => setSelectedSpecialty(selectedSpecialty === spec ? null : spec)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-bold border transition-all ${
                              selectedSpecialty === spec
                                ? "bg-primary text-white border-primary shadow-sm"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:border-primary/50 hover:bg-blue-50/50"
                            }`}
                          >
                            {spec}
                            <svg className={`size-4 ${selectedSpecialty === spec ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-xl border-dashed">
                      <div className="mx-auto size-12 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mb-3">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                      </div>
                      <p className="text-sm font-bold text-slate-600 mb-1">Interactive Body Map</p>
                      <p className="text-xs text-slate-500">Click any body area on the diagram to see relevant specialties.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT: POPULAR SPECIALTIES */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col relative overflow-hidden">
            <div className="relative z-10 w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Popular Specialties</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Explore our most requested specialties.</p>
                  </div>
                </div>
                <button className="hidden sm:flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                  View All <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-auto">
                {SPECIALTIES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSpecialty(selectedSpecialty === s.id ? null : s.id); setSelectedRegionId(null); }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-sm font-bold border transition-all ${
                      selectedSpecialty === s.id && !selectedRegionId
                        ? "bg-primary text-white border-primary shadow-md transform scale-[1.02]" 
                        : "bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-blue-50/30 hover:shadow-sm"
                    }`}
                  >
                    <span className="text-xl shrink-0">{s.icon}</span>
                    <span className="truncate">{s.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* RESULTS HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-800 font-serif">{filteredAndSortedDoctors.length} Doctors Found</h2>
            
            {/* Active Filters Context */}
            {(selectedRegionId || selectedSpecialty) && (
              <div className="hidden md:flex items-center gap-2 ml-2">
                <span className="text-slate-300">|</span>
                {selectedRegionId && bodyRegionSpecialties[selectedRegionId] && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                    Area: {bodyRegionSpecialties[selectedRegionId].label}
                    <button onClick={() => setSelectedRegionId(null)} className="hover:text-red-500"><svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
                {selectedSpecialty && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                    {selectedSpecialty}
                    <button onClick={() => setSelectedSpecialty(null)} className="hover:text-red-500"><svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Filters
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Sort by:</span>
              <select 
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="recommended">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="fee_low">Lowest Fee</option>
                <option value="fee_high">Highest Fee</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          {/* FILTER SIDEBAR */}
          <aside className={`w-full lg:w-[260px] xl:w-[280px] shrink-0 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:sticky lg:top-8 ${isMobileFiltersOpen ? 'block mb-6' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <svg className="size-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </h2>
              <button onClick={handleClearFilters} className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-dark">Clear All</button>
            </div>
            
            <div className="space-y-7">
              {/* Availability Filter */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-3">Availability</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'all'} onChange={() => setAvailabilityFilter('all')} className="size-4 text-primary focus:ring-primary border-slate-300" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Any time</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'today'} onChange={() => setAvailabilityFilter('today')} className="size-4 text-primary focus:ring-primary border-slate-300" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Available Today</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === 'tomorrow'} onChange={() => setAvailabilityFilter('tomorrow')} className="size-4 text-primary focus:ring-primary border-slate-300" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Available Tomorrow</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name="avail" checked={availabilityFilter === '3days'} onChange={() => setAvailabilityFilter('3days')} className="size-4 text-primary focus:ring-primary border-slate-300" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">Next 3 Days</span>
                  </label>
                </div>
              </div>

              {/* Consultation Type (Mock UI) */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-3">Consultation Type</h3>
                <div className="space-y-2.5 opacity-70">
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="size-4 rounded border-slate-300 text-primary cursor-not-allowed" />
                    <span className="text-sm font-medium text-slate-600">In-Person</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-not-allowed">
                    <input type="checkbox" disabled className="size-4 rounded border-slate-300 text-primary cursor-not-allowed" />
                    <span className="text-sm font-medium text-slate-600">Video Consultation</span>
                  </label>
                </div>
              </div>

              {/* Fee Range */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900">Max Fee</h3>
                  <span className="text-xs font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-md">${feeRange === 300 ? "300+" : feeRange}</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="300" step="10"
                  value={feeRange}
                  onChange={(e) => setFeeRange(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                  <span>$0</span>
                  <span>$300+</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-3">Rating</h3>
                <div className="space-y-2.5">
                  {[4, 3].map(stars => (
                    <label key={stars} className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="rating" checked={ratingFilter === stars} onChange={() => setRatingFilter(stars)} className="size-4 text-primary focus:ring-primary border-slate-300" />
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                        <span className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <svg key={i} className={`size-4 ${i < stars ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
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
              className="mt-8 w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-xl lg:hidden shadow-md"
            >
              Apply Filters
            </button>
          </aside>

          {/* DOCTOR RESULTS */}
          <div className="flex-1 min-w-0">
            {status === "loading" && (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="w-full animate-pulse rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                    <div className="flex gap-4 mb-4">
                      <div className="size-20 sm:size-24 rounded-full bg-slate-200 shrink-0" />
                      <div className="flex-1 space-y-2 pt-2">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
                        <div className="h-5 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 ml-28">
                       <div className="h-3 bg-slate-200 rounded w-full" />
                       <div className="h-3 bg-slate-200 rounded w-5/6" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="h-10 bg-slate-200 rounded-xl" />
                      <div className="h-10 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {status === "error" && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center shadow-sm">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-red-100 text-red-500 mb-5">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Unable to load doctors</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">There was a problem fetching the doctor directory. Please check your connection and try again.</p>
                <button 
                  className="rounded-xl border border-red-200 bg-white px-6 py-2.5 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "ready" && filteredAndSortedDoctors.length > 0 && (
              <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
                {filteredAndSortedDoctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            )}

            {status === "ready" && filteredAndSortedDoctors.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 lg:p-16 text-center shadow-sm">
                <div className="mx-auto grid size-20 place-items-center rounded-full bg-slate-50 text-slate-400 mb-6 border border-slate-100 shadow-inner">
                  <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">No doctors match your criteria</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
                  We could not find any specialists matching your exact filters. Try adjusting your body area selection, specialty, or fee range.
                </p>
                <button 
                  onClick={handleClearFilters}
                  className="rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-700 transition-colors"
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
