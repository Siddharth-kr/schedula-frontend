import type { Prescription } from "@/types/prescription";
import { addNotification } from "@/lib/notification-store";
import { getAppointmentById } from "@/lib/appointment-store";

const PRESCRIPTIONS_KEY = "schedula_prescriptions";

export function getPrescriptions(): Prescription[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PRESCRIPTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePrescriptions(prescriptions: Prescription[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(prescriptions));
  window.dispatchEvent(new Event("schedula_prescriptions_updated"));
}

export function getPrescriptionByAppointmentId(appointmentId: string): Prescription | undefined {
  return getPrescriptions().find(p => p.appointmentId === appointmentId);
}

export function getPrescriptionsForDoctor(doctorId: string): Prescription[] {
  return getPrescriptions().filter(p => p.doctorId === doctorId);
}

export function getPrescriptionsForPatient(patientId: string): Prescription[] {
  return getPrescriptions().filter(p => p.patientId === patientId);
}

export function addPrescription(prescription: Prescription) {
  const prescriptions = getPrescriptions();
  prescriptions.push(prescription);
  savePrescriptions(prescriptions);
  
  const apt = getAppointmentById(prescription.appointmentId);
  if (apt) {
    addNotification({ 
      userId: apt.patient.name, 
      message: `Dr. ${apt.clinician} has added a prescription for your completed appointment.`, 
      type: "prescription", 
      appointmentId: apt.id 
    });
  }
}

export function updatePrescription(prescription: Prescription) {
  const prescriptions = getPrescriptions();
  const index = prescriptions.findIndex(p => p.id === prescription.id);
  if (index !== -1) {
    prescriptions[index] = prescription;
    savePrescriptions(prescriptions);
    
    const apt = getAppointmentById(prescription.appointmentId);
    if (apt) {
      addNotification({ 
        userId: apt.patient.name, 
        message: `Your prescription has been updated by Dr. ${apt.clinician}.`, 
        type: "prescription", 
        appointmentId: apt.id 
      });
    }
  }
}
