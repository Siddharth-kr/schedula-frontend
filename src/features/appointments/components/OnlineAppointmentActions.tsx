"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Appointment } from "@/types/appointment";

export function OnlineAppointmentActions({ appointment }: { appointment: Appointment }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (appointment.status === "cancelled") return null;

  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(startsAt.getTime() + appointment.durationMinutes * 60000);
  const diffMs = startsAt.getTime() - now.getTime();
  const diffMins = diffMs / 60000;

  let liveStatus = "";
  if (now > endsAt) {
    liveStatus = "completed";
  } else if (now >= startsAt && now <= endsAt) {
    liveStatus = "live";
  } else if (diffMins > 0 && diffMins <= 15) {
    liveStatus = "starting_soon";
  } else {
    liveStatus = "upcoming";
  }

  // If the appointment status from backend is completed, respect that
  if (appointment.status === "completed") {
    liveStatus = "completed";
  }

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-end gap-2 mt-2 pt-3 border-t border-border sm:border-t-0 sm:pt-0">
      {liveStatus === "upcoming" && (
        <>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-0.5">Consultation starts in</p>
            <p className="text-sm font-bold font-mono text-primary">{formatCountdown(diffMs)}</p>
          </div>
          <button disabled className="mt-1 flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-400 px-3 py-1.5 rounded-lg cursor-not-allowed border border-slate-200">
            Join available soon
          </button>
        </>
      )}

      {liveStatus === "starting_soon" && (
        <>
          <div className="text-right">
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 mb-1">
               <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
               Starting Soon
             </span>
             <p className="text-sm font-bold font-mono text-amber-600">{formatCountdown(diffMs)}</p>
          </div>
          <Link href={`/appointments/${appointment.id}/video`}>
            <button className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm mt-1 animate-in fade-in zoom-in duration-300">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Join Consultation
            </button>
          </Link>
        </>
      )}

      {liveStatus === "live" && (
        <>
          <div className="text-right">
             <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-error/10 text-error border border-error/20 mb-1">
               <span className="size-1.5 rounded-full bg-error animate-pulse"></span>
               Live Now
             </span>
          </div>
          <Link href={`/appointments/${appointment.id}/video`}>
            <button className="flex items-center gap-1.5 text-xs font-bold bg-error text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-sm shadow-error/20 mt-1 animate-in fade-in zoom-in duration-300">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Join Consultation
            </button>
          </Link>
        </>
      )}
    </div>
  );
}
