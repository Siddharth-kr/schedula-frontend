import type { Appointment } from "@/types/appointment";

export async function getAppointment(id: string): Promise<Appointment> {
  const response = await fetch(`/api/appointments/${id}`);
  
  if (!response.ok) {
    throw new Error("Unable to load appointment");
  }
  
  const body = await response.json();
  return body.data;
}
