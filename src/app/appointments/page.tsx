"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { getAppointmentsForPatient } from "@/lib/appointment-store";

type FilterStatus = "all" | AppointmentStatus;

export default function PatientAppointmentsPage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [patientName, setPatientName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mock_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === "patient") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPatientName(user.name);
          return;
        }
      }
      // Not logged in or not a patient
      router.push("/login");
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!patientName) return;

    try {
      setIsLoading(true);
      
      // Isolate patient's appointments
      const patientAppointments = getAppointmentsForPatient(patientName);
      
      // Sort by date descending
      patientAppointments.sort((a: Appointment, b: Appointment) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      
      setAppointments(patientAppointments);
      setError(null);
    } catch {
      setError("Unable to load appointments.");
    } finally {
      setIsLoading(false);
    }
  }, [patientName]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter((apt) => apt.status === filter);
  }, [appointments, filter]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(dateString));
  };

  const formatTime = (dateString: string, durationMin: number) => {
    const start = new Date(dateString);
    const end = new Date(start.getTime() + durationMin * 60000);
    
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
    
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  };

  if (!patientName) return null; // Prevent flash before redirect

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--canvas)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-4 border-b border-[var(--line)]">
          <div>
            <h1 className="text-3xl font-bold text-[var(--ink)] font-serif mb-2">My Appointments</h1>
            <p className="text-[var(--muted)]">View and manage your upcoming and previous appointments.</p>
          </div>
          <Link href="/doctors" className="shrink-0">
            <Button type="button">Book an Appointment</Button>
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl bg-red-50 p-6 flex flex-col items-center justify-center text-center border border-red-100">
            <p className="text-red-700 font-medium mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} type="button">Try Again</Button>
          </div>
        )}

        {/* Loading State */}
        {!error && isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-[var(--muted)] space-y-4">
            <svg className="animate-spin size-8 text-[var(--brand)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium">Loading your appointments...</p>
          </div>
        )}

        {/* Content */}
        {!error && !isLoading && (
          <>
            {appointments.length === 0 ? (
              // Empty State (No appointments ever booked)
              <div className="rounded-2xl bg-white border border-[var(--line)] p-8 text-center flex flex-col items-center shadow-sm">
                <div className="size-16 rounded-full bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center mb-6">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)] font-serif mb-2">No appointments yet</h3>
                <p className="text-[var(--muted)] mb-8 max-w-md">You haven&apos;t booked any appointments yet. Browse our directory of trusted healthcare professionals to get started.</p>
                <Link href="/doctors">
                  <Button type="button" className="px-8">Find a Doctor</Button>
                </Link>
              </div>
            ) : (
              // Appointments List
              <div className="space-y-4">
                
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                  {(["all", "upcoming", "completed", "cancelled", "missed"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                        filter === status 
                          ? "bg-[var(--ink)] text-white shadow-sm" 
                          : "bg-white border border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-[var(--muted)]">No appointments found for the selected filter.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredAppointments.map((apt) => (
                      <div key={apt.id} className="flex flex-col sm:flex-row justify-between p-6 bg-white rounded-2xl border border-[var(--line)] shadow-sm hover:shadow-md transition-shadow gap-6 group">
                        
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-lg font-bold text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors">
                            Dr. {apt.clinician}
                          </h3>
                          <p className="text-sm font-medium text-[var(--muted)] mb-3">
                            {apt.specialty}
                          </p>
                          
                          <div className="flex items-center gap-2 text-sm text-[var(--ink)]">
                            <svg className="size-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-medium">{formatDate(apt.startsAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                            <svg className="size-4 text-[var(--brand)]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{formatTime(apt.startsAt, apt.durationMinutes)}</span>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end sm:text-right gap-4 border-t border-[var(--line)] sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                          {apt.status === "confirmed" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--success)]/10 text-[var(--success)]">
                              Confirmed
                            </span>
                          )}
                          {apt.status === "pending" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                              Pending
                            </span>
                          )}
                          {apt.status === "cancelled" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--error)]/10 text-[var(--error)]">
                              Cancelled
                            </span>
                          )}
                          
                          <Link href={`/confirmation/${apt.id}`}>
                            <button className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-deep)] hover:underline transition-all">
                              View Details
                            </button>
                          </Link>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
