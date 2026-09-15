export type NotificationType = "booking" | "confirmation" | "rescheduling" | "cancellation" | "reminder" | "missed" | "completed" | "prescription";

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  appointmentId?: string;
  userId: string; // to whom it belongs (doctor or patient)
}

const NOTIFICATIONS_KEY = "schedula_notifications";

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getUserNotifications(userId: string): AppNotification[] {
  return getNotifications().filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNotification(notification: Omit<AppNotification, "id" | "createdAt" | "read">) {
  const notifications = getNotifications();
  const newNotif: AppNotification = {
    ...notification,
    id: `notif-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  notifications.push(newNotif);
  if (typeof window !== "undefined") {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    // Dispatch event so Navbar can update in real-time
    window.dispatchEvent(new Event("schedula_notifications_updated"));
  }
}

export function markNotificationRead(id: string) {
  const notifications = getNotifications();
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) {
    notifications[idx].read = true;
    if (typeof window !== "undefined") {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
      window.dispatchEvent(new Event("schedula_notifications_updated"));
    }
  }
}

export function markAllUserNotificationsRead(userId: string) {
  const notifications = getNotifications();
  let changed = false;
  notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed && typeof window !== "undefined") {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event("schedula_notifications_updated"));
  }
}
