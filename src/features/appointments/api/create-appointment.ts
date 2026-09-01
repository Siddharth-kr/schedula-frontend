import type { Appointment } from "@/types/appointment";

type CreateAppointmentPayload = {
  patient: { name: string };
  clinician: string;
  specialty?: string;
  startsAt: string;
  reason?: string;
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
  
  return body.data;
}
