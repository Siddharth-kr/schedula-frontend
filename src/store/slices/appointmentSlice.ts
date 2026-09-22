import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';
import type { Appointment, AppointmentStatus, Prescription } from '@/types/appointment';
import { appointments as initialMockAppointments } from "@/lib/mock-data/appointments";
import { addNotification } from "@/lib/notification-store";

const APPOINTMENTS_KEY = "schedula_appointments";

interface AppointmentState {
  appointments: Appointment[];
}

const initialState: AppointmentState = {
  appointments: [],
};

function persistToLocalStorage(appointments: Appointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  window.dispatchEvent(new Event("schedula_appointments_updated"));
}

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    loadAppointments: (state) => {
      if (typeof window === "undefined") return;
      let dataStr = localStorage.getItem(APPOINTMENTS_KEY);
      if (!dataStr) {
        dataStr = JSON.stringify(initialMockAppointments);
        localStorage.setItem(APPOINTMENTS_KEY, dataStr);
      }
      state.appointments = JSON.parse(dataStr);
    },
    addAppointment: (state, action: PayloadAction<Appointment>) => {
      state.appointments.push(action.payload);
      persistToLocalStorage(current(state.appointments));
    },
    updateAppointmentStatus: (state, action: PayloadAction<{ id: string; status: AppointmentStatus }>) => {
      const { id, status } = action.payload;
      const apt = state.appointments.find(a => a.id === id);
      if (apt) {
        apt.status = status;
        if (status === "cancelled") {
          apt.cancelledAt = new Date().toISOString();
        }
        persistToLocalStorage(current(state.appointments));
        
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
    updateAppointmentData: (state, action: PayloadAction<{ id: string; data: Partial<Appointment> }>) => {
      const { id, data } = action.payload;
      const aptIndex = state.appointments.findIndex(a => a.id === id);
      if (aptIndex !== -1) {
        state.appointments[aptIndex] = { ...state.appointments[aptIndex], ...data };
        persistToLocalStorage(current(state.appointments));
      }
    },
    rescheduleAppointment: (state, action: PayloadAction<{ id: string; newDate: string; newStartTime: string }>) => {
      const { id, newDate, newStartTime } = action.payload;
      const apt = state.appointments.find(a => a.id === id);
      if (apt) {
        if (!apt.rescheduledFrom) {
          apt.rescheduledFrom = apt.startsAt;
        }
        apt.startsAt = `${newDate}T${newStartTime}:00`;
        persistToLocalStorage(current(state.appointments));
        addNotification({ userId: apt.patient.name, message: `Your appointment with ${apt.clinician} has been rescheduled to ${newDate} at ${newStartTime}.`, type: "rescheduling", appointmentId: id });
      }
    },
    addPrescription: (state, action: PayloadAction<{ id: string; prescription: Prescription }>) => {
      const { id, prescription } = action.payload;
      const apt = state.appointments.find(a => a.id === id);
      if (apt) {
        apt.prescription = prescription;
        persistToLocalStorage(current(state.appointments));
        addNotification({ userId: apt.patient.name, message: `Prescription available for your appointment with ${apt.clinician}.`, type: "prescription", appointmentId: id });
      }
    },
    addReview: (state, action: PayloadAction<{ id: string; review: { rating: number; text?: string; isReported?: boolean; reportReason?: string; isHidden?: boolean; createdAt?: string } }>) => {
      const { id, review } = action.payload;
      const apt = state.appointments.find(a => a.id === id);
      if (apt) {
        apt.review = review;
        persistToLocalStorage(current(state.appointments));
      }
    },
    updateReview: (state, action: PayloadAction<{ id: string; updates: Partial<{ rating: number; text?: string; isReported?: boolean; reportReason?: string; isHidden?: boolean }> }>) => {
      const { id, updates } = action.payload;
      const apt = state.appointments.find(a => a.id === id);
      if (apt && apt.review) {
        apt.review = { ...apt.review, ...updates };
        persistToLocalStorage(current(state.appointments));
      }
    }
  }
});

export const { 
  loadAppointments, 
  addAppointment, 
  updateAppointmentStatus, 
  updateAppointmentData, 
  rescheduleAppointment, 
  addPrescription, 
  addReview,
  updateReview
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
