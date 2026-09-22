import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AdminNotification } from '@/types/notification';

const STORAGE_KEY = 'schedula_admin_notifications';

const mockNotifications: AdminNotification[] = [
  {
    id: 'notif-1',
    title: 'System Maintenance Scheduled',
    message: 'The Schedula platform will undergo scheduled maintenance on Sunday at 2 AM EST. Expect 15 minutes of downtime.',
    audience: 'All Doctors',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'Sent',
  },
  {
    id: 'notif-2',
    title: 'New Feature: Video Consultations',
    message: 'You can now book fully integrated video consultations directly from the portal.',
    audience: 'All Patients',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    sentAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'Sent',
  },
];

interface NotificationState {
  notifications: AdminNotification[];
  isLoading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  isLoading: true,
};

const persistToLocalStorage = (notifications: AdminNotification[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event('storage'));
  }
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    loadNotifications: (state) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            state.notifications = JSON.parse(stored);
          } catch (e) {
            console.error("Failed to parse notifications", e);
            state.notifications = mockNotifications;
            persistToLocalStorage(mockNotifications);
          }
        } else {
          state.notifications = mockNotifications;
          persistToLocalStorage(mockNotifications);
        }
      }
      state.isLoading = false;
    },
    addNotification: (state, action: PayloadAction<AdminNotification>) => {
      state.notifications.unshift(action.payload);
      persistToLocalStorage(state.notifications);
    },
  },
});

export const { loadNotifications, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
