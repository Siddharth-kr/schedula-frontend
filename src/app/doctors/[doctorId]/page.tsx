"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getDoctor } from "@/features/doctors/api/get-doctor";
import type { Doctor } from "@/types/doctor";
import type { AvailabilitySlot } from "@/types/availability";
import { getAvailableSlotsForDoctor } from "@/lib/availability-store";

export default function DoctorPortfolioPage() {
  const params = useParams();
  const doctorId = params.doctorId as string;
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!doctorId) return;
    
    // Fetch doctor
    getDoctor(doctorId)
      .then((doc) => {
        setDoctor(doc);
        
        // Fetch slots (must be client-side after mount due to localStorage)
        const now = new Date();
        const allSlots = getAvailableSlotsForDoctor(doc.id);
        const upcoming = allSlots.filter(s => {
          if (s.isBooked) return false;
          const slotDateTime = new Date(`${s.date}T${s.startTime}`);
          return slotDateTime > now;
        }).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());
        
        setSlots(upcoming);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [doctorId]);

  // Group slots by date for preview
  const groupedSlots = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const previewDates = Object.keys(groupedSlots).slice(0, 3); // Show up to 3 days

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(d);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/doctors" className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to doctors
          </Link>
        </div>

        {status === "loading" && (
          <div className="space-y-6" aria-busy="true">
            <div className="h-48 w-full animate-pulse rounded-2xl bg-white ring-1 ring-border" />
            <div className="h-64 w-full animate-pulse rounded-2xl bg-white ring-1 ring-border" />
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-border bg-white p-10 text-center shadow-sm" role="alert">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-background text-text-secondary mb-6 ring-1 ring-border">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-text-primary font-serif mb-2">Doctor not found</h2>
            <p className="text-text-secondary mb-6">The professional you are looking for does not exist or has been removed.</p>
            <Link href="/doctors" className="inline-flex justify-center items-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.98]">
              Browse all doctors
            </Link>
          </div>
        )}

        {status === "ready" && doctor && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            
            {/* Left Column: Doctor Info */}
            <div className="space-y-6">
              
              {/* Header Card */}
              <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark font-serif text-4xl font-bold text-white shadow-md ring-1 ring-white/20">
                    {doctor.name.replace("Dr. ", "").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <h1 className="text-3xl font-bold tracking-tight text-text-primary font-serif">{doctor.name}</h1>
                      <span className="inline-flex items-center justify-center gap-1 rounded-full bg-background px-3 py-1.5 text-sm font-bold text-text-secondary ring-1 ring-inset ring-border">
                        <svg className="size-4 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {doctor.rating} <span className="font-medium text-text-secondary/70 ml-1">({doctor.reviewCount} reviews)</span>
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-primary mb-3">{doctor.specialty}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm font-medium text-text-secondary">
                      <div className="flex items-center gap-2">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {doctor.experienceYears} years experience
                      </div>
                      {doctor.qualification && (
                        <div className="flex items-center gap-2">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
                          {doctor.qualification}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* About Card */}
              <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-xl font-bold text-text-primary font-serif mb-4">About</h2>
                <p className="text-text-secondary leading-relaxed text-base">
                  {doctor.bio || `${doctor.name} is a dedicated ${doctor.specialty.toLowerCase()} with ${doctor.experienceYears} years of medical experience. They are committed to providing personalized, comprehensive healthcare and staying current with the latest medical advancements to ensure optimal patient outcomes.`}
                </p>
                
                <hr className="my-8 border-border" />
                
                <h2 className="text-xl font-bold text-text-primary font-serif mb-6">Professional Information</h2>
                <dl className="grid sm:grid-cols-2 gap-y-6 gap-x-8 text-sm">
                  <div>
                    <dt className="font-semibold text-text-secondary mb-1 uppercase tracking-wider text-xs">Specialization</dt>
                    <dd className="font-medium text-text-primary text-base">{doctor.specialty}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text-secondary mb-1 uppercase tracking-wider text-xs">Experience</dt>
                    <dd className="font-medium text-text-primary text-base">{doctor.experienceYears} Years</dd>
                  </div>
                  {doctor.qualification && (
                    <div>
                      <dt className="font-semibold text-text-secondary mb-1 uppercase tracking-wider text-xs">Qualification</dt>
                      <dd className="font-medium text-text-primary text-base">{doctor.qualification}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-semibold text-text-secondary mb-1 uppercase tracking-wider text-xs">Consultation Fee</dt>
                    <dd className="font-medium text-text-primary text-base">${doctor.consultationFee}</dd>
                  </div>
                </dl>
              </div>

            </div>

            {/* Right Column: Booking & Availability */}
            <div className="space-y-6 lg:sticky lg:top-8">
              
              <div className="rounded-3xl border border-border bg-white p-5 sm:p-6 shadow-md">
                <div className="mb-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">Consultation</p>
                    <p className="text-3xl font-bold text-text-primary font-serif">${doctor.consultationFee}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                    <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Availability Preview
                  </h3>
                  
                  {previewDates.length > 0 ? (
                    <div className="space-y-4">
                      {previewDates.map(date => (
                        <div key={date}>
                          <p className="text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">{formatDate(date)}</p>
                          <div className="flex flex-wrap gap-2">
                            {groupedSlots[date].slice(0, 4).map(slot => (
                              <div key={slot.id} className="rounded-md border border-primary/30 bg-success/10/10 px-2.5 py-1 text-xs font-semibold text-primary-dark">
                                {slot.startTime}
                              </div>
                            ))}
                            {groupedSlots[date].length > 4 && (
                              <div className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-text-secondary">
                                +{groupedSlots[date].length - 4} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background p-4 text-center">
                      <p className="text-sm font-medium text-text-primary">No appointments available at the moment.</p>
                      <p className="text-xs text-text-secondary mt-1">Check back later for open slots.</p>
                    </div>
                  )}
                </div>

                <Link 
                  href={`/booking/${doctor.id}`}
                  className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-4 text-base font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Book Appointment
                </Link>
                <p className="mt-4 text-center text-xs font-medium text-text-secondary">
                  You won&apos;t be charged yet.
                </p>
              </div>

            </div>

          </div>
        )}
      </div>
    </main>
  );
}
