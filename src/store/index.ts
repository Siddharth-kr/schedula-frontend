import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadSession } from './slices/authSlice';
import appointmentReducer, { loadAppointments } from './slices/appointmentSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

if (typeof window !== 'undefined') {
  store.dispatch(loadSession());
  store.dispatch(loadAppointments());

  window.addEventListener('schedula_auth_change', () => {
    store.dispatch(loadSession());
  });

  const APPOINTMENTS_KEY = 'schedula_appointments';
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_KEY) {
      store.dispatch(loadAppointments());
    }
  });
}
