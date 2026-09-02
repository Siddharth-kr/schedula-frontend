"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import { getAppointmentById, updateAppointmentStatus } from "@/lib/appointment-store";
import { getPrescriptionByAppointmentId } from "@/lib/prescription-store";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";
import { PrescriptionForm } from "./PrescriptionForm";
import { PrescriptionDetails } from "./PrescriptionDetails";
import { toast } from "react-toastify";

export function DoctorAppointmentDetails() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    if (appointmentId) {
      const apt = getAppointmentById(appointmentId);
      if (apt && apt.clinician === session.name) {
        setAppointment(apt);
        setPrescription(getPrescriptionByAppointmentId(apt.id) || null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_prescriptions") loadData();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", loadData);
    window.addEventListener("schedula_prescriptions_updated", loadData);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", loadData);
      window.removeEventListener("schedula_prescriptions_updated", loadData);
    };
  }, [appointmentId, router]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-[var(--muted)]">Loading details...</div>;
  }

  if (!appointment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-[var(--muted)]">Appointment not found or unauthorized.</p>
        <Link href="/doctor/appointments" className="text-sm font-bold text-[var(--brand)] hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    updateAppointmentStatus(appointment.id, newStatus);
    setAppointment({ ...appointment, status: newStatus });
    toast.success(`Appointment marked as ${newStatus}.`);
  };

  // eslint-disable-next-line react-hooks/purity
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
              <button onClick={() => handleStatusChange("completed")} className="rounded-xl bg-[var(--brand)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors shadow-sm">
                Mark as Completed
              </button>
              {isPast ? (
                <button onClick={() => handleStatusChange("missed")} className="rounded-xl bg-white border border-[var(--line)] px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
                  Mark as Missed
                </button>
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

      {/* Prescription Section */}
      {appointment.status === "completed" && (
        <div className="space-y-6">
          {!prescription && !isPrescribing && (
            <div className="bg-white rounded-2xl border border-[var(--line)] shadow-sm p-8 text-center flex flex-col items-center">
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">No prescription has been created.</h3>
              <p className="text-sm text-[var(--muted)] mb-6 max-w-md">Add a digital prescription including diagnosis and medicines for this completed appointment.</p>
              <button onClick={() => setIsPrescribing(true)} className="rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--brand-deep)] transition-colors shadow-sm">
                Create Prescription
              </button>
            </div>
          )}
          
          {(isPrescribing || isEditing) && (
            <PrescriptionForm 
              appointment={appointment} 
              existingPrescription={prescription || undefined} 
              onSuccess={(p) => {
                setPrescription(p);
                setIsPrescribing(false);
                setIsEditing(false);
              }}
              onCancel={() => {
                setIsPrescribing(false);
                setIsEditing(false);
              }}
            />
          )}

          {prescription && !isEditing && (
            <PrescriptionDetails 
              prescription={prescription} 
              appointment={appointment}
              isDoctor={true}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
      )}
    </div>
  );
}
