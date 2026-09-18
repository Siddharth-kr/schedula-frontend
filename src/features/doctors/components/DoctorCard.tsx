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
  const [isAvailableToday, setIsAvailableToday] = useState<boolean>(false);

  useEffect(() => {
    try {
      const allSlots = getAvailableSlotsForDoctor(doctor.id);
      const bookedApts = getAppointmentsForDoctor(doctor.id);
      
      const today = new Date().toISOString().split("T")[0];
      
      const activeSlots = allSlots.filter((s: { date: string; startTime: string }) => {
        const isBooked = bookedApts.some((a: { startsAt: string; status: string }) => a.startsAt === `${s.date}T${s.startTime}:00` && a.status !== "cancelled");
        return !isBooked;
      });

      if (activeSlots.length > 0 && activeSlots[0].date === today) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAvailableToday(true);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAvailableToday(doctor.availableNextDays === 0);
      }
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAvailableToday(doctor.availableNextDays === 0);
    }
  }, [doctor.id, doctor.availableNextDays]);

  const initials = doctor.name.replace("Dr. ", "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-[20px] border border-border bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-primary/20 h-full">
      <div className="p-5 sm:p-6 pb-4">
        
        {/* Top Header Row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {doctor.imageUrl ? (
              <img src={doctor.imageUrl} alt={doctor.name} className="size-14 rounded-full object-cover border border-slate-100" />
            ) : (
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-blue-50/80 text-lg font-bold text-primary border border-blue-100/50">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-[1.1rem] font-extrabold text-slate-800 leading-tight flex items-center gap-2" title={doctor.name}>
                {doctor.name}
                {doctor.verificationStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider border border-emerald-200/50" title="Verified Doctor">
                    <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Verified
                  </span>
                )}
              </h3>
              <p className="text-[0.85rem] font-bold text-primary mt-0.5">{doctor.specialty}</p>
              <div className="mt-1 flex items-center gap-1.5 text-[0.75rem] font-bold text-slate-500">
                <span className="flex items-center text-amber-500">
                  <svg className="size-3.5 mr-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {doctor.rating}
                </span>
                <span className="text-slate-300">•</span>
                <span>{doctor.reviewCount} reviews</span>
              </div>
            </div>
          </div>

          {/* Availability Badge */}
          <div className="flex flex-col items-end gap-2">
            <button className="text-slate-300 hover:text-red-500 transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${isAvailableToday ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}>
              <span className={`size-1.5 rounded-full ${isAvailableToday ? 'bg-green-500' : 'bg-slate-400'}`}></span>
              {isAvailableToday ? "Available Today" : "Limited Slots"}
            </div>
          </div>
        </div>
        
        {/* Info Rows */}
        <div className="space-y-1.5 mb-3 px-1">
          <div className="flex items-center gap-2 text-[0.8rem] text-slate-500 font-medium">
            <svg className="size-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
            <span className="truncate">{doctor.qualification || "Board Certified"}</span>
          </div>
          <div className="flex items-center gap-2 text-[0.8rem] text-slate-500 font-medium">
            <svg className="size-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>{doctor.experienceYears} years experience</span>
          </div>
        </div>

        {/* Short Bio */}
        <p className="text-[0.85rem] text-slate-500 line-clamp-2 leading-relaxed px-1">
          {doctor.bio}
        </p>
      </div>

      <div className="mt-auto px-5 sm:px-6 pb-5 pt-2">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-extrabold text-slate-800">${doctor.consultationFee}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Per Consult</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Link 
            href={`/doctors/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-[0.8rem] font-bold text-slate-600 shadow-sm hover:border-primary hover:text-primary transition-colors"
          >
            View Profile
          </Link>
          <Link 
            href={`/booking/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-3 py-2.5 text-[0.8rem] font-bold text-white shadow-[0_2px_10px_rgba(59,130,246,0.3)] hover:bg-primary-dark hover:shadow-[0_4px_15px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-px"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </article>
  );
}
