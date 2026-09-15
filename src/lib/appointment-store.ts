import type { Appointment, AppointmentStatus, Prescription } from "@/types/appointment";
import { store } from "@/store";
import { addAppointment as addAppointmentAction, updateAppointmentStatus as updateAppointmentStatusAction, updateAppointmentData as updateAppointmentDataAction, rescheduleAppointment as rescheduleAppointmentAction, addPrescription as addPrescriptionAction, addReview as addReviewAction } from "@/store/slices/appointmentSlice";

export function getAppointments(): Appointment[] {
  return store.getState().appointments.appointments;
}

export function getAppointmentById(id: string): Appointment | undefined {
  return store.getState().appointments.appointments.find(a => a.id === id);
}

export function getAppointmentsForDoctor(doctorId: string): Appointment[] {
  return store.getState().appointments.appointments.filter(a => a.doctorId === doctorId);
}

export function getAppointmentsForPatient(patientName: string): Appointment[] {
  return store.getState().appointments.appointments.filter(a => a.patient.name === patientName);
}

export function addAppointment(appointment: Appointment) {
  store.dispatch(addAppointmentAction(appointment));
}

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  store.dispatch(updateAppointmentStatusAction({ id, status }));
}

export function updateAppointmentData(id: string, data: Partial<Appointment>) {
  store.dispatch(updateAppointmentDataAction({ id, data }));
}

export function rescheduleAppointment(id: string, newDate: string, newStartTime: string) {
  store.dispatch(rescheduleAppointmentAction({ id, newDate, newStartTime }));
}

export function addPrescription(id: string, prescription: Prescription) {
  store.dispatch(addPrescriptionAction({ id, prescription }));
}

export function addReview(id: string, review: { rating: number; text?: string }) {
  store.dispatch(addReviewAction({ id, review }));
}
