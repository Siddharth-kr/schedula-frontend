import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadSession } from './slices/authSlice';
import appointmentReducer, { loadAppointments } from './slices/appointmentSlice';
import doctorReducer, { loadDoctors } from './slices/doctorSlice';
import notificationReducer, { loadNotifications } from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    doctors: doctorReducer,
    notifications: notificationReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

if (typeof window !== 'undefined') {
  store.dispatch(loadSession());
  store.dispatch(loadAppointments());
  store.dispatch(loadDoctors());
  store.dispatch(loadNotifications());

  window.addEventListener('schedula_auth_change', () => {
    store.dispatch(loadSession());
  });

  const APPOINTMENTS_KEY = 'schedula_appointments';
  const DOCTORS_KEY = 'schedula_doctors';
  const NOTIFICATIONS_KEY = 'schedula_admin_notifications';
  
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_KEY) {
      store.dispatch(loadAppointments());
    } else if (e.key === DOCTORS_KEY) {
      store.dispatch(loadDoctors());
    } else if (e.key === NOTIFICATIONS_KEY) {
      store.dispatch(loadNotifications());
    }
  });

  window.addEventListener('schedula_doctors_change', () => {
    store.dispatch(loadDoctors());
  });
}
