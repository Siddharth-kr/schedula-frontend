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
        setIsAvailableToday(true);
      } else {
        setIsAvailableToday(doctor.availableNextDays === 0);
      }
    } catch {
      setIsAvailableToday(doctor.availableNextDays === 0);
    }
  }, [doctor.id, doctor.availableNextDays]);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 w-full min-w-0 h-full">
      <div className="p-5 flex-1 flex flex-col min-w-0">
        
        {/* TOP ROW: Avatar + Basic Info */}
        <div className="flex gap-4 mb-4 min-w-0">
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative size-16 sm:size-20 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50">
              {doctor.imageUrl ? (
                <img src={doctor.imageUrl} alt={doctor.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-50 text-xl font-bold text-[#2563EB]">
                  {doctor.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Availability Badge */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 max-w-full ${isAvailableToday ? "bg-emerald-50 text-[#059669]" : "bg-slate-50 text-[#64748B]"}`}>
              <span className={`size-1.5 rounded-full shrink-0 ${isAvailableToday ? 'bg-[#059669]' : 'bg-slate-400'}`}></span>
              <span className="truncate">{isAvailableToday ? "Available Today" : "Limited Slots"}</span>
            </div>
            
            {/* Name */}
            <h3 className="text-[17px] sm:text-lg font-extrabold text-[#0F2747] leading-tight flex items-center gap-1.5 min-w-0" title={doctor.name}>
              <span className="truncate">{doctor.name}</span>
              {doctor.verificationStatus === 'approved' && (
                <svg className="size-4 text-[#2563EB] shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </h3>
            
            {/* Specialty */}
            <p className="text-[14px] font-bold text-[#2563EB] mt-0.5 truncate">{doctor.specialty}</p>
            
            {/* Rating */}
            <div className="mt-1 flex items-center gap-1 text-[13px] font-bold text-[#64748B] min-w-0">
              <span className="flex items-center text-amber-500 shrink-0">
                <svg className="size-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {doctor.rating}
              </span>
              <span className="text-slate-400 font-normal truncate shrink-0">({doctor.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* DETAILS ROW */}
        <div className="space-y-1.5 mb-5 min-w-0 pl-1">
          <div className="flex items-start gap-2.5 text-[13px] text-[#64748B] font-medium min-w-0">
            <svg className="size-4 shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span className="truncate">{doctor.experienceYears} years experience</span>
          </div>
          <div className="flex items-start gap-2.5 text-[13px] text-[#64748B] font-medium min-w-0">
            <svg className="size-4 shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="truncate" title={doctor.qualification || "Board Certified"}>{doctor.qualification || "Board Certified"}</span>
          </div>
          <div className="flex items-start gap-2.5 text-[13px] text-[#64748B] font-medium min-w-0">
            <svg className="size-4 shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <span className="truncate" title="City General Hospital">City General Hospital</span>
          </div>
        </div>

        {/* CONSULTATION INFO */}
        <div className="mt-auto border-t border-[#E2E8F0] pt-4 flex justify-between items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1.5 shrink-0 max-w-[50%] min-w-0">
            <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-50 text-[#2563EB] text-[11px] font-bold w-fit max-w-full truncate">In-Person</span>
          </div>
          
          <div className="flex flex-col items-end shrink-0 min-w-0 text-right w-[50%]">
            <span className="text-[18px] sm:text-xl font-black text-[#0F2747] truncate w-full">₹{doctor.consultationFee}</span>
            <span className="text-[11px] font-medium text-[#64748B] whitespace-normal leading-tight">per consultation</span>
          </div>
        </div>
      </div>

      {/* Buttons Footer */}
      <div className="p-5 pt-0 w-full min-w-0">
        <div className="grid grid-cols-2 gap-3 min-w-0 w-full">
          <Link 
            href={`/doctors/${doctor.id}`}
            className="flex items-center justify-center rounded-xl bg-white border border-[#E2E8F0] px-3 py-2.5 text-[13px] sm:text-[14px] font-bold text-[#0F2747] hover:text-[#2563EB] hover:bg-slate-50 transition-colors shadow-sm min-w-0 w-full text-center"
          >
            <span className="truncate w-full">View Profile</span>
          </Link>
          <Link 
            href={`/booking/${doctor.id}`}
            className="flex items-center justify-center rounded-xl bg-[#2563EB] px-3 py-2.5 text-[13px] sm:text-[14px] font-bold text-white hover:bg-[#1d4ed8] transition-colors shadow-sm min-w-0 w-full text-center"
          >
            <span className="truncate w-full">Book Appointment</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
