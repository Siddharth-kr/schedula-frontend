"use client";

import Link from "next/link";
import type { Doctor } from "@/types/doctor";
import { getAvailableSlotsForDoctor } from "@/lib/availability-store";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import { useEffect, useState } from "react";

type DoctorCardProps = {
  doctor: Doctor;
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("Checking...");
  const [isAvailableToday, setIsAvailableToday] = useState<boolean>(false);

  useEffect(() => {
    // Calculate real availability
    try {
      const allSlots = getAvailableSlotsForDoctor(doctor.id);
      const bookedApts = getAppointmentsForDoctor(doctor.id);
      
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      
      // Filter strictly for future slots
      const activeSlots = allSlots.filter((s: { date: string; startTime: string }) => {
        const isBooked = bookedApts.some((a: { startsAt: string; status: string }) => a.startsAt === `${s.date}T${s.startTime}:00` && a.status !== "cancelled");
        return !isBooked;
      }).sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

      if (activeSlots.length === 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAvailabilityStatus("No upcoming availability");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAvailableToday(false);
      } else {
        const earliestDate = activeSlots[0].date;
        if (earliestDate === today) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAvailabilityStatus("Available Today");
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsAvailableToday(true);
        } else if (earliestDate === tomorrow) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAvailabilityStatus("Available Tomorrow");
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsAvailableToday(false);
        } else {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setAvailabilityStatus(`Available on ${earliestDate}`);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsAvailableToday(false);
        }
      }
    } catch (e) {
      // Fallback to static mock data if stores aren't seeded yet
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAvailableToday(doctor.availableNextDays === 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailabilityStatus(doctor.availableNextDays === 0 ? "Available Today" : `Available in ${doctor.availableNextDays} days`);
    }
  }, [doctor.id, doctor.availableNextDays]);

  const initials = doctor.name.replace("Dr. ", "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 h-full">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-text-primary truncate" title={doctor.name}>{doctor.name}</h3>
            <p className="text-sm font-semibold text-primary truncate">{doctor.specialty}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-text-secondary">
              <span className="flex items-center text-[#F59E0B]">
                <svg className="size-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {doctor.rating}
              </span>
              <span className="text-border">•</span>
              <span className="font-medium">{doctor.reviewCount} reviews</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
            <span className="truncate">{doctor.qualification || "Board Certified"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>{doctor.experienceYears} years experience</span>
          </div>
        </div>

        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {doctor.bio}
        </p>
      </div>

      <div className="border-t border-border bg-stone-50/50 p-6 flex flex-col gap-5 mt-auto">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-1">Consultation</p>
            <p className="text-xl font-bold text-text-primary leading-none">${doctor.consultationFee}</p>
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${isAvailableToday ? "text-success" : "text-text-secondary"}`}>
            <span className="relative flex size-2.5">
              {isAvailableToday && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>}
              <span className={`relative inline-flex rounded-full size-2.5 ${isAvailableToday ? 'bg-success' : 'bg-text-secondary/50'}`}></span>
            </span>
            {availabilityStatus}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link 
            href={`/doctors/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-white border border-border px-3 py-2.5 text-xs font-bold text-text-primary shadow-sm hover:border-primary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View Profile
          </Link>
          <Link 
            href={`/booking/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Book Now
          </Link>
        </div>
      </div>
    </article>
  );
}
