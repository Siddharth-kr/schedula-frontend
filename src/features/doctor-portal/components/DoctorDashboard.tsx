"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isSameDay, parse, addMinutes } from "date-fns";
import { View } from "react-big-calendar";
import { getDoctorSession, getSlotsForDoctor, addSlot, deleteSlot, markSlotUnavailable } from "@/lib/availability-store";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { DoctorProfile, AvailabilitySlot } from "@/types/availability";
import type { Appointment } from "@/types/appointment";
import { DashboardCalendar, CalendarFilters as FilterType } from "./DashboardCalendar";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { toast } from "react-toastify";

export function DoctorDashboard() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<View>("week");
  const [filters, setFilters] = useState<FilterType>({
    appointments: true,
    available: true,
    unavailable: true,
    cancelled: true,
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  
  // Modals state
  const [addingSlot, setAddingSlot] = useState<{start: Date, end: Date} | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    setDoctor(session);
    setAppointments(getAppointmentsForDoctor(session.id));
    setSlots(getSlotsForDoctor(session.id));
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_slots") loadData();
    };
    const handleCustomChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);
    window.addEventListener("schedula_slots_updated", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
      window.removeEventListener("schedula_slots_updated", handleCustomChange);
    };
  }, [router]);

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "TODAY") {
      setDate(new Date());
      return;
    }
    const dir = action === "NEXT" ? 1 : -1;
    if (view === "day") setDate(prev => dir > 0 ? addDays(prev, 1) : subDays(prev, 1));
    else if (view === "week") setDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    else setDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const toolbarTitle = useMemo(() => {
    if (view === "day") return format(date, "EEEE, MMMM d, yyyy");
    if (view === "week") {
      // Very simple approximation for week text
      return format(date, "MMMM yyyy"); 
    }
    return format(date, "MMMM yyyy");
  }, [date, view]);

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSlot || !doctor) return;
    const dateStr = format(addingSlot.start, "yyyy-MM-dd");
    const startTime = format(addingSlot.start, "HH:mm");
    const endTime = format(addingSlot.end, "HH:mm");
    
    // basic collision check
    const collision = slots.find(s => s.date === dateStr && s.startTime === startTime);
    if (collision) {
      toast.error("A slot already exists here.");
      return;
    }
    
    addSlot(doctor.id, dateStr, startTime, endTime);
    toast.success("Availability created.");
    setAddingSlot(null);
    loadData();
  };

  const handleDeleteSlot = () => {
    if (!selectedSlot) return;
    deleteSlot(selectedSlot.id);
    toast.info("Slot removed.");
    setSelectedSlot(null);
    loadData();
  };
  
  const handleMakeUnavailable = () => {
    if (!selectedSlot) return;
    markSlotUnavailable(selectedSlot.id);
    toast.info("Slot marked unavailable.");
    setSelectedSlot(null);
    loadData();
  };

  if (!doctor) return null;

  // Stats calculation
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todaysApts = appointments.filter(a => a.startsAt.startsWith(todayStr));
  const todaysCompleted = todaysApts.filter(a => a.status === "completed").length;
  const todaysCancelled = todaysApts.filter(a => a.status === "cancelled").length;
  const todaysAvailable = slots.filter(s => s.date === todayStr && !s.isBooked && !s.isUnavailable).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-64 border-r border-[var(--line)] bg-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-[var(--line)]">
          <button 
            onClick={() => setAddingSlot({start: new Date(), end: addMinutes(new Date(), 30)})}
            className="w-full rounded-xl bg-white border border-[var(--line)] px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-sm hover:shadow hover:border-[var(--brand)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create
          </button>
        </div>
        <div className="p-4 pt-6 border-b border-[var(--line)]">
          <MiniCalendar date={date} onChange={setDate} />
        </div>
        <div className="p-4 pt-6">
          <CalendarFilters filters={filters} onChange={setFilters} />
        </div>
      </aside>

      {/* MAIN CALENDAR AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* CUSTOM TOOLBAR */}
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleNavigate("TODAY")}
              className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)] hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => handleNavigate("PREV")} className="p-1.5 rounded-full hover:bg-slate-100 text-[var(--ink)] transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => handleNavigate("NEXT")} className="p-1.5 rounded-full hover:bg-slate-100 text-[var(--ink)] transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <h2 className="text-xl font-medium text-[var(--ink)] ml-2">{toolbarTitle}</h2>
          </div>
          
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            {(["day", "week", "month"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${view === v ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </header>

        {/* CALENDAR */}
        <div className="flex-1 overflow-hidden relative">
          <DashboardCalendar 
            date={date} 
            view={view} 
            filters={filters}
            onNavigate={setDate}
            onView={setView}
            onSelectEmptySlot={(start, end) => setAddingSlot({start, end})}
            onSelectAvailableSlot={setSelectedSlot}
          />
        </div>

        <div className="flex items-center gap-6 px-6 py-4 bg-slate-50 border-t border-[var(--line)] text-xs font-semibold text-[var(--muted)] shrink-0">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[var(--brand)]"></span> Appointments</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-emerald-500"></span> Available Slots</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-slate-400"></span> Unavailable</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-red-500"></span> Cancelled / Missed</div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="w-80 border-l border-[var(--line)] bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-[var(--line)]">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-[var(--brand)] text-lg font-bold text-white shadow-sm">
              {doctor.name.replace("Dr. ", "").charAt(0)}
            </div>
            <div>
              <p className="font-bold text-[var(--ink)] text-sm">{doctor.name}</p>
              <p className="text-xs text-[var(--muted)]">{doctor.specialty}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-[var(--line)] space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Today&apos;s Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white border border-[var(--line)] p-3 shadow-sm">
              <p className="text-2xl font-bold text-[var(--ink)]">{todaysApts.length}</p>
              <p className="text-[10px] uppercase font-bold text-[var(--muted)] mt-1">Appointments</p>
            </div>
            <div className="rounded-xl bg-white border border-[var(--line)] p-3 shadow-sm">
              <p className="text-2xl font-bold text-[var(--brand)]">{todaysAvailable}</p>
              <p className="text-[10px] uppercase font-bold text-[var(--muted)] mt-1">Available</p>
            </div>
            <div className="rounded-xl bg-white border border-[var(--line)] p-3 shadow-sm">
              <p className="text-2xl font-bold text-[var(--ink)]">{todaysCompleted}</p>
              <p className="text-[10px] uppercase font-bold text-[var(--muted)] mt-1">Completed</p>
            </div>
            <div className="rounded-xl bg-white border border-[var(--line)] p-3 shadow-sm">
              <p className="text-2xl font-bold text-[var(--error)]">{todaysCancelled}</p>
              <p className="text-[10px] uppercase font-bold text-[var(--muted)] mt-1">Cancelled</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-[var(--line)] space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Upcoming Today</h3>
            <Link href="/doctor/appointments" className="text-xs font-bold text-[var(--brand)] hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {todaysApts.filter(a => a.status === "confirmed" || a.status === "pending").length === 0 ? (
              <p className="text-sm text-[var(--muted)] italic">No upcoming appointments today.</p>
            ) : (
              todaysApts
                .filter(a => a.status === "confirmed" || a.status === "pending")
                .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                .slice(0, 3)
                .map(apt => (
                  <Link key={apt.id} href={`/doctor/appointments/${apt.id}`} className="block rounded-xl bg-white border border-[var(--line)] p-3 shadow-sm hover:border-[var(--brand)] transition-colors">
                    <p className="font-bold text-[var(--ink)] text-sm">{apt.patient.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-medium text-[var(--brand)]">
                        {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(apt.startsAt))}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${apt.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {apt.status}
                      </span>
                    </div>
                  </Link>
                ))
            )}
          </div>
        </div>

      </aside>

      {/* Add Slot Modal */}
      {addingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-[var(--line)] px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-[var(--ink)]">Add Availability</h3>
              <button onClick={() => setAddingSlot(null)} className="text-[var(--muted)] hover:text-[var(--ink)]">&times;</button>
            </div>
            <form onSubmit={handleCreateSlot} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Date</label>
                <input type="text" readOnly value={format(addingSlot.start, "MMM d, yyyy")} className="w-full rounded-lg border border-[var(--line)] bg-slate-50 px-3 py-2 text-sm text-[var(--ink)] font-medium outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Start Time</label>
                  <input type="text" readOnly value={format(addingSlot.start, "HH:mm")} className="w-full rounded-lg border border-[var(--line)] bg-slate-50 px-3 py-2 text-sm text-[var(--ink)] font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">End Time</label>
                  <input type="text" readOnly value={format(addingSlot.end, "HH:mm")} className="w-full rounded-lg border border-[var(--line)] bg-slate-50 px-3 py-2 text-sm text-[var(--ink)] font-medium outline-none" />
                </div>
              </div>
              <p className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">This will create a one-time available slot.</p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAddingSlot(null)} className="flex-1 py-2 rounded-lg font-semibold text-sm border border-[var(--line)] text-[var(--ink)] hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg font-bold text-sm bg-[var(--brand)] text-white hover:bg-[var(--brand-deep)]">Save Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-[var(--line)] px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-[var(--ink)]">Available Slot</h3>
              <button onClick={() => setSelectedSlot(null)} className="text-[var(--muted)] hover:text-[var(--ink)]">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">{format(parse(selectedSlot.date, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}</p>
                  <p className="text-xs font-medium text-emerald-700">{selectedSlot.startTime} – {selectedSlot.endTime}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={handleMakeUnavailable} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                  Mark as Unavailable
                </button>
                <button onClick={handleDeleteSlot} className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  Delete Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
