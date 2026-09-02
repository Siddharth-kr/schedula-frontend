"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  getDoctorSession, 
  getSlotsForDoctor, 
  getRulesForDoctor,
  addRule, 
  deleteRule, 
  addSlot, 
  markSlotUnavailable,
  freeSlot
} from "@/lib/availability-store";
import type { DoctorProfile, AvailabilitySlot, RecurringRule } from "@/types/availability";
import { toast } from "react-toastify";
import { format, parse } from "date-fns";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityManager() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [type, setType] = useState<"recurring" | "one-time" | "unavailable">("recurring");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    setDoctor(session);
    setSlots(getSlotsForDoctor(session.id));
    setRules(getRulesForDoctor(session.id));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_slots" || e.key === "schedula_rules") loadData();
    };
    const handleCustomChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_slots_updated", handleCustomChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_slots_updated", handleCustomChange);
    };
  }, [router]);

  if (!doctor) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (type === "recurring") {
        if (selectedDays.length === 0) throw new Error("Please select at least one day.");
        selectedDays.forEach(day => {
          addRule(doctor.id, day, startTime, endTime);
        });
        toast.success("Recurring schedule created successfully.");
      } else if (type === "one-time") {
        if (!date) throw new Error("Date is required.");
        addSlot(doctor.id, date, startTime, endTime);
        toast.success("One-time availability created successfully.");
      } else if (type === "unavailable") {
        if (!date) throw new Error("Date is required.");
        const newSlot = addSlot(doctor.id, date, startTime, endTime);
        markSlotUnavailable(newSlot.id);
        toast.success("Time marked as unavailable.");
      }
      setIsCreating(false);
      setSelectedDays([]);
      setDate("");
      loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create schedule.");
    }
  };

  const handleDeleteRule = (id: string) => {
    deleteRule(id);
    toast.success("Recurring schedule removed.");
    loadData();
  };

  const handleDeleteSlot = (id: string) => {
    freeSlot(id);
    toast.success("Availability removed successfully.");
    loadData();
  };

  const formatTime = (time24: string) => {
    try {
      return format(parse(time24, "HH:mm", new Date()), "hh:mm a");
    } catch {
      return time24;
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const oneTimeSlots = slots.filter(s => !s.isUnavailable); // Note: generated slots from rules are also here in the DB.
  // To avoid showing rule-generated slots as "one-time" in this list, we can group them or just list them.
  // Actually, since rules materialize slots up to 14 days, listing them all is noisy. Let's list only the slots that were added manually. Wait, there's no flag for "rule-generated".
  // We can just list all slots grouped by date for "One-time" if they don't match a rule day. Or just list upcoming slots briefly.
  // For clarity, let's group all upcoming available slots by date, and show "Unavailable" slots below.
  
  const upcomingAvailable = slots.filter(s => !s.isUnavailable && !s.isBooked && s.date >= new Date().toISOString().split("T")[0]);
  const upcomingUnavailable = slots.filter(s => s.isUnavailable && s.date >= new Date().toISOString().split("T")[0]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-text-primary">Doctor Availability</h1>
          <p className="mt-2 text-sm text-text-secondary">Manage your recurring schedule and exceptions.</p>
        </div>
        <button onClick={() => setIsCreating(!isCreating)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark">
          {isCreating ? "Cancel" : "+ Create Availability"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-6 flex gap-4 border-b border-border pb-4">
            {(["recurring", "one-time", "unavailable"] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === t} onChange={() => setType(t)} className="text-primary focus:ring-primary" />
                <span className="text-sm font-medium capitalize">{t.replace("-", " ")}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {type === "recurring" ? (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-2">Select Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d, i) => (
                    <button 
                      type="button" 
                      key={i} 
                      onClick={() => toggleDay(i)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${selectedDays.includes(i) ? 'bg-primary border-primary text-white' : 'bg-white border-border text-text-secondary hover:border-primary hover:text-primary'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-background" />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Start Time</label>
              <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">End Time</label>
              <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none bg-background" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button type="submit" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              {type === 'unavailable' ? 'Mark Unavailable' : 'Create Schedule'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {/* Recurring Rules Section */}
        <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Recurring Schedule</h2>
          </div>
          <ul className="divide-y divide-border">
            {rules.length === 0 && <li className="p-6 text-sm text-text-secondary">No recurring schedules set.</li>}
            {rules.map(rule => (
              <li key={rule.id} className="flex items-center justify-between px-6 py-4 hover:bg-background transition-colors">
                <div>
                  <span className="font-bold text-text-primary w-24 inline-block">{DAYS[rule.dayOfWeek]}</span>
                  <span className="ml-4 text-sm font-medium text-text-secondary">{formatTime(rule.startTime)} - {formatTime(rule.endTime)}</span>
                </div>
                <button onClick={() => handleDeleteRule(rule.id)} className="text-sm font-bold text-error hover:underline">Remove</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Unavailable Section */}
        <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4">
            <h2 className="font-semibold text-text-primary">Unavailable / Time Off</h2>
          </div>
          <ul className="divide-y divide-border">
            {upcomingUnavailable.length === 0 && <li className="p-6 text-sm text-text-secondary">No upcoming time off set.</li>}
            {upcomingUnavailable.map(slot => (
              <li key={slot.id} className="flex items-center justify-between px-6 py-4 hover:bg-background transition-colors">
                <div>
                  <span className="font-bold text-text-primary w-28 inline-block">{format(parse(slot.date, "yyyy-MM-dd", new Date()), "dd MMM yyyy")}</span>
                  <span className="ml-4 text-sm font-medium text-text-secondary">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  <span className="ml-4 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-error">Unavailable</span>
                </div>
                <button onClick={() => handleDeleteSlot(slot.id)} className="text-sm font-bold text-text-primary hover:text-primary hover:underline">Restore</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Individual Availability Section */}
        <section className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4 flex justify-between items-center">
            <h2 className="font-semibold text-text-primary">Upcoming Available Slots</h2>
            <span className="text-xs text-text-secondary">{upcomingAvailable.length} slots found</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <ul className="divide-y divide-border">
              {upcomingAvailable.length === 0 && <li className="p-6 text-sm text-text-secondary">No upcoming availability.</li>}
              {upcomingAvailable.map(slot => (
                <li key={slot.id} className="flex items-center justify-between px-6 py-3 hover:bg-background transition-colors">
                  <div>
                    <span className="font-semibold text-text-primary text-sm w-28 inline-block">{format(parse(slot.date, "yyyy-MM-dd", new Date()), "dd MMM yyyy")}</span>
                    <span className="ml-4 text-sm font-medium text-text-secondary">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                  </div>
                  <button onClick={() => handleDeleteSlot(slot.id)} className="text-sm font-bold text-error hover:underline">Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
