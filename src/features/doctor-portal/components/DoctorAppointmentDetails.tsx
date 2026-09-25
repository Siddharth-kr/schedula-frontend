"use client";
import { useAppSelector } from "@/store/hooks";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { updateAppointmentStatus } from "@/lib/appointment-store";
import { getPrescriptionByAppointmentId } from "@/lib/prescription-store";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { AppointmentStatusBadge } from "@/components/ui/AppointmentStatusBadge";
import { PrescriptionForm } from "./PrescriptionForm";
import { PrescriptionDetails } from "./PrescriptionDetails";
import { toast } from "react-toastify";
import { freeSlot, getAllSlots } from "@/lib/availability-store";
import { OnlineAppointmentActions } from "@/features/appointments/components/OnlineAppointmentActions";

export function DoctorAppointmentDetails() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { doctor: session } = useAppSelector(state => state.auth);
  const allAppointments = useAppSelector(state => state.appointments.appointments);

  // React to Zustand appointment changes
  useEffect(() => {
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    if (appointmentId) {
      const apt = allAppointments.find(a => a.id === appointmentId);
      if (apt && apt.clinician === session.name) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAppointment(apt);
        setPrescription(getPrescriptionByAppointmentId(apt.id) || null);
      }
    }
    setIsLoading(false);
  }, [session, allAppointments, appointmentId, router]);

  // Prescription sync (not yet in Zustand)
  useEffect(() => {
    if (!appointmentId) return;
    const syncPrescription = () => {
      setPrescription(getPrescriptionByAppointmentId(appointmentId) || null);
    };
    window.addEventListener("schedula_prescriptions_updated", syncPrescription);
    return () => {
      window.removeEventListener("schedula_prescriptions_updated", syncPrescription);
    };
  }, [appointmentId]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-text-secondary">Loading details...</div>;
  }

  if (!appointment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">Appointment not found or unauthorized.</p>
        <Link href="/doctor/appointments" className="text-sm font-bold text-primary hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    updateAppointmentStatus(appointment.id, newStatus);
    setAppointment({ ...appointment, status: newStatus });
    
    if (newStatus === "cancelled") {
      const slot = getAllSlots().find(s => s.appointmentId === appointment.id);
      if (slot) {
        freeSlot(slot.id);
        window.dispatchEvent(new Event("schedula_slots_updated"));
      }
    }

    toast.success(`Appointment marked as ${newStatus}.`);
  };

  // eslint-disable-next-line react-hooks/purity
  const isPast = new Date(appointment.startsAt).getTime() < Date.now();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/doctor/appointments" className="text-sm font-bold text-primary hover:underline">
          &larr; Back to Appointments
        </Link>
      </div>
      
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-border">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-border bg-background/50 px-6 py-5 sm:px-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-serif">Appointment Details</h1>
            <p className="text-sm text-text-secondary mt-1">ID: {appointment.id}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="self-start sm:self-end">
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            {appointment.consultationType === "online" && (
              <OnlineAppointmentActions appointment={appointment} role="doctor" />
            )}
          </div>
        </div>
        
        <div className="px-6 py-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Patient Name</dt>
              <dd className="text-base font-bold text-text-primary mt-1">{appointment.patient.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Date & Time</dt>
              <dd className="text-base font-medium text-text-primary mt-1">
                {new Date(appointment.startsAt).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}<br/>
                {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(appointment.startsAt))}
              </dd>
            </div>
          </dl>
          
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Consultation Type</dt>
              <dd className="text-base font-medium text-text-primary mt-1">
                {appointment.consultationType === "online" ? "Online Consultation" : "In-person Consultation"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Reason for Visit</dt>
              <dd className="text-base font-medium text-text-primary mt-1">{appointment.reason || "General Consultation"}</dd>
            </div>
            {(!appointment.consultationType || appointment.consultationType === "in-person") && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Clinic & Location</dt>
                <dd className="text-base font-medium text-text-primary mt-1">{appointment.room || "Main Care Center"}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Patient Intake Information */}
        {(appointment.medicalInfo || appointment.patientInfo) && (
          <div className="px-6 py-6 sm:px-8 border-t border-border bg-background/30">
            <h3 className="text-lg font-bold text-text-primary font-serif mb-4">Patient Intake Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {appointment.medicalInfo && (
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Symptoms</dt>
                    <dd className="text-sm text-text-primary mt-1 whitespace-pre-line">{appointment.medicalInfo.symptoms || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Medical History</dt>
                    <dd className="text-sm text-text-primary mt-1">
                      <span className="font-semibold block">Conditions:</span> {appointment.medicalInfo.medicalConditions || "None"}
                      <span className="font-semibold block mt-1">Allergies:</span> {appointment.medicalInfo.allergies || "None"}
                      <span className="font-semibold block mt-1">Medications:</span> {appointment.medicalInfo.medications || "None"}
                    </dd>
                  </div>
                  {appointment.medicalInfo.additionalInfo && (
                     <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Additional Info</dt>
                      <dd className="text-sm text-text-primary mt-1 whitespace-pre-line">{appointment.medicalInfo.additionalInfo}</dd>
                    </div>
                  )}
                </dl>
              )}

              {appointment.patientInfo && (
                <dl className="space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Contact & Demographics</dt>
                    <dd className="text-sm text-text-primary mt-1">
                      <span className="font-semibold block">Phone:</span> {appointment.patientInfo.phone || "N/A"}
                      <span className="font-semibold block mt-1">Email:</span> {appointment.patientInfo.email || "N/A"}
                      <span className="font-semibold block mt-1">DOB:</span> {appointment.patientInfo.dob || "N/A"}
                      <span className="font-semibold block mt-1">Gender:</span> {appointment.patientInfo.gender || "N/A"}
                    </dd>
                  </div>
                  {(appointment.patientInfo.emergencyContactName) && (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Emergency Contact</dt>
                      <dd className="text-sm text-text-primary mt-1">
                        {appointment.patientInfo.emergencyContactName} ({appointment.patientInfo.emergencyContactRelation})<br/>
                        {appointment.patientInfo.emergencyContactPhone}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </div>
        )}

        {/* Payment Details */}
        {appointment.paymentId && (
          <div className="px-6 py-6 sm:px-8 border-t border-border bg-stone-50">
            <h3 className="text-lg font-bold text-text-primary font-serif mb-4 flex items-center gap-2">
              <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Payment Details
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">Demo</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Status</dt>
                <dd className="mt-1">
                  {appointment.paymentStatus === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-success text-sm">
                      <span className="size-2 rounded-full bg-success"></span> Paid
                    </span>
                  ) : appointment.paymentStatus === 'failed' ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-error text-sm">
                      <span className="size-2 rounded-full bg-error"></span> Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-500 text-sm">
                      <span className="size-2 rounded-full bg-amber-500"></span> Pending
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Amount</dt>
                <dd className="text-sm font-bold text-text-primary mt-1">₹{appointment.consultationFee}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Transaction ID</dt>
                <dd className="text-sm font-bold font-mono text-text-primary mt-1">{appointment.paymentId}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Method</dt>
                <dd className="text-sm font-bold text-text-primary mt-1">Demo Payment</dd>
              </div>
            </div>
          </div>
        )}

        <div className="bg-background px-6 py-6 sm:px-8 border-t border-border flex flex-wrap gap-3 items-center">
          {appointment.status === "pending" && (
            <>
              <button onClick={() => handleStatusChange("confirmed")} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm">
                Confirm Appointment
              </button>
              <button onClick={() => handleStatusChange("cancelled")} className="rounded-xl bg-white border border-border px-5 py-2.5 text-sm font-bold text-error hover:bg-error/10 transition-colors shadow-sm">
                Decline
              </button>
            </>
          )}

          {(appointment.status === "confirmed" || appointment.status === "upcoming") && (
            <>
              <button onClick={() => handleStatusChange("completed")} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm">
                Mark as Completed
              </button>
              {isPast ? (
                <button onClick={() => handleStatusChange("missed")} className="rounded-xl bg-white border border-border px-5 py-2.5 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm">
                  Mark as Missed
                </button>
              ) : (
                <>
                  <button className="rounded-xl bg-white border border-border px-5 py-2.5 text-sm font-bold text-text-primary hover:border-primary hover:text-primary transition-colors shadow-sm" onClick={() => toast.info("Drag and Drop in Calendar to Reschedule")}>
                    Reschedule (Use Calendar)
                  </button>
                  <button onClick={() => handleStatusChange("cancelled")} className="rounded-xl bg-white border border-error/30 px-5 py-2.5 text-sm font-bold text-error hover:bg-error/10 transition-colors shadow-sm">
                    Cancel Appointment
                  </button>
                </>
              )}
            </>
          )}

          {(appointment.status === "completed" || appointment.status === "cancelled" || appointment.status === "missed") && (
            <p className="text-sm font-medium text-text-secondary">This appointment is closed and read-only.</p>
          )}
        </div>
      </div>

      {/* Prescription Section */}
      {appointment.status === "completed" && (
        <div className="space-y-6">
          {!prescription && !isPrescribing && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center flex flex-col items-center">
              <h3 className="text-lg font-bold text-text-primary mb-2">No prescription has been created.</h3>
              <p className="text-sm text-text-secondary mb-6 max-w-md">Add a digital prescription including diagnosis and medicines for this completed appointment.</p>
              <button onClick={() => setIsPrescribing(true)} className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm">
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
