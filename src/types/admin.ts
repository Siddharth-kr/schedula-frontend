export type AdminAction = 'view' | 'create' | 'edit' | 'delete' | 'approve';

export type AdminModule = 
  | 'Dashboard'
  | 'Doctors'
  | 'Doctor Verification'
  | 'Patients'
  | 'Appointments'
  | 'Payments'
  | 'Reviews'
  | 'Notifications'
  | 'Analytics'
  | 'Reports'
  | 'Audit Logs'
  | 'Admin Users'
  | 'Roles & Permissions'
  | 'Settings';

export type RolePermissions = {
  [K in AdminModule]?: AdminAction[];
};

export type AdminRole = {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  isSystem?: boolean; // Cannot be deleted
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastActive?: string;
  avatar?: string;
};

export type PlatformSettings = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultAppointmentDuration: number;
  defaultConsultationFee: number;
  maintenanceMode: boolean;
};

export type AdminNotificationPreferences = {
  emailNotifications: boolean;
  systemAlerts: boolean;
  appointmentAlerts: boolean;
  paymentAlerts: boolean;
  securityAlerts: boolean;
};
