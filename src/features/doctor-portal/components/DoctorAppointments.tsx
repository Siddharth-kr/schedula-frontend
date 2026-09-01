"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { Input } from "@/components/ui/Input";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";

type StatusFilter = "all" | "pending" | "confirmed" | "upcoming" | "completed" | "cancelled" | "missed";

export function DoctorAppointments() {
  const router = useRouter();
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    
    async function fetchAppointments(doc: DoctorProfile) {
      try {
        const myAppointments = getAppointmentsForDoctor(doc.id);
        
        // Sort by date descending
        myAppointments.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
        
        setDoctor(doc);
        setAppointments(myAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setErrorMsg("Failed to load appointments. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAppointments(session);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments") {
        fetchAppointments(session);
      }
    };
    const handleCustomChange = () => fetchAppointments(session);

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", handleCustomChange);
    };
  }, [router]);

  // Derived filtered list
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // 1. Status Filter
      if (statusFilter !== "all" && apt.status !== statusFilter) {
        return false;
      }
      
      // 2. Search Filter (Patient Name)
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        if (!apt.patient.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  if (isLoading || !doctor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--brand)]"></div>
          <p className="text-sm font-medium text-[var(--muted)]">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end border-b border-[var(--line)] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] font-serif">All Appointments</h1>
          <p className="mt-2 text-base text-[var(--muted)]">View and manage all your patient bookings.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-md bg-red-50 p-4 text-sm font-medium text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20">
          {errorMsg}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--line)] sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "pending", "confirmed", "upcoming", "completed", "cancelled", "missed"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-5 py-2.5 text-sm font-bold capitalize transition-all ${
                statusFilter === status
                  ? "bg-[var(--ink)] text-white shadow-sm"
                  : "bg-slate-50 text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--ink)]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            label=""
            type="text"
            placeholder="Search patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Appointments List */}
      <section className="rounded-3xl bg-white shadow-sm ring-1 ring-[var(--line)] overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-slate-50 text-[var(--muted)] ring-1 ring-inset ring-[var(--line)]">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-5 text-base font-bold text-[var(--ink)] font-serif">No appointments found</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filteredAppointments.map((apt) => {
              const dateObj = new Date(apt.startsAt);
              const displayDate = dateObj.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
              const displayTime = dateObj.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' });
              
              return (
                <div key={apt.id} className="flex flex-col p-5 hover:bg-slate-50/50 sm:flex-row sm:items-center justify-between gap-6 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="hidden sm:grid size-12 place-items-center rounded-2xl bg-[var(--brand)]/10 font-bold text-[var(--brand)] ring-1 ring-[var(--brand)]/20">
                      {apt.patient.initials}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--ink)]">{apt.patient.name}</h4>
                      <p className="mt-1 flex items-center gap-4 text-sm font-medium text-[var(--muted)]">
                        <span className="flex items-center gap-1.5">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {displayDate}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {displayTime}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-2.5">
                    <AppointmentStatusBadge status={apt.status} />
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-sm font-semibold text-[var(--muted)] max-w-[240px] truncate" title={apt.reason}>
                        {apt.reason || "General Consultation"}
                      </span>
                      <Link 
                        href={`/doctor/appointments/${apt.id}`}
                        className="text-sm font-bold text-[var(--brand)] hover:text-[var(--brand-deep)] hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
