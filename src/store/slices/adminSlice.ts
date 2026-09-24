import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AdminUser, AdminRole, PlatformSettings, AdminNotificationPreferences } from '@/types/admin';

// Default predefined roles
const defaultRoles: AdminRole[] = [
  {
    id: 'role_super_admin',
    name: 'Super Admin',
    description: 'Full administrative access',
    isSystem: true,
    permissions: {
      'Dashboard': ['view', 'create', 'edit', 'delete', 'approve'],
      'Doctors': ['view', 'create', 'edit', 'delete', 'approve'],
      'Doctor Verification': ['view', 'create', 'edit', 'delete', 'approve'],
      'Patients': ['view', 'create', 'edit', 'delete', 'approve'],
      'Appointments': ['view', 'create', 'edit', 'delete', 'approve'],
      'Payments': ['view', 'create', 'edit', 'delete', 'approve'],
      'Reviews': ['view', 'create', 'edit', 'delete', 'approve'],
      'Notifications': ['view', 'create', 'edit', 'delete', 'approve'],
      'Analytics': ['view', 'create', 'edit', 'delete', 'approve'],
      'Reports': ['view', 'create', 'edit', 'delete', 'approve'],
      'Audit Logs': ['view', 'create', 'edit', 'delete', 'approve'],
      'Admin Users': ['view', 'create', 'edit', 'delete', 'approve'],
      'Roles & Permissions': ['view', 'create', 'edit', 'delete', 'approve'],
      'Settings': ['view', 'create', 'edit', 'delete', 'approve'],
    }
  },
  {
    id: 'role_admin',
    name: 'Admin',
    description: 'Broad operational access',
    isSystem: true,
    permissions: {
      'Dashboard': ['view'],
      'Doctors': ['view', 'create', 'edit'],
      'Doctor Verification': ['view', 'approve'],
      'Patients': ['view', 'create', 'edit'],
      'Appointments': ['view', 'create', 'edit', 'delete'],
      'Payments': ['view'],
      'Reviews': ['view', 'approve'],
      'Notifications': ['view', 'create'],
      'Analytics': ['view'],
      'Reports': ['view', 'create'],
      'Audit Logs': ['view'],
      'Admin Users': ['view'], // Cannot edit other admins
      'Roles & Permissions': [], // Cannot view or edit roles
      'Settings': ['view'],
    }
  },
  {
    id: 'role_support',
    name: 'Support',
    description: 'Limited access for operational support',
    isSystem: true,
    permissions: {
      'Dashboard': ['view'],
      'Doctors': ['view'],
      'Doctor Verification': ['view'],
      'Patients': ['view'],
      'Appointments': ['view', 'edit'], // Can view and edit but not delete
      'Payments': [], // No financial access
      'Reviews': ['view'],
      'Notifications': ['view'],
      'Analytics': [], // No analytics access
      'Reports': [], // No reports access
      'Audit Logs': [], // No audit logs
      'Admin Users': [],
      'Roles & Permissions': [],
      'Settings': [],
    }
  }
];

const defaultAdmins: AdminUser[] = [
  {
    id: 'admin-1',
    name: 'Schedula Super Admin',
    email: 'admin@schedula.com',
    roleId: 'role_super_admin',
    status: 'active',
    createdAt: new Date('2023-01-01').toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    id: 'admin-2',
    name: 'Schedula Operations',
    email: 'ops@schedula.com',
    roleId: 'role_admin',
    status: 'active',
    createdAt: new Date('2023-05-15').toISOString(),
    lastActive: new Date().toISOString()
  },
  {
    id: 'admin-3',
    name: 'Support Team',
    email: 'support@schedula.com',
    roleId: 'role_support',
    status: 'active',
    createdAt: new Date('2023-08-20').toISOString(),
    lastActive: new Date().toISOString()
  }
];

const defaultSettings: PlatformSettings = {
  platformName: 'Schedula Platform',
  supportEmail: 'support@schedula.com',
  supportPhone: '+1 (555) 123-4567',
  defaultAppointmentDuration: 30,
  defaultConsultationFee: 150,
  maintenanceMode: false
};

const defaultPreferences: AdminNotificationPreferences = {
  emailNotifications: true,
  systemAlerts: true,
  appointmentAlerts: false,
  paymentAlerts: false,
  securityAlerts: true
};

interface AdminState {
  admins: AdminUser[];
  roles: AdminRole[];
  settings: PlatformSettings;
  preferences: AdminNotificationPreferences;
}

const initialState: AdminState = {
  admins: defaultAdmins,
  roles: defaultRoles,
  settings: defaultSettings,
  preferences: defaultPreferences
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    loadAdminState: (state) => {
      if (typeof window === 'undefined') return;
      
      try {
        const storedAdmins = localStorage.getItem('schedula_admin_users');
        if (storedAdmins) state.admins = JSON.parse(storedAdmins);
        
        const storedRoles = localStorage.getItem('schedula_admin_roles');
        if (storedRoles) state.roles = JSON.parse(storedRoles);
        
        const storedSettings = localStorage.getItem('schedula_admin_settings');
        if (storedSettings) state.settings = JSON.parse(storedSettings);
        
        const storedPrefs = localStorage.getItem('schedula_admin_preferences');
        if (storedPrefs) state.preferences = JSON.parse(storedPrefs);
      } catch (e) {
        console.error("Failed to load admin state from local storage", e);
      }
    },
    addAdminUser: (state, action: PayloadAction<AdminUser>) => {
      state.admins.push(action.payload);
      if (typeof window !== 'undefined') localStorage.setItem('schedula_admin_users', JSON.stringify(state.admins));
    },
    updateAdminUser: (state, action: PayloadAction<AdminUser>) => {
      const index = state.admins.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.admins[index] = action.payload;
        if (typeof window !== 'undefined') localStorage.setItem('schedula_admin_users', JSON.stringify(state.admins));
      }
    },
    updateAdminRole: (state, action: PayloadAction<AdminRole>) => {
      const index = state.roles.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
        if (typeof window !== 'undefined') localStorage.setItem('schedula_admin_roles', JSON.stringify(state.roles));
      }
    },
    updateSettings: (state, action: PayloadAction<PlatformSettings>) => {
      state.settings = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('schedula_admin_settings', JSON.stringify(state.settings));
    },
    updatePreferences: (state, action: PayloadAction<AdminNotificationPreferences>) => {
      state.preferences = action.payload;
      if (typeof window !== 'undefined') localStorage.setItem('schedula_admin_preferences', JSON.stringify(state.preferences));
    }
  }
});

export const { 
  loadAdminState, 
  addAdminUser, 
  updateAdminUser, 
  updateAdminRole,
  updateSettings,
  updatePreferences
} = adminSlice.actions;

export default adminSlice.reducer;
