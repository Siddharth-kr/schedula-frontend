import type { Appointment } from "@/types/appointment";
import { addAppointment } from "@/lib/appointment-store";
import { addNotification } from "@/lib/notification-store";

type CreateAppointmentPayload = {
  patient: { name: string; age?: number; initials?: string };
  doctorId: string;
  clinician: string;
  specialty?: string;
  startsAt: string;
  reason?: string;
  durationMinutes?: number;
  patientInfo?: Record<string, string>;
  medicalInfo?: Record<string, string>;
  appointmentType?: string;
  preferredCommunication?: string;
  extraNotes?: string;
};

export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const response = await fetch(`/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  const body = await response.json();
  
  if (!response.ok) {
    throw new Error(body.error || "Unable to create appointment");
  }
  
  // Save to frontend local storage store as well, merging payload to preserve new fields
  const appointmentRecord = { ...body.data, ...payload };
  addAppointment(appointmentRecord);
  
  // Notify doctor
  addNotification({ userId: appointmentRecord.doctorId, message: `New booking from ${appointmentRecord.patient.name}.`, type: "booking", appointmentId: appointmentRecord.id });
  
  return appointmentRecord;
}
