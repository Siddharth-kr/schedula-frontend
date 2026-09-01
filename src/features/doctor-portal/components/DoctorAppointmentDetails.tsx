"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { getAppointmentById, updateAppointmentStatus, addPrescription } from "@/lib/appointment-store";
import type { Appointment } from "@/types/appointment";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";
import { toast } from "react-toastify";

export function DoctorAppointmentDetails() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState("");
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    setDoctor(session);
    
    if (appointmentId) {
      const apt = getAppointmentById(appointmentId);
      if (apt && apt.clinician === session.name) {
        setAppointment(apt);
      }
    }
    setIsLoading(false);
  }, [appointmentId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--brand)]"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--error)]">Appointment not found</h1>
        <Link href="/doctor/appointments" className="mt-4 inline-block text-[var(--brand)] hover:underline">
          &larr; Back to Appointments
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: Appointment["status"]) => {
    updateAppointmentStatus(appointment.id, newStatus);
    setAppointment({ ...appointment, status: newStatus });
    
    // Add toasts based on status
    if (newStatus === "confirmed") toast.success("Appointment confirmed.");
    else if (newStatus === "cancelled") toast.success("Appointment cancelled.");
    else if (newStatus === "completed") toast.success("Appointment marked as completed.");
    else if (newStatus === "missed") toast.warning("Appointment marked as missed.");
  };

  const handleCompleteWithPrescription = () => {
    addPrescription(appointment.id, { diagnosis, medicines, instructions });
    updateAppointmentStatus(appointment.id, "completed");
    setAppointment({
      ...appointment,
      status: "completed",
      prescription: { diagnosis, medicines, instructions }
    });
    setIsPrescribing(false);
    toast.success("Prescription saved successfully.");
  };

  const isPast = new Date(appointment.startsAt).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/doctor/appointments" className="text-sm font-bold text-[var(--brand)] hover:underline">
          &larr; Back to Appointments
        </Link>
      </div>
      
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-slate-50/50 px-6 py-5 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--ink)] font-serif">Appointment Details</h1>
            <p className="text-sm text-[var(--muted)] mt-1">ID: {appointment.id}</p>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        
        <div className="px-6 py-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Patient Name</dt>
              <dd className="text-base font-bold text-[var(--ink)] mt-1">{appointment.patient.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Date & Time</dt>
              <dd className="text-base font-medium text-[var(--ink)] mt-1">
                {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}<br/>
                {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
              </dd>
            </div>
          </dl>
          
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Reason for Visit</dt>
              <dd className="text-base font-medium text-[var(--ink)] mt-1">{appointment.reason || "General Consultation"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Room</dt>
              <dd className="text-base font-medium text-[var(--ink)] mt-1">{appointment.room || "TBD"}</dd>
            </div>
          </dl>
        </div>
        
        {appointment.prescription && (
          <div className="px-6 py-6 sm:px-8 border-t border-[var(--line)] bg-[var(--brand)]/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--brand)] mb-4">Prescription</h3>
            <div className="space-y-3">
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Diagnosis</dt>
                <dd className="text-sm font-medium text-[var(--ink)]">{appointment.prescription.diagnosis}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Medicines</dt>
                <dd className="text-sm font-medium text-[var(--ink)]">{appointment.prescription.medicines}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Instructions</dt>
                <dd className="text-sm font-medium text-[var(--ink)]">{appointment.prescription.instructions}</dd>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-50 px-6 py-6 sm:px-8 border-t border-[var(--line)] flex flex-wrap gap-3 items-center">
          {appointment.status === "pending" && (
            <>
              <button onClick={() => handleStatusChange("confirmed")} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors shadow-sm">
                Confirm Appointment
              </button>
              <button onClick={() => handleStatusChange("cancelled")} className="rounded-xl bg-white border border-[var(--line)] px-5 py-2.5 text-sm font-bold text-[var(--error)] hover:bg-red-50 transition-colors shadow-sm">
                Decline
              </button>
            </>
          )}

          {(appointment.status === "confirmed" || appointment.status === "upcoming") && (
            <>
              {isPast ? (
                <>
                  {!isPrescribing ? (
                    <button onClick={() => setIsPrescribing(true)} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors shadow-sm">
                      Mark as Completed (Add Prescription)
                    </button>
                  ) : (
                    <div className="w-full bg-white p-5 rounded-2xl border border-[var(--line)] shadow-sm space-y-4">
                      <h4 className="font-bold text-[var(--ink)]">Add Prescription</h4>
                      <input className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" placeholder="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                      <input className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" placeholder="Medicines" value={medicines} onChange={e => setMedicines(e.target.value)} />
                      <textarea className="w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]" rows={2} placeholder="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={handleCompleteWithPrescription} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors">Submit & Complete</button>
                        <button onClick={() => setIsPrescribing(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-slate-100 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => handleStatusChange("missed")} className="rounded-xl bg-white border border-[var(--line)] px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
                    Mark as Missed
                  </button>
                </>
              ) : (
                <>
                  <button className="rounded-xl bg-white border border-[var(--line)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors shadow-sm" onClick={() => toast.info("Drag and Drop in Calendar to Reschedule")}>
                    Reschedule (Use Calendar)
                  </button>
                  <button onClick={() => handleStatusChange("cancelled")} className="rounded-xl bg-white border border-red-200 px-5 py-2.5 text-sm font-bold text-[var(--error)] hover:bg-red-50 transition-colors shadow-sm">
                    Cancel Appointment
                  </button>
                </>
              )}
            </>
          )}

          {(appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "missed") && (
            <p className="text-sm font-medium text-[var(--muted)]">This appointment is closed and read-only.</p>
          )}
        </div>
      </div>
    </div>
  );
}
