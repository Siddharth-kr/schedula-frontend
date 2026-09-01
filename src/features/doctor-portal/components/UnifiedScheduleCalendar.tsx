"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  getDoctorSession, 
  getAllSlots, 
  addSlot, 
  addRule,
  deleteRule,
  markSlotUnavailable,
  freeSlot,
  getSlotsForDoctor
} from "@/lib/availability-store";
import type { DoctorProfile, AvailabilitySlot } from "@/types/availability";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { toast } from "react-toastify";

export function UnifiedScheduleCalendar() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [view, setView] = useState<"day" | "week">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [popover, setPopover] = useState<{
    x: number, y: number, dateStr: string, timeStr: string, slot?: AvailabilitySlot
  } | null>(null);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    setDoctor(session);
    setSlots(getSlotsForDoctor(session.id));
    setAppointments(getAppointmentsForDoctor(session.id));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_slots") {
        loadData();
      }
    };
    const handleCustomChange = () => loadData();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
    };
  }, [router]);

  // Compute days to show
  const daysToShow = view === "day" ? 1 : 7;
  const startDate = new Date(currentDate);
  if (view === "week") {
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start on Sunday
  } else {
    startDate.setHours(0,0,0,0);
  }

  const gridDates = Array.from({ length: daysToShow }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Time rows 08:00 to 18:00
  const timeRows = Array.from({ length: 20 }).map((_, i) => {
    const h = Math.floor(i / 2) + 8;
    const m = i % 2 === 0 ? "00" : "30";
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  const getSlotAt = (dateStr: string, timeStr: string) => {
    return slots.find(s => s.date === dateStr && s.startTime === timeStr);
  };

  const getAppointmentForSlot = (slot: AvailabilitySlot) => {
    return appointments.find(a => 
      a.startsAt.startsWith(slot.date) && 
      a.startsAt.includes(slot.startTime)
    );
  };

  const handleCellClick = (e: React.MouseEvent, dateStr: string, timeStr: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const existingSlot = getSlotAt(dateStr, timeStr);
    
    setPopover({
      x: rect.right + 10,
      y: rect.top,
      dateStr,
      timeStr,
      slot: existingSlot
    });
  };

  // Popover State
  const [createType, setCreateType] = useState<"once" | "recurring">("once");

  const handleCreate = () => {
    if (!doctor || !popover) return;
    try {
      const [h, m] = popover.timeStr.split(":").map(Number);
      const endM = m === 0 ? 30 : 0;
      const endH = m === 0 ? h : h + 1;
      const endStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      
      if (createType === "once") {
        addSlot(doctor.id, popover.dateStr, popover.timeStr, endStr);
        toast.success("Availability added successfully.");
      } else {
        const d = new Date(popover.dateStr);
        addRule(doctor.id, d.getDay(), popover.timeStr, endStr);
        toast.success("Recurring schedule created successfully.");
      }
      setPopover(null);
      loadData();
    } catch (e: any) {
      toast.error(e.message || "This time overlaps with an existing schedule.");
    }
  };

  const handleMarkUnavailable = () => {
    if (!popover || !popover.slot) return;
    if (popover.slot.isBooked) {
      toast.error("Cannot mark a booked slot as unavailable.");
      return;
    }
    markSlotUnavailable(popover.slot.id);
    toast.success("Time marked as unavailable.");
    setPopover(null);
    loadData();
  };
  
  const handleMakeAvailableAgain = () => {
    if (!popover || !popover.slot) return;
    freeSlot(popover.slot.id);
    toast.success("Availability updated successfully.");
    setPopover(null);
    loadData();
  };

  if (isLoading || !doctor) return <div className="p-8 text-center">Loading Schedule...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">Availability & Schedule</h1>
          <p className="text-[var(--muted)]">Manage your available hours and view appointments.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-semibold border border-[var(--line)] rounded-lg hover:bg-slate-50"
          >
            Today
          </button>
          <div className="flex rounded-lg border border-[var(--line)] p-1 bg-white">
            <button onClick={() => setView("day")} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === "day" ? "bg-slate-100 text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>Day</button>
            <button onClick={() => setView("week")} className={`px-4 py-1.5 text-sm font-semibold rounded-md ${view === "week" ? "bg-slate-100 text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}>Week</button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-[var(--line)]">
        <button 
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - daysToShow); setCurrentDate(d); }}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          &larr; Prev
        </button>
        <h2 className="text-xl font-bold font-serif">
          {gridDates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <button 
          onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + daysToShow); setCurrentDate(d); }}
          className="p-2 hover:bg-slate-100 rounded-full"
        >
          Next &rarr;
        </button>
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-[var(--line)] overflow-hidden flex relative">
        
        {/* Time Column */}
        <div className="w-20 shrink-0 border-r border-[var(--line)] bg-slate-50">
          <div className="h-12 border-b border-[var(--line)]"></div>
          {timeRows.map(time => (
            <div key={time} className="h-16 border-b border-[var(--line)] text-xs text-right pr-2 pt-2 text-[var(--muted)] font-medium">
              {time}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        {gridDates.map(date => {
          const dateStr = date.toISOString().split("T")[0];
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div key={dateStr} className="flex-1 min-w-[120px] border-r border-[var(--line)] last:border-r-0">
              <div className={`h-12 border-b border-[var(--line)] flex flex-col items-center justify-center ${isToday ? 'bg-[var(--brand)]/10' : ''}`}>
                <span className={`text-xs font-bold uppercase ${isToday ? 'text-[var(--brand)]' : 'text-[var(--muted)]'}`}>
                  {date.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                <span className={`text-lg font-bold ${isToday ? 'text-[var(--brand)]' : 'text-[var(--ink)]'}`}>
                  {date.getDate()}
                </span>
              </div>
              
              <div className="relative">
                {timeRows.map(time => {
                  const slot = getSlotAt(dateStr, time);
                  const apt = slot ? getAppointmentForSlot(slot) : undefined;
                  
                  let cellClass = "h-16 border-b border-[var(--line)] hover:bg-slate-50 cursor-pointer p-1 transition-colors relative group";
                  let content = null;
                  
                  if (slot) {
                    if (slot.isBooked && apt) {
                      cellClass += " bg-emerald-50 hover:bg-emerald-100";
                      content = (
                        <div className="h-full w-full rounded-md bg-emerald-100 border border-emerald-300 p-1 overflow-hidden shadow-sm">
                          <p className="text-xs font-bold text-emerald-800 truncate">{apt.patient.name}</p>
                          <p className="text-[10px] font-medium text-emerald-600 truncate capitalize">{apt.status}</p>
                        </div>
                      );
                    } else if (slot.isBooked && !apt) {
                       // Edge case fallback
                       cellClass += " bg-emerald-50 hover:bg-emerald-100";
                       content = <div className="h-full w-full rounded-md bg-emerald-100 border border-emerald-300 p-1"><p className="text-xs font-bold text-emerald-800">Booked</p></div>;
                    } else if (slot.isUnavailable) {
                      cellClass += " bg-slate-100";
                      content = (
                        <div className="h-full w-full flex items-center justify-center">
                          <span className="text-xs text-[var(--muted)] font-medium line-through">Unavailable</span>
                        </div>
                      );
                    } else {
                      cellClass += " bg-blue-50/50 hover:bg-blue-50";
                      content = (
                        <div className="h-full w-full rounded-md border border-blue-200 border-dashed bg-blue-50/50 flex items-center justify-center group-hover:border-blue-400">
                          <span className="text-xs font-bold text-blue-600">Available</span>
                        </div>
                      );
                    }
                  }

                  return (
                    <div 
                      key={time} 
                      className={cellClass}
                      onClick={(e) => handleCellClick(e, dateStr, time)}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Popover */}
      {popover && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopover(null)} />
          <div 
            className="fixed z-50 w-64 bg-white rounded-xl shadow-2xl border border-[var(--line)] p-4 animate-in fade-in zoom-in-95"
            style={{ 
              top: Math.min(popover.y, window.innerHeight - 200), 
              left: Math.min(popover.x, window.innerWidth - 270) 
            }}
          >
            <h3 className="font-bold text-sm text-[var(--ink)] mb-1">
              {new Date(popover.dateStr).toLocaleDateString()} at {popover.timeStr}
            </h3>
            
            {!popover.slot ? (
              <div className="space-y-3 mt-3">
                <p className="text-xs text-[var(--muted)]">Create new availability slot.</p>
                <div className="flex gap-2">
                  <button onClick={() => setCreateType("once")} className={`flex-1 py-1.5 text-xs font-bold rounded border ${createType === 'once' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-[var(--line)] text-[var(--muted)]'}`}>Once</button>
                  <button onClick={() => setCreateType("recurring")} className={`flex-1 py-1.5 text-xs font-bold rounded border ${createType === 'recurring' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-[var(--line)] text-[var(--muted)]'}`}>Weekly</button>
                </div>
                <button onClick={handleCreate} className="w-full py-2 bg-[var(--brand)] hover:bg-[var(--brand-deep)] text-white text-sm font-bold rounded-lg transition-colors">
                  Create Availability
                </button>
              </div>
            ) : popover.slot.isBooked ? (
              <div className="mt-2">
                <p className="text-xs text-emerald-600 font-medium">This slot is booked.</p>
                <button onClick={() => { setPopover(null); router.push(`/doctor/appointments/${popover.slot?.appointmentId}`); }} className="mt-2 w-full py-2 border border-[var(--line)] text-[var(--ink)] text-sm font-bold rounded-lg hover:bg-slate-50">
                  View Appointment Details
                </button>
              </div>
            ) : popover.slot.isUnavailable ? (
              <div className="mt-2">
                <p className="text-xs text-[var(--muted)]">This slot is marked unavailable.</p>
                <button onClick={handleMakeAvailableAgain} className="mt-2 w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-bold rounded-lg transition-colors">
                  Make Available
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-blue-600 font-medium mb-3">Slot is available for booking.</p>
                <button onClick={handleMarkUnavailable} className="w-full py-2 border border-[var(--line)] text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors">
                  Mark Unavailable
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
