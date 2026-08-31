"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Doctor } from "@/types/doctor";
import { createAppointment } from "@/features/appointments/api/create-appointment";
import { getAvailableSlotsForDoctor, markSlotBooked } from "@/lib/availability-store";
import type { AvailabilitySlot } from "@/types/availability";

type BookingFormProps = {
  doctor: Doctor;
};

export function BookingForm({ doctor }: BookingFormProps) {
  const router = useRouter();
  
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [date, setDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch available slots for this specific doctor
  useEffect(() => {
    Promise.resolve().then(() => {
      const slots = getAvailableSlotsForDoctor(doctor.id);
      setAvailableSlots(slots);
      setIsLoaded(true);
    });
  }, [doctor.id]);

  // 2. Derive unique available dates
  const availableDates = useMemo(() => {
    const dates = new Set(availableSlots.map(s => s.date));
    return Array.from(dates).sort();
  }, [availableSlots]);

  // Reset time slot if date changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setSelectedSlotId("");
    });
  }, [date]);

  // Auto-select first available date if none selected and dates exist
  useEffect(() => {
    if (isLoaded && availableDates.length > 0 && !date) {
      Promise.resolve().then(() => {
        setDate(availableDates[0]);
      });
    }
  }, [isLoaded, availableDates, date]);

  // Slots for currently selected date
  const slotsForDate = useMemo(() => {
    return availableSlots.filter(s => s.date === date);
  }, [availableSlots, date]);

  const selectedSlot = useMemo(() => {
    return availableSlots.find(s => s.id === selectedSlotId);
  }, [availableSlots, selectedSlotId]);

  const canSubmit = date && selectedSlotId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit || !selectedSlot) return;

    // Double-Booking Protection Check
    // We re-fetch fresh from store to ensure it wasn't booked by someone else in the meantime
    const latestSlots = getAvailableSlotsForDoctor(doctor.id);
    const stillAvailable = latestSlots.find(s => s.id === selectedSlot.id && !s.isBooked);
    
    if (!stillAvailable) {
      setError("This time slot is no longer available. Please select another slot.");
      // Refresh UI slots to remove the booked one
      setAvailableSlots(latestSlots);
      setSelectedSlotId("");
      return;
    }

    // Get patient name from mock auth if available, else fallback
    let patientName = "Guest Patient";
    try {
      const stored = localStorage.getItem("mock_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.name) patientName = user.name;
      }
    } catch {}

    const startsAt = `${selectedSlot.date}T${selectedSlot.startTime}:00`;

    setIsLoading(true);
    try {
      const appointment = await createAppointment({
        patient: { name: patientName },
        clinician: doctor.name,
        specialty: doctor.specialty,
        startsAt,
        reason: reason || "General Consultation",
      });
      
      // Mark the slot as booked in our frontend availability store
      markSlotBooked(selectedSlot.id, appointment.id);
      
      router.push(`/confirmation/${appointment.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to book appointment. Please try again.");
      }
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[var(--muted)] border-t-[var(--brand)]"></div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--line)] bg-slate-50/50 py-20 text-center shadow-sm">
        <div className="grid size-14 place-items-center rounded-full bg-slate-100 mb-5 text-[var(--muted)] ring-1 ring-inset ring-[var(--line)]">
          <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[var(--ink)] font-serif">No available appointments</h3>
        <p className="mt-2 text-sm text-[var(--muted)] max-w-sm">This doctor currently has no open availability. Please check back later.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20" role="alert">
          {error}
        </div>
      )}

      {/* Date Selection */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-[var(--ink)] font-serif">1. Select a Date</h3>
        <div className="flex flex-col gap-2 w-full">
          <label className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Available Dates</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-base font-medium shadow-sm outline-none transition-all focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
          >
            <option value="" disabled>Select a date...</option>
            {availableDates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Time Selection */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-[var(--ink)] font-serif">2. Select a Time</h3>
        {!date ? (
          <div className="rounded-2xl bg-slate-50/80 p-10 text-center ring-1 ring-inset ring-slate-200/50">
            <p className="text-sm font-semibold text-[var(--muted)]">Please select a date first to view available times.</p>
          </div>
        ) : slotsForDate.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/80 p-10 text-center ring-1 ring-inset ring-slate-200/50">
            <p className="text-sm font-semibold text-[var(--muted)]">No available times for this date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {slotsForDate.map((slot) => {
              const isSelected = selectedSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.id)}
                  className={`rounded-xl border px-4 py-3.5 text-base font-bold transition-all active:scale-[0.97] flex flex-col items-center justify-center gap-1 ${
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-md ring-2 ring-[var(--brand)]/20"
                      : "border-[var(--line)] bg-white text-[var(--ink)] shadow-sm hover:border-[var(--brand)] hover:text-[var(--brand)] hover:bg-slate-50"
                  }`}
                >
                  <span>{slot.startTime}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-emerald-100' : 'text-[var(--muted)]'}`}>to {slot.endTime}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Reason */}
      <section className="rounded-3xl border border-[var(--line)] bg-white p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-[var(--ink)] font-serif">3. Visit Details</h3>
        <Input 
          label="Reason for visit (optional)" 
          type="text" 
          placeholder="e.g. Annual checkup, Back pain..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </section>

      {/* Summary & Submit */}
      {selectedSlot && (
        <section className="mt-4 overflow-hidden rounded-3xl border border-[var(--brand)]/20 bg-white shadow-xl shadow-[var(--brand)]/5 transition-all animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-[var(--ink)] p-6 sm:px-8">
            <h3 className="text-lg font-bold text-white font-serif">Booking Summary</h3>
          </div>
          
          <div className="p-6 sm:p-8">
            <dl className="space-y-5 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Doctor</dt>
                <dd className="font-bold text-[var(--ink)] text-base text-right">{doctor.name}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Specialty</dt>
                <dd className="font-bold text-[var(--brand)] text-base text-right">{doctor.specialty}</dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Date</dt>
                <dd className="font-bold text-[var(--ink)] text-base text-right">
                  {new Date(selectedSlot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-[var(--muted)] font-semibold uppercase tracking-wider text-xs">Time</dt>
                <dd className="font-bold text-[var(--ink)] text-base text-right">
                  {selectedSlot.startTime} – {selectedSlot.endTime}
                </dd>
              </div>
              <div className="my-6 border-t border-dashed border-[var(--line)]"></div>
              <div className="flex justify-between items-center text-xl">
                <dt className="font-bold text-[var(--ink)] font-serif">Total Fee</dt>
                <dd className="font-bold text-[var(--brand)]">${doctor.consultationFee}</dd>
              </div>
            </dl>

            <div className="mt-8">
              <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-[var(--brand)]/20" disabled={!canSubmit || isLoading} isLoading={isLoading}>
                Confirm Booking
              </Button>
              <p className="mt-4 text-center text-xs font-semibold text-[var(--muted)]">
                You won&apos;t be charged until your appointment.
              </p>
            </div>
          </div>
        </section>
      )}
    </form>
  );
}
