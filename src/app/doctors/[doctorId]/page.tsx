"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctor } from "@/features/doctors/api/get-doctor";
import { getAvailableSlotsForDoctor } from "@/lib/availability-store";
import type { Doctor } from "@/types/doctor";
import type { AvailabilitySlot } from "@/types/availability";
import { parseISO, format } from "date-fns";

export default function DoctorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId) return;
    
    getDoctor(doctorId)
      .then((doc) => {
        setDoctor(doc);
        const docSlots = getAvailableSlotsForDoctor(doctorId);
        setSlots(docSlots);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [doctorId]);

  // Group slots by date, filter out past
  const groupedSlots = useMemo(() => {
    const grouped: Record<string, AvailabilitySlot[]> = {};
    const today = new Date();
    today.setHours(0,0,0,0);
    
    slots.forEach(slot => {
      const slotDate = parseISO(slot.date);
      if (slotDate >= today && !slot.isBooked) {
        if (!grouped[slot.date]) grouped[slot.date] = [];
        grouped[slot.date].push(slot);
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    const sortedGrouped: Record<string, AvailabilitySlot[]> = {};
    sortedDates.forEach(date => {
      sortedGrouped[date] = grouped[date].sort((a, b) => {
        const getTime = (timeStr: string) => {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':').map(Number);
          let h24 = hours;
          if (period === 'PM' && hours !== 12) h24 += 12;
          if (period === 'AM' && hours === 12) h24 = 0;
          return h24 * 60 + minutes;
        };
        return getTime(a.startTime) - getTime(b.startTime);
      });
    });
    
    return sortedGrouped;
  }, [slots]);

  const previewDates = Object.keys(groupedSlots).slice(0, 5);

  useEffect(() => {
    if (previewDates.length > 0 && !selectedDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(previewDates[0]);
    }
  }, [previewDates, selectedDate]);

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEE, MMM d");
    } catch {
      return dateStr;
    }
  };

  const handleBookAppointment = () => {
    if (selectedDate && selectedSlotId) {
       sessionStorage.setItem("preselected_slot", JSON.stringify({ doctorId, date: selectedDate, slotId: selectedSlotId }));
    }
    router.push(`/booking/${doctorId}`);
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] pb-16 pt-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        <Link 
          href="/doctors" 
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-text-secondary shadow-sm hover:bg-stone-50 hover:text-text-primary transition-all mb-8"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Doctors
        </Link>

        {status === "loading" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8" aria-busy="true">
            <div className="space-y-6">
              <div className="h-64 w-full animate-pulse rounded-3xl bg-stone-200" />
              <div className="h-96 w-full animate-pulse rounded-3xl bg-stone-200" />
            </div>
            <div className="h-[600px] w-full animate-pulse rounded-3xl bg-stone-200" />
          </div>
        )}

        {status === "error" && (
          <div className="mx-auto rounded-3xl border border-red-100 bg-error/10 p-10 text-center max-w-2xl" role="alert">
            <p className="text-lg font-bold text-red-800">Doctor not found.</p>
          </div>
        )}

        {status === "ready" && doctor && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_440px]">
            {/* Left Column: Doctor Info */}
            <div className="space-y-8 min-w-0">
              
              {/* Hero Section */}
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <svg className="size-48 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
                  <div className="size-32 rounded-3xl bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl shadow-inner border border-primary/20 shrink-0">
                    {doctor.name.split(" ").map(n => n[0]).join("").substring(0,2)}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-bold text-text-primary font-serif mb-2">Dr. {doctor.name}</h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                      <p className="text-lg font-semibold text-primary">{doctor.specialty}</p>
                      <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                      <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <svg className="size-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {doctor.rating} <span className="font-medium text-amber-700/70 ml-0.5">({doctor.reviewCount} reviews)</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-8 gap-y-3 text-sm font-medium text-text-secondary">
                      <div className="flex items-center gap-2">
                        <svg className="size-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {doctor.experienceYears} years experience
                      </div>
                      {doctor.qualification && (
                        <div className="flex items-center gap-2">
                          <svg className="size-5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
                          {doctor.qualification}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* About Card */}
              <div className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm">
                <h2 className="text-xl font-bold text-text-primary font-serif mb-5">About Dr. {doctor.name.split(" ")[0]}</h2>
                <p className="text-text-secondary leading-relaxed text-base">
                  {doctor.bio || `${doctor.name} is a dedicated ${doctor.specialty.toLowerCase()} with ${doctor.experienceYears} years of medical experience. They are committed to providing personalized, comprehensive healthcare and staying current with the latest medical advancements to ensure optimal patient outcomes.`}
                </p>
                
                <hr className="my-10 border-border" />
                
                <h2 className="text-xl font-bold text-text-primary font-serif mb-6">Professional Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-10 text-sm">
                  <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                    <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Specialization</p>
                    <p className="font-bold text-text-primary text-base">{doctor.specialty}</p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                    <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Experience</p>
                    <p className="font-bold text-text-primary text-base">{doctor.experienceYears} Years</p>
                  </div>
                  {doctor.qualification && (
                    <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                      <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Qualification</p>
                      <p className="font-bold text-text-primary text-base">{doctor.qualification}</p>
                    </div>
                  )}
                  <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                    <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Consultation Type</p>
                    <p className="font-bold text-text-primary text-base">In-clinic / Video</p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                    <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Languages</p>
                    <p className="font-bold text-text-primary text-base">English, Hindi</p>
                  </div>
                  <div className="bg-stone-50 rounded-2xl p-5 border border-border">
                    <p className="font-bold text-text-secondary mb-1 uppercase tracking-wider text-[10px]">Consultation Fee</p>
                    <p className="font-bold text-text-primary text-base">${doctor.consultationFee}</p>
                  </div>
                </div>
              </div>
              
              {/* Trust Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                 <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-border shadow-sm">
                    <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                       <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h4 className="font-bold text-text-primary mb-1">Secure & Private</h4>
                    <p className="text-xs font-medium text-text-secondary">Your information is protected.</p>
                 </div>
                 <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-border shadow-sm">
                    <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                       <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 className="font-bold text-text-primary mb-1">Easy Rescheduling</h4>
                    <p className="text-xs font-medium text-text-secondary">Manage your appointment easily.</p>
                 </div>
                 <div className="flex flex-col items-center text-center p-6 bg-white rounded-3xl border border-border shadow-sm">
                    <div className="size-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                       <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h4 className="font-bold text-text-primary mb-1">24/7 Support</h4>
                    <p className="text-xs font-medium text-text-secondary">We&apos;re here when you need help.</p>
                 </div>
              </div>

            </div>

            {/* Right Column: Booking Panel */}
            <div className="lg:sticky lg:top-24 w-full z-10">
              <div className="rounded-3xl border border-border bg-white shadow-md overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-border bg-stone-50 flex items-center justify-between">
                   <div>
                     <h2 className="text-xl font-bold text-text-primary font-serif mb-1">Book Appointment</h2>
                     <p className="text-xs font-medium text-text-secondary">Select a convenient time slot</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">Consultation Fee</p>
                     <p className="text-2xl font-bold text-primary font-serif">${doctor.consultationFee}</p>
                   </div>
                </div>

                <div className="p-6 sm:p-8">
                  {previewDates.length > 0 ? (
                    <div className="space-y-6">
                      
                      {/* Date Tabs */}
                      <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 snap-x scrollbar-hide">
                         {previewDates.map(date => {
                           const isSelected = selectedDate === date;
                           return (
                             <button 
                               key={date}
                               onClick={() => { setSelectedDate(date); setSelectedSlotId(null); }}
                               className={`snap-start flex flex-col items-center justify-center min-w-[72px] px-3 py-3 rounded-2xl border transition-all ${
                                 isSelected ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-border text-text-primary hover:border-primary hover:text-primary hover:bg-primary/5'
                               }`}
                             >
                               <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>
                                 {format(parseISO(date), "EEE")}
                               </span>
                               <span className="text-lg font-bold leading-none">
                                 {format(parseISO(date), "d")}
                               </span>
                             </button>
                           );
                         })}
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-text-primary mb-4 flex items-center gap-2">
                             <svg className="size-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             Available times for {formatDate(selectedDate)}
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {groupedSlots[selectedDate].map(slot => {
                              const isSlotSelected = selectedSlotId === slot.id;
                              return (
                                <button 
                                  key={slot.id} 
                                  onClick={() => setSelectedSlotId(slot.id)}
                                  className={`px-2 py-3 rounded-xl border text-sm font-bold transition-all text-center ${
                                    isSlotSelected 
                                      ? 'bg-primary border-primary text-white ring-2 ring-primary ring-offset-1' 
                                      : 'bg-white border-border text-text-primary hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-sm'
                                  }`}
                                >
                                  {slot.startTime}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-stone-50 p-8 text-center">
                      <div className="size-12 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center mx-auto mb-4">
                        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-base font-bold text-text-primary">No appointments available.</p>
                      <p className="text-sm text-text-secondary mt-2">Check back later for open slots.</p>
                    </div>
                  )}

                  <div className="mt-8">
                    <button 
                      onClick={handleBookAppointment}
                      disabled={!selectedSlotId}
                      className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      Book Appointment
                    </button>
                    <p className="mt-4 text-center text-xs font-medium text-text-secondary">
                      You won&apos;t be charged yet.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
