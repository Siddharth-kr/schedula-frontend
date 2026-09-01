import type { Appointment } from "@/types/appointment";
import { getAppointmentById } from "@/lib/appointment-store";

export async function getAppointment(id: string): Promise<Appointment> {
  const appointment = getAppointmentById(id);
  if (!appointment) {
    throw new Error("Appointment not found");
  }
  return appointment;
}
