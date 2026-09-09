import { create } from 'zustand';
import type { Appointment, AppointmentStatus, Prescription } from '@/types/appointment';
import { appointments as initialMockAppointments } from "@/lib/mock-data/appointments";
import { addNotification } from "@/lib/notification-store";

const APPOINTMENTS_KEY = "schedula_appointments";

interface AppointmentState {
  appointments: Appointment[];
  loadAppointments: () => void;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsForDoctor: (doctorId: string) => Appointment[];
  getAppointmentsForPatient: (patientName: string) => Appointment[];
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  updateAppointmentData: (id: string, data: Partial<Appointment>) => void;
  rescheduleAppointment: (id: string, newDate: string, newStartTime: string) => void;
  addPrescription: (id: string, prescription: Prescription) => void;
  addReview: (id: string, review: { rating: number; text?: string }) => void;
}

function persistToLocalStorage(appointments: Appointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  // Keep dispatching the event for un-migrated components
  window.dispatchEvent(new Event("schedula_appointments_updated"));
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  loadAppointments: () => {
    if (typeof window === "undefined") return;
    let dataStr = localStorage.getItem(APPOINTMENTS_KEY);
    if (!dataStr) {
      dataStr = JSON.stringify(initialMockAppointments);
      localStorage.setItem(APPOINTMENTS_KEY, dataStr);
    }
    const apts = JSON.parse(dataStr);
    set({ appointments: apts });
  },
  getAppointmentById: (id: string) => {
    return get().appointments.find(a => a.id === id);
  },
  getAppointmentsForDoctor: (doctorId: string) => {
    return get().appointments.filter(a => a.doctorId === doctorId);
  },
  getAppointmentsForPatient: (patientName: string) => {
    return get().appointments.filter(a => a.patient.name === patientName);
  },
  addAppointment: (appointment: Appointment) => {
    const { appointments } = get();
    const newAppointments = [...appointments, appointment];
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
  },
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => {
    const { appointments } = get();
    const newAppointments = appointments.map(a => {
      if (a.id === id) {
        return { ...a, status };
      }
      return a;
    });
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
    
    // Notifications
    const apt = newAppointments.find(a => a.id === id);
    if (apt) {
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
  },
  updateAppointmentData: (id: string, data: Partial<Appointment>) => {
    const { appointments } = get();
    const newAppointments = appointments.map(a => {
      if (a.id === id) {
        return { ...a, ...data };
      }
      return a;
    });
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
  },
  rescheduleAppointment: (id: string, newDate: string, newStartTime: string) => {
    const { appointments } = get();
    const newAppointments = appointments.map(a => {
      if (a.id === id) {
        return { ...a, startsAt: `${newDate}T${newStartTime}:00` };
      }
      return a;
    });
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
    
    const apt = newAppointments.find(a => a.id === id);
    if (apt) {
      addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} has been rescheduled to ${newDate} at ${newStartTime}.`, type: "rescheduling", appointmentId: id });
    }
  },
  addPrescription: (id: string, prescription: Prescription) => {
    const { appointments } = get();
    const newAppointments = appointments.map(a => {
      if (a.id === id) {
        return { ...a, prescription };
      }
      return a;
    });
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
    
    const apt = newAppointments.find(a => a.id === id);
    if (apt) {
      addNotification({ userId: apt.patient.name, message: `Prescription available for your appointment with ${apt.clinician}.`, type: "prescription", appointmentId: id });
    }
  },
  addReview: (id: string, review: { rating: number; text?: string }) => {
    const { appointments } = get();
    const newAppointments = appointments.map(a => {
      if (a.id === id) {
        return { ...a, review };
      }
      return a;
    });
    set({ appointments: newAppointments });
    persistToLocalStorage(newAppointments);
  }
}));

// Cross-tab sync
if (typeof window !== 'undefined') {
  const sync = () => useAppointmentStore.getState().loadAppointments();
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_KEY) sync();
  });
  // Initial sync
  sync();
}
