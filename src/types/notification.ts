export type NotificationAudience = "All Patients" | "All Doctors" | "Selected Users";
export type NotificationStatus = "Draft" | "Sent";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  audience: NotificationAudience;
  selectedUserIds?: string[];
  createdAt: string;
  sentAt?: string;
  status: NotificationStatus;
};
