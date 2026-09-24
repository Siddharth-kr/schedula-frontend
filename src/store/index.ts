import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loadSession } from './slices/authSlice';
import appointmentReducer, { loadAppointments } from './slices/appointmentSlice';
import doctorReducer, { loadDoctors } from './slices/doctorSlice';
import notificationReducer, { loadNotifications } from './slices/notificationSlice';
import auditReducer, { loadAuditLogs } from './slices/auditSlice';
import adminReducer, { loadAdminState } from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    appointments: appointmentReducer,
    doctors: doctorReducer,
    notifications: notificationReducer,
    audit: auditReducer,
    adminState: adminReducer,
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
  store.dispatch(loadAuditLogs());
  store.dispatch(loadAdminState());

  window.addEventListener('schedula_auth_change', () => {
    store.dispatch(loadSession());
  });

  const APPOINTMENTS_KEY = 'schedula_appointments';
  const DOCTORS_KEY = 'schedula_doctors';
  const NOTIFICATIONS_KEY = 'schedula_admin_notifications';
  const AUDIT_LOGS_KEY = 'schedula_audit_logs';
  const ADMIN_USERS_KEY = 'schedula_admin_users';
  const ADMIN_ROLES_KEY = 'schedula_admin_roles';
  const ADMIN_SETTINGS_KEY = 'schedula_admin_settings';
  
  window.addEventListener('storage', (e) => {
    if (e.key === APPOINTMENTS_KEY) {
      store.dispatch(loadAppointments());
    } else if (e.key === DOCTORS_KEY) {
      store.dispatch(loadDoctors());
    } else if (e.key === NOTIFICATIONS_KEY) {
      store.dispatch(loadNotifications());
    } else if (e.key === AUDIT_LOGS_KEY) {
      store.dispatch(loadAuditLogs());
    } else if (e.key === ADMIN_USERS_KEY || e.key === ADMIN_ROLES_KEY || e.key === ADMIN_SETTINGS_KEY) {
      store.dispatch(loadAdminState());
    }
  });

  window.addEventListener('schedula_doctors_change', () => {
    store.dispatch(loadDoctors());
  });
  window.addEventListener('schedula_audit_logs_updated', () => {
    store.dispatch(loadAuditLogs());
  });
}

