"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getDoctorSession, 
  getSlotsForDoctor, 
  addSlot, 
  deleteSlot, 
  getRulesForDoctor, 
  addRule, 
  deleteRule 
} from "@/lib/availability-store";
import type { DoctorProfile, AvailabilitySlot, RecurringRule } from "@/types/availability";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function AvailabilityManager() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);

  // Form State: One-time Slot
  const [otDate, setOtDate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otEnd, setOtEnd] = useState("");
  const [otError, setOtError] = useState("");

  // Form State: Recurring Rule
  const [recDay, setRecDay] = useState("1"); // Default Monday
  const [recStart, setRecStart] = useState("");
  const [recEnd, setRecEnd] = useState("");
  const [recError, setRecError] = useState("");

  const refreshData = (doctorId: string) => {
    // getSlotsForDoctor gets ALL slots (including materialized recurring ones)
    const allSlots = getSlotsForDoctor(doctorId);
    // Sort logically
    allSlots.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    setSlots(allSlots);
    setRules(getRulesForDoctor(doctorId));
    setIsLoading(false);
  };

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    
    async function loadData(doc: DoctorProfile) {
      setDoctor(doc);
      refreshData(doc.id);
    }
    loadData(session);
  }, [router]);

  const handleAddOneTime = (e: React.FormEvent) => {
    e.preventDefault();
    setOtError("");

    if (!otDate || !otStart || !otEnd) {
      return setOtError("All fields are required.");
    }
    
    // Validate past dates
    const todayStr = new Date().toISOString().split("T")[0];
    if (otDate < todayStr) {
      return setOtError("Cannot create slots in the past.");
    }

    if (otEnd <= otStart) {
      return setOtError("End time must be after start time.");
    }

    try {
      addSlot(doctor!.id, otDate, otStart, otEnd);
      setOtDate("");
      setOtStart("");
      setOtEnd("");
      refreshData(doctor!.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setOtError(err.message);
      } else {
        setOtError("Failed to add slot.");
      }
    }
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    setRecError("");

    if (!recStart || !recEnd) {
      return setRecError("Start and End times are required.");
    }

    if (recEnd <= recStart) {
      return setRecError("End time must be after start time.");
    }

    try {
      addRule(doctor!.id, Number(recDay), recStart, recEnd);
      setRecStart("");
      setRecEnd("");
      refreshData(doctor!.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRecError(err.message);
      } else {
        setRecError("Failed to add recurring rule.");
      }
    }
  };

  const handleDeleteSlot = (id: string) => {
    if (confirm("Are you sure you want to delete this availability slot?")) {
      const success = deleteSlot(id);
      if (!success) {
        alert("Cannot delete a booked slot.");
      } else {
        refreshData(doctor!.id);
      }
    }
  };

  const handleDeleteRule = (id: string) => {
    if (confirm("Are you sure you want to delete this recurring rule? Existing slots will remain.")) {
      deleteRule(id);
      refreshData(doctor!.id);
    }
  };

  if (isLoading || !doctor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--brand)]"></div>
      </div>
    );
  }

  // Filter out past slots for display to keep it clean
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingSlots = slots.filter(s => s.date >= todayStr);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 lg:px-12 space-y-10">
      
      {/* Header */}
      <div className="border-b border-[var(--line)] pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] font-serif">Manage Availability</h1>
        <p className="mt-2.5 max-w-xl text-base text-[var(--muted)]">Configure your appointment slots and recurring schedules.</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left Column: Forms */}
        <div className="space-y-8 lg:col-span-5">
          
          {/* One-Time Slot Form */}
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-[var(--line)]">
            <h2 className="text-lg font-bold text-[var(--ink)] mb-6">One-Time Slot</h2>
            <form onSubmit={handleAddOneTime} className="space-y-5">
              {otError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20">
                  {otError}
                </div>
              )}
              <Input
                label="Date"
                type="date"
                min={todayStr}
                value={otDate}
                onChange={(e) => setOtDate(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={otStart}
                  onChange={(e) => setOtStart(e.target.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={otEnd}
                  onChange={(e) => setOtEnd(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-2">Add Slot</Button>
            </form>
          </section>

          {/* Recurring Rule Form */}
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-[var(--line)]">
            <h2 className="text-lg font-bold text-[var(--ink)] mb-6">Recurring Availability</h2>
            <form onSubmit={handleAddRecurring} className="space-y-5">
              {recError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20">
                  {recError}
                </div>
              )}
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-[var(--ink)]">Day of Week</label>
                <select
                  value={recDay}
                  onChange={(e) => setRecDay(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none transition-all focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
                >
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                  <option value="0">Sunday</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={recStart}
                  onChange={(e) => setRecStart(e.target.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={recEnd}
                  onChange={(e) => setRecEnd(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full mt-2">Create Rule</Button>
            </form>
          </section>

          {/* Active Rules List */}
          {rules.length > 0 && (
            <section className="rounded-2xl bg-slate-50 p-6 sm:p-8 ring-1 ring-[var(--line)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] mb-4">Active Rules</h2>
              <ul className="space-y-3">
                {rules.map(rule => (
                  <li key={rule.id} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[var(--line)] shadow-sm">
                    <span className="text-sm font-medium text-[var(--ink)]">{rule.label}</span>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-400 hover:text-[var(--error)] hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete rule"
                    >
                      <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </div>

        {/* Right Column: Existing Slots */}
        <div className="lg:col-span-7">
          <section className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-[var(--line)] min-h-[600px]">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-6 mb-6">
              <h2 className="text-xl font-bold text-[var(--ink)] font-serif">
                Upcoming Slots
              </h2>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-[var(--line)]">
                {upcomingSlots.length} Total
              </span>
            </div>

            {upcomingSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50/50 py-20 text-center ring-1 ring-inset ring-[var(--line)]">
                <div className="grid size-14 place-items-center rounded-full bg-slate-100 text-[var(--muted)] mb-5">
                  <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-[var(--ink)]">No availability added yet.</h3>
                <p className="mt-2 text-sm text-[var(--muted)] mb-6 max-w-sm">You have no upcoming slots in your schedule. Use the form to generate slots.</p>
                <Button onClick={() => (document.querySelector('input[type="date"]') as HTMLElement)?.focus()}>
                  Add Availability
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSlots.map(slot => {
                  const dateObj = new Date(slot.date);
                  const displayDate = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
                  
                  return (
                    <div 
                      key={slot.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border ${slot.isBooked ? 'bg-slate-50 border-[var(--line)]' : 'bg-white border-[var(--line)] hover:border-slate-300 shadow-sm transition-colors'}`}
                    >
                      <div className="flex items-center gap-4 sm:gap-5">
                        <div className={`hidden sm:grid size-12 place-items-center rounded-lg ${slot.isBooked ? 'bg-slate-200 text-slate-500' : 'bg-[var(--brand)]/10 text-[var(--brand)] ring-1 ring-[var(--brand)]/20'}`}>
                          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold ${slot.isBooked ? 'text-[var(--muted)]' : 'text-[var(--ink)]'} text-base`}>{displayDate}</p>
                          <p className={`text-sm mt-1 flex items-center gap-2 ${slot.isBooked ? 'text-slate-400' : 'text-[var(--muted)]'}`}>
                            {slot.startTime} – {slot.endTime}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ring-1 ring-inset ${
                          slot.isBooked ? 'bg-amber-50 text-amber-800 ring-amber-200' : 'bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/20'
                        }`}>
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </span>
                        
                        {!slot.isBooked ? (
                          <button 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 text-slate-400 hover:text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Slot"
                          >
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : (
                          // Placeholder spacing for booked slots to keep alignment
                          <div className="w-[36px] h-[36px]"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      
    </div>
  );
}
