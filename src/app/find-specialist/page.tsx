"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { InteractiveBodyMap, BodyView } from "@/components/body-map/InteractiveBodyMap";
import { bodyRegionSpecialties } from "@/lib/body-map-data";
import { useDoctors } from "@/features/doctors/hooks/use-doctors";
import { DoctorCard } from "@/features/doctors/components/DoctorCard";

export default function FindSpecialistPage() {
  const { data: doctors, status } = useDoctors();
  const [view, setView] = useState<BodyView>("front");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const handleSelectRegion = (regionId: string, _view: BodyView) => {
    setSelectedRegionId(regionId);
    setSelectedSpecialty(null); 
  };

  const handleClearSelection = () => {
    setSelectedRegionId(null);
    setSelectedSpecialty(null);
  };

  const currentRegion = selectedRegionId ? bodyRegionSpecialties[selectedRegionId] : null;

  const filteredDoctors = useMemo(() => {
    if (!currentRegion) return [];
    if (selectedSpecialty) {
      return doctors.filter(doc => doc.specialty === selectedSpecialty);
    }
    return doctors.filter(doc => currentRegion.specialties.includes(doc.specialty));
  }, [doctors, currentRegion, selectedSpecialty]);

  const quickNavRegions = [
    { id: "head", label: "Head & Neck" },
    { id: "chest", label: "Chest" },
    { id: "abdomen", label: "Abdomen" },
    { id: "pelvis", label: "Pelvis" },
    { id: "left_arm", label: "Left Arm" },
    { id: "right_arm", label: "Right Arm" },
    { id: "left_hand", label: "Left Hand" },
    { id: "right_hand", label: "Right Hand" },
    { id: "left_thigh", label: "Left Leg" },
    { id: "right_thigh", label: "Right Leg" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 w-full font-sans">
      
      {/* Top Header Section */}
      <div className="bg-white border-b border-border w-full">
        <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-[2.5rem] leading-tight font-extrabold text-slate-800 tracking-tight">Find the Right Specialist</h1>
            <p className="text-slate-500 mt-2 text-base md:text-[1.1rem] max-w-2xl mb-4">
              Select a body area to discover relevant specialists.
            </p>
            <div className="inline-flex items-center gap-2 bg-[#EFF6FF] text-[#1E3A8A] px-3 py-1.5 rounded-lg border border-[#BFDBFE]">
              <svg className="size-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-[11px] font-bold tracking-wide uppercase">
                Does not provide medical diagnosis
              </p>
            </div>
          </div>

          {/* Compact How-It-Works */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm shadow-sm border border-slate-200">1</div>
              <p className="text-sm font-bold text-slate-600">Select area</p>
            </div>
            <div className="w-10 h-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm shadow-sm border border-slate-200">2</div>
              <p className="text-sm font-bold text-slate-600">Choose specialty</p>
            </div>
            <div className="w-10 h-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-white text-primary font-bold flex items-center justify-center text-sm shadow-sm border border-slate-200">3</div>
              <p className="text-sm font-bold text-slate-600">Find a doctor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-6 lg:px-10 py-8 md:py-10">
        
        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(380px,0.85fr)_minmax(700px,1.5fr)] gap-8 xl:gap-10">
          
          {/* LEFT: Body Map Panel */}
          <div className="bg-white rounded-[24px] border border-border shadow-sm flex flex-col overflow-hidden h-[900px] lg:h-[850px]">
            {/* Map Header */}
            <div className="p-5 md:p-6 pb-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-primary">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Interactive Body Map</h2>
                </div>
              </div>
              
              <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button
                  onClick={() => setView("front")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    view === "front" 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setView("back")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    view === "back" 
                      ? "bg-white text-primary shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* SVG Area */}
            <div className="flex-1 bg-gradient-to-b from-slate-50/50 to-white relative p-4 flex flex-col items-center justify-center min-h-0">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <InteractiveBodyMap 
                  onSelectRegion={handleSelectRegion}
                  selectedRegionId={selectedRegionId}
                  view={view}
                />
              </div>
              
              {/* Subtle Map Instruction */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 z-10 pointer-events-none">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                Hover to preview <span className="mx-1">•</span> Click to select
              </div>
            </div>

            {/* Compact Body Areas Pill Grid */}
            <div className="p-5 border-t border-slate-100 bg-white">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">Body Areas</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2">
                {quickNavRegions.map(region => (
                  <button
                    key={region.id}
                    onClick={() => {
                      setView("front");
                      handleSelectRegion(region.id, "front");
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold text-center border transition-colors ${
                      selectedRegionId === region.id
                        ? "bg-[#EFF6FF] border-[#BFDBFE] text-primary"
                        : "bg-white border-slate-200 text-slate-600 hover:border-primary/40 hover:bg-slate-50"
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Results & Info */}
          <div className="flex flex-col space-y-6 lg:space-y-8 min-w-0">
            
            {/* Selected Area Card */}
            <div className="bg-white rounded-[24px] border border-border p-6 shadow-sm flex flex-col relative overflow-hidden">
              {currentRegion ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-0.5">Selected Area</p>
                        <h2 className="text-2xl font-extrabold text-slate-800 leading-none">{currentRegion.label}</h2>
                      </div>
                    </div>
                    <button 
                      onClick={handleClearSelection}
                      className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      Clear
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 mb-3 font-medium">
                      Specialists commonly associated with this area:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentRegion.specialties.map(specialty => {
                        const isSelected = selectedSpecialty === specialty;
                        return (
                          <button
                            key={specialty}
                            onClick={() => setSelectedSpecialty(isSelected ? null : specialty)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-[0_2px_8px_rgba(59,130,246,0.25)]"
                                : "bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:bg-blue-50/30"
                            }`}
                          >
                            {specialty}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center opacity-70">
                  <svg className="size-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <p className="text-lg font-extrabold text-slate-600 mb-1">No body area selected</p>
                  <p className="text-sm text-slate-500">Click on a region on the interactive body map.</p>
                </div>
              )}
            </div>

            {/* Recommended Doctors Section */}
            {selectedRegionId && (
              <div className="flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Recommended Doctors
                    </h3>
                    <p className="text-[13px] text-slate-500 font-medium mt-1">Doctors specializing in {currentRegion?.label.toLowerCase()}-related care</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Sort by</span>
                      <select className="border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:border-primary">
                        <option>Relevance</option>
                        <option>Highest Rated</option>
                        <option>Availability</option>
                      </select>
                    </div>
                    {/* Compact Grid/List Mock Toggle */}
                    <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                      <button className="p-1.5 bg-white text-primary rounded shadow-sm"><svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded"><svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                    </div>
                  </div>
                </div>

                {status === "loading" ? (
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-[340px] animate-pulse rounded-[20px] bg-white border border-border shadow-sm p-6" />
                    ))}
                  </div>
                ) : filteredDoctors.length > 0 ? (
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
                    {filteredDoctors.map((doctor) => (
                      <div key={doctor.id} className="h-full">
                        <DoctorCard doctor={doctor} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-[20px] border border-border p-12 text-center shadow-sm flex flex-col items-center justify-center mt-2">
                    <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                      <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 mb-2">No matching specialists</p>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                      Try selecting another body area, or explore our full directory.
                    </p>
                    <Link 
                      href="/doctors"
                      className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-[0_2px_10px_rgba(59,130,246,0.3)] hover:-translate-y-px"
                    >
                      Browse All Doctors
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Global Fallback when nothing is selected */}
        {!selectedRegionId && (
          <div className="bg-white/80 backdrop-blur rounded-[24px] border border-border p-12 text-center shadow-sm max-w-3xl mx-auto flex flex-col items-center justify-center mt-12">
            <svg className="size-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Prefer searching by specialty?</h3>
            <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
              If you already know what kind of specialist you need, you can browse our full directory directly.
            </p>
            <Link 
              href="/doctors"
              className="px-6 py-3 bg-white text-primary border border-slate-200 rounded-xl text-sm font-bold hover:border-primary hover:shadow-sm transition-all"
            >
              Browse All Specialties →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
