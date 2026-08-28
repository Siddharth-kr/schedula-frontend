"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Doctor } from "@/types/doctor";
import { createAppointment } from "@/features/appointments/api/create-appointment";

type BookingFormProps = {
  doctor: Doctor;
};

// Mock available times
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "11:00", "13:30", "14:00", "15:30", "16:00"
];

export function BookingForm({ doctor }: BookingFormProps) {
  const router = useRouter();
  
  // Date must be today or future.
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = date && time;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) return;

    // Get patient name from mock auth if available, else fallback
    let patientName = "Guest Patient";
    try {
      const stored = localStorage.getItem("mock_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.name) patientName = user.name;
      }
    } catch {}

    const startsAt = `${date}T${time}:00`;

    setIsLoading(true);
    try {
      const appointment = await createAppointment({
        patient: { name: patientName },
        clinician: doctor.name,
        specialty: doctor.specialty,
        startsAt,
        reason: reason || "General Consultation",
      });
      
      router.push(`/confirmation/${appointment.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to book appointment. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Date Selection */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-[var(--ink)]">1. Select a Date</h3>
        <Input 
          label="Appointment Date" 
          type="date" 
          min={todayStr}
          value={date}
          onChange={(e) => {
            const selectedDate = e.target.value;
            // Add subtle validation for past dates manually typed
            if (new Date(selectedDate) < new Date(todayStr)) {
              setDate("");
              return;
            }
            setDate(selectedDate);
            setTime(""); // Reset time when date changes
          }}
          required
        />
      </section>

      {/* Time Selection */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-[var(--ink)]">2. Select a Time</h3>
        {!date ? (
          <div className="rounded-xl bg-stone-50 p-8 text-center ring-1 ring-inset ring-stone-200/50">
            <p className="text-sm font-medium text-[var(--muted)]">Please select a date first to view available times.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const isSelected = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all active:scale-[0.97] ${
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-md ring-2 ring-[var(--brand)]/20"
                      : "border-[var(--line)] bg-white text-[var(--ink)] shadow-sm hover:border-[var(--brand)] hover:text-[var(--brand)]"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Reason */}
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-bold text-[var(--ink)]">3. Visit Details</h3>
        <Input 
          label="Reason for visit (optional)" 
          type="text" 
          placeholder="e.g. Annual checkup, Back pain..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </section>

      {/* Summary & Submit */}
      <section className="mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-md">
        <div className="bg-stone-50/80 p-6 border-b border-[var(--line)]">
          <h3 className="text-base font-bold tracking-tight text-[var(--ink)] uppercase">Booking Summary</h3>
        </div>
        
        <div className="p-6">
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-[var(--muted)] font-medium">Doctor</dt>
              <dd className="font-bold text-[var(--ink)] text-right">{doctor.name}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-[var(--muted)] font-medium">Specialty</dt>
              <dd className="font-semibold text-[var(--brand)] text-right">{doctor.specialty}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-[var(--muted)] font-medium">Date & Time</dt>
              <dd className="font-bold text-[var(--ink)] text-right">
                {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "—"} 
                {time ? `, ${time}` : ""}
              </dd>
            </div>
            <div className="my-4 border-t border-dashed border-[var(--line)]"></div>
            <div className="flex justify-between items-center text-lg">
              <dt className="font-bold text-[var(--ink)]">Total Fee</dt>
              <dd className="font-bold text-[var(--brand)]">${doctor.consultationFee}</dd>
            </div>
          </dl>

          <div className="mt-8">
            <Button type="submit" disabled={!canSubmit || isLoading} isLoading={isLoading}>
              Confirm Booking
            </Button>
            <p className="mt-3 text-center text-xs font-medium text-[var(--muted)]">
              You won&apos;t be charged until your appointment.
            </p>
          </div>
        </div>
      </section>
    </form>
  );
}
