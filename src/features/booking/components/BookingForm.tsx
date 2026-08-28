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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}

      {/* Date Selection */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-[var(--ink)]">1. Select a Date</h3>
        <Input 
          label="Appointment Date" 
          type="date" 
          min={todayStr}
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime(""); // Reset time when date changes
          }}
          required
        />
      </section>

      {/* Time Selection */}
      <section>
        <h3 className="mb-4 text-lg font-semibold text-[var(--ink)]">2. Select a Time</h3>
        {!date ? (
          <p className="text-sm text-[var(--muted)]">Please select a date first to see available times.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {TIME_SLOTS.map((slot) => {
              const isSelected = time === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                      : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
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
      <section>
        <h3 className="mb-4 text-lg font-semibold text-[var(--ink)]">3. Visit Details</h3>
        <Input 
          label="Reason for visit (optional)" 
          type="text" 
          placeholder="e.g. Annual checkup, Back pain..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </section>

      {/* Summary & Submit */}
      <div className="rounded-xl border border-[var(--line)] bg-stone-50 p-5 mt-4">
        <h3 className="mb-4 text-base font-semibold text-[var(--ink)]">Booking Summary</h3>
        <dl className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Doctor</dt>
            <dd className="font-medium text-[var(--ink)]">{doctor.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Specialty</dt>
            <dd className="font-medium text-[var(--ink)]">{doctor.specialty}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted)]">Date & Time</dt>
            <dd className="font-medium text-[var(--ink)]">
              {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : "—"} 
              {time ? `, ${time}` : ""}
            </dd>
          </div>
          <div className="flex justify-between border-t border-[var(--line)] pt-2 mt-2">
            <dt className="font-medium text-[var(--ink)]">Total Fee</dt>
            <dd className="font-bold text-[var(--ink)]">${doctor.consultationFee}</dd>
          </div>
        </dl>

        <Button type="submit" disabled={!canSubmit || isLoading} isLoading={isLoading}>
          Confirm Booking
        </Button>
      </div>
    </form>
  );
}
