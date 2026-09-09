import type { Appointment, AppointmentStatus, Prescription } from "@/types/appointment";
import { useAppointmentStore } from "@/store/appointmentStore";

export function getAppointments(): Appointment[] {
  return useAppointmentStore.getState().appointments;
}

export function getAppointmentById(id: string): Appointment | undefined {
  return useAppointmentStore.getState().getAppointmentById(id);
}

export function getAppointmentsForDoctor(doctorId: string): Appointment[] {
  return useAppointmentStore.getState().getAppointmentsForDoctor(doctorId);
}

export function getAppointmentsForPatient(patientName: string): Appointment[] {
  return useAppointmentStore.getState().getAppointmentsForPatient(patientName);
}

export function addAppointment(appointment: Appointment) {
  useAppointmentStore.getState().addAppointment(appointment);
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  useAppointmentStore.getState().updateAppointmentStatus(id, status);
}

export function updateAppointmentData(id: string, data: Partial<Appointment>) {
  useAppointmentStore.getState().updateAppointmentData(id, data);
}

export function rescheduleAppointment(id: string, newDate: string, newStartTime: string) {
  useAppointmentStore.getState().rescheduleAppointment(id, newDate, newStartTime);
}

export function addPrescription(id: string, prescription: Prescription) {
  useAppointmentStore.getState().addPrescription(id, prescription);
}

export function addReview(id: string, review: { rating: number; text?: string }) {
  useAppointmentStore.getState().addReview(id, review);
}
