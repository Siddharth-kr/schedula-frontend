import type { Appointment, AppointmentStatus, Prescription } from "@/types/appointment";

const APPOINTMENTS_KEY = "schedula_appointments";

let _seeded = false;

import { appointments as initialMockAppointments } from "@/lib/mock-data/appointments";

function ensureSeeded() {
  if (_seeded) return;
  if (typeof window === "undefined") return;
  _seeded = true;
  
  if (!localStorage.getItem(APPOINTMENTS_KEY)) {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(initialMockAppointments));
  }
}

export function getAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  ensureSeeded();
  const data = localStorage.getItem(APPOINTMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAppointments(appointments: Appointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  window.dispatchEvent(new Event("schedula_appointments_updated"));
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getAppointments().find(a => a.id === id);
}

export function getAppointmentsForDoctor(doctorId: string): Appointment[] {
  return getAppointments().filter(a => a.doctorId === doctorId);
}

export function getAppointmentsForPatient(patientName: string): Appointment[] {
  return getAppointments().filter(a => a.patient.name === patientName);
}

export function addAppointment(appointment: Appointment) {
  const appointments = getAppointments();
  appointments.push(appointment);
  saveAppointments(appointments);
}

import { addNotification } from "@/lib/notification-store";

export function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].status = status;
    saveAppointments(appointments);
    
    // Notifications
    const apt = appointments[idx];
    if (status === "confirmed") {
      addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} has been confirmed.`, type: "confirmation", appointmentId: id });
    } else if (status === "cancelled") {
      addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} has been cancelled.`, type: "cancellation", appointmentId: id });
    } else if (status === "missed") {
      addNotification({ userId: apt.patient.name, message: `You missed your appointment with ${apt.clinician}.`, type: "missed", appointmentId: id });
    } else if (status === "completed") {
      addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} is completed.`, type: "completed", appointmentId: id });
    }
  }
}

export function rescheduleAppointment(id: string, newDate: string, newStartTime: string) {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].startsAt = `${newDate}T${newStartTime}:00`;
    saveAppointments(appointments);
    
    const apt = appointments[idx];
    addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} has been rescheduled to ${newDate} at ${newStartTime}.`, type: "rescheduling", appointmentId: id });
  }
}

export function addPrescription(id: string, prescription: Prescription) {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].prescription = prescription;
    saveAppointments(appointments);
    
    const apt = appointments[idx];
    addNotification({ userId: apt.patient.name, message: `Prescription available for your appointment with ${apt.clinician}.`, type: "prescription", appointmentId: id });
  }
}

export function addReview(id: string, review: { rating: number; text?: string }) {
  const appointments = getAppointments();
  const idx = appointments.findIndex(a => a.id === id);
  if (idx !== -1) {
    appointments[idx].review = review;
    saveAppointments(appointments);
  }
}
