import { create } from 'zustand';
import type { Appointment } from '@/types/appointment';
import { getAppointments } from '@/lib/appointment-store';

interface AppointmentState {
  appointments: Appointment[];
  loadAppointments: () => void;
  // Further actions like cancelAppointment will be added in future migrations
  // mapping to existing legacy store functions to preserve single-source-of-truth.
}

export const useAppointmentStore = create<AppointmentState>((set) => ({
  appointments: [],
  loadAppointments: () => {
    if (typeof window === 'undefined') return;
    const apts = getAppointments();
    set({ appointments: apts });
  }
}));

// Bind to existing legacy events to ensure backward compatibility and sync with localStorage
if (typeof window !== 'undefined') {
  const sync = () => useAppointmentStore.getState().loadAppointments();
  
  // Custom app event
  window.addEventListener('schedula_appointments_updated', sync);
  
  // Cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'schedula_appointments') sync();
  });
  
  // Initial sync
  sync();
}
