"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, parse, addMinutes } from "date-fns";
import { View } from "react-big-calendar";
import { getDoctorSession, getSlotsForDoctor, addSlot, deleteSlot, markSlotUnavailable, addRule } from "@/lib/availability-store";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { DoctorProfile, AvailabilitySlot } from "@/types/availability";
import type { Appointment } from "@/types/appointment";
import { DashboardCalendar, CalendarFilters as FilterType } from "./DashboardCalendar";
import { MiniCalendar } from "./MiniCalendar";
import { CalendarFilters } from "./CalendarFilters";
import { toast } from "react-toastify";

export function AvailabilityManager() {
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
  const [type, setType] = useState<"one-time" | "recurring">("one-time");
  const [addDate, setAddDate] = useState("");
  const [addStartTime, setAddStartTime] = useState("");
  const [addEndTime, setAddEndTime] = useState("");
  const [addDayOfWeek, setAddDayOfWeek] = useState(1);
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
    if (!doctor) return;
    
    if (type === "one-time") {
        addSlot(doctor.id, addDate, addStartTime, addEndTime);
        toast.success("Availability created.");
    } else {
        addRule(doctor.id, addDayOfWeek, addStartTime, addEndTime);
        toast.success("Recurring availability rule created.");
    }
    setAddDate("");
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
      <aside className="w-64 border-r border-border bg-white flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => { setAddDate(format(new Date(), 'yyyy-MM-dd')); setAddStartTime(format(new Date(), 'HH:mm')); setAddEndTime(format(addMinutes(new Date(), 30), 'HH:mm')); setType('one-time'); }}
            className="w-full rounded-xl bg-white border border-border px-4 py-3 text-sm font-bold text-text-primary shadow-sm hover:shadow hover:border-primary transition-all flex items-center justify-center gap-2"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create
          </button>
        </div>
        <div className="p-4 pt-6 border-b border-border">
          <MiniCalendar date={date} onChange={setDate} />
        </div>
        <div className="p-4 pt-6">
          <CalendarFilters filters={filters} onChange={setFilters} />
        </div>
      </aside>

      {/* MAIN CALENDAR AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* CUSTOM TOOLBAR */}
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleNavigate("TODAY")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => handleNavigate("PREV")} className="p-1.5 rounded-full hover:bg-background text-text-primary transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => handleNavigate("NEXT")} className="p-1.5 rounded-full hover:bg-background text-text-primary transition-colors">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <h2 className="text-xl font-medium text-text-primary ml-2">{toolbarTitle}</h2>
          </div>
          
          <div className="flex items-center rounded-lg bg-background p-1">
            {(["day", "week", "month"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${view === v ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
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
            onSelectEmptySlot={(start, end) => { setAddDate(format(start, 'yyyy-MM-dd')); setAddStartTime(format(start, 'HH:mm')); setAddEndTime(format(end, 'HH:mm')); setType('one-time'); }}
            onSelectAvailableSlot={setSelectedSlot}
          />
        </div>

        <div className="flex items-center gap-6 px-6 py-4 bg-background border-t border-border text-xs font-semibold text-text-secondary shrink-0">
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary"></span> Appointments</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-success"></span> Available Slots</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-text-secondary"></span> Unavailable</div>
          <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-error"></span> Cancelled / Missed</div>
        </div>
      </main>

      {/* Add Slot Modal */}
      {addDate !== "" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-background border-b border-border px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-text-primary">Create Availability</h3>
              <button onClick={() => setAddDate("")} className="text-text-secondary hover:text-text-primary">&times;</button>
            </div>
            <form onSubmit={handleCreateSlot} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-text-primary"><input type="radio" checked={type === "one-time"} onChange={() => setType("one-time")} /> One-time</label>
                  <label className="flex items-center gap-2 text-sm text-text-primary"><input type="radio" checked={type === "recurring"} onChange={() => setType("recurring")} /> Recurring</label>
                </div>
              </div>
              
              {type === "one-time" ? (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
                    <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-medium outline-none" required />
                  </div>
              ) : (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Day of Week</label>
                    <select value={addDayOfWeek} onChange={(e) => setAddDayOfWeek(Number(e.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-medium outline-none" required>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Start Time</label>
                  <input type="time" value={addStartTime} onChange={(e) => setAddStartTime(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-medium outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">End Time</label>
                  <input type="time" value={addEndTime} onChange={(e) => setAddEndTime(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary font-medium outline-none" required />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAddDate("")} className="flex-1 py-2 rounded-lg font-semibold text-sm border border-border text-text-primary hover:bg-background">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg font-bold text-sm bg-primary text-white hover:bg-primary-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Slot Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-background border-b border-border px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-text-primary">Edit Availability</h3>
              <button onClick={() => setSelectedSlot(null)} className="text-text-secondary hover:text-text-primary">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-success/10 rounded-lg p-3 border border-emerald-100 flex items-center gap-3">
                <div className="size-2 rounded-full bg-success"></div>
                <div>
                  <p className="text-sm font-bold text-success">{format(parse(selectedSlot.date, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}</p>
                  <p className="text-xs font-medium text-success">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => setSelectedSlot(null)} className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors">
                  Save
                </button>
                <button onClick={handleMakeUnavailable} className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-text-primary hover:bg-background border border-border transition-colors">
                  Mark as Unavailable
                </button>
                <button onClick={handleDeleteSlot} className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-medium text-error hover:bg-error/10 border border-transparent transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
