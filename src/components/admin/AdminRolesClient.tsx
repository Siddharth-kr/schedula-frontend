"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateAdminRole } from "@/store/slices/adminSlice";
import { addAuditLog } from "@/store/slices/auditSlice";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { usePermissions } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { AdminRole, AdminModule, AdminAction } from "@/types/admin";

const MODULE_DEFINITIONS: { name: AdminModule, description: string, icon: React.ReactNode }[] = [
  { 
    name: 'Dashboard', 
    description: 'View platform overview and high-level metrics',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  },
  { 
    name: 'Doctors', 
    description: 'Manage doctor profiles and information',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
  { 
    name: 'Doctor Verification', 
    description: 'Verify and approve doctor applications',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  },
  { 
    name: 'Patients', 
    description: 'Manage patient accounts',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  },
  { 
    name: 'Appointments', 
    description: 'Manage appointments and schedules',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  },
  { 
    name: 'Payments', 
    description: 'View and manage payment transactions',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
  },
  { 
    name: 'Reviews', 
    description: 'Moderate patient reviews and ratings',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
  },
  { 
    name: 'Notifications', 
    description: 'Send and manage system notifications',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  },
  { 
    name: 'Analytics', 
    description: 'View platform analytics and insights',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  },
  { 
    name: 'Reports', 
    description: 'Generate and export reports',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  },
  { 
    name: 'Audit Logs', 
    description: 'View administrative activity',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  },
  { 
    name: 'Admin Users', 
    description: 'Manage administrator accounts',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
  },
  { 
    name: 'Roles & Permissions', 
    description: 'Manage roles and access control',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
  },
  { 
    name: 'Settings', 
    description: 'Manage platform settings',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  }
];

const ALL_ACTIONS: AdminAction[] = ['view', 'create', 'edit', 'delete', 'approve'];

export function AdminRolesClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'details' | 'users'>('permissions');
  
  const roles = useAppSelector((state) => state.adminState.roles);
  const admins = useAppSelector((state) => state.adminState.admins);
  const currentUser = useAppSelector((state) => state.auth.admin);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('Roles & Permissions', 'edit');

  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "");
  const selectedRole = roles.find(r => r.id === selectedRoleId);

  useEffect(() => {
    setIsClient(true); // eslint-disable-line
  }, []);

  if (!isClient) return <AdminPageSkeleton />;

  const handleTogglePermission = (module: AdminModule, action: AdminAction) => {
    if (!canEdit) {
      toast.error("You do not have permission to edit roles.");
      return;
    }
    if (!selectedRole) return;
    
    // Prevent locking yourself out of Roles & Permissions
    const currentAdminUser = admins.find(a => a.email === currentUser?.email);
    if (selectedRole.id === currentAdminUser?.roleId && module === 'Roles & Permissions' && action === 'view') {
      toast.error("You cannot remove your own access to Roles & Permissions.");
      return;
    }

    const currentModulePerms = selectedRole.permissions[module] || [];
    let newModulePerms: AdminAction[];

    if (currentModulePerms.includes(action)) {
      newModulePerms = currentModulePerms.filter(a => a !== action);
      // Dependencies: If view is disabled, disable everything else for this module
      if (action === 'view') {
        newModulePerms = [];
      }
    } else {
      newModulePerms = [...currentModulePerms, action];
      // Auto-grant 'view' if any other action is granted
      if (action !== 'view' && !newModulePerms.includes('view')) {
        newModulePerms.push('view');
      }
    }

    const updatedRole: AdminRole = {
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [module]: newModulePerms
      }
    };

    dispatch(updateAdminRole(updatedRole));
    dispatch(addAuditLog({
      admin: currentUser?.name || "System",
      action: "Edit Role",
      entity: "Roles & Permissions",
      details: `Updated permissions for role: ${updatedRole.name} on module ${module}`
    }));
    toast.success("Permission updated successfully.");
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.toLowerCase().includes('super admin')) {
      return (
        <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }
    if (roleName.toLowerCase().includes('admin')) {
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  };

  // Metrics
  const totalRoles = roles.length;
  const activeRolesCount = new Set(admins.filter(a => a.status === 'active').map(a => a.roleId)).size;
  const systemRolesCount = roles.filter(r => r.isSystem).length;
  const totalConfiguredPerms = roles.reduce((total, role) => {
    return total + Object.values(role.permissions).reduce((sum, perms) => sum + (perms ? perms.length : 0), 0);
  }, 0);

  const customRoles = roles.filter(r => !r.isSystem);
  const systemRoles = roles.filter(r => r.isSystem);

  const getRoleUserCount = (roleId: string) => admins.filter(a => a.roleId === roleId).length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
            <span>Home</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-900 font-medium">Roles & Permissions</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-[15px] text-slate-500 mt-1">Manage administrative roles and control access levels across the platform.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">Total Roles</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{totalRoles}</p>
            </div>
            <p className="text-[12px] text-slate-400">Configured roles</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">Total Permissions</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{totalConfiguredPerms}</p>
            </div>
            <p className="text-[12px] text-slate-400">Granted actions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">Active Roles</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{activeRolesCount}</p>
            </div>
            <p className="text-[12px] text-slate-400">In use by active admins</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-medium text-slate-500 mb-0.5">System Roles</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="text-2xl font-bold text-slate-900 leading-none">{systemRolesCount}</p>
            </div>
            <p className="text-[12px] text-slate-400">Predefined structures</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Sidebar: Roles */}
        <div className="w-full xl:w-80 shrink-0 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">System Roles</h3>
            </div>
            <div className="p-2 space-y-1">
              {systemRoles.map(role => {
                const userCount = getRoleUserCount(role.id);
                const isSelected = selectedRoleId === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRoleId(role.id); setActiveTab('permissions'); }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                      isSelected 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-transparent border border-transparent hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                      {getRoleIcon(role.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[14px] font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {role.name}
                        </span>
                        <svg className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-blue-500 translate-x-0.5' : 'text-transparent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <p className={`text-[12px] mt-0.5 line-clamp-2 ${isSelected ? 'text-blue-700/80' : 'text-slate-500'}`}>
                        {role.description}
                      </p>
                      <p className={`text-[11px] font-medium mt-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        Assigned users: {userCount}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider">Custom Roles</h3>
            </div>
            <div className="p-2 space-y-1">
              {customRoles.length > 0 ? (
                customRoles.map(role => {
                  const userCount = getRoleUserCount(role.id);
                  const isSelected = selectedRoleId === role.id;
                  return (
                    <button
                      key={role.id}
                      onClick={() => { setSelectedRoleId(role.id); setActiveTab('permissions'); }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                        isSelected 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-transparent border border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                        {getRoleIcon(role.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[14px] font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                            {role.name}
                          </span>
                          <svg className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-blue-500 translate-x-0.5' : 'text-transparent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <p className={`text-[12px] mt-0.5 line-clamp-2 ${isSelected ? 'text-blue-700/80' : 'text-slate-500'}`}>
                          {role.description}
                        </p>
                        <p className={`text-[11px] font-medium mt-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                          Assigned users: {userCount}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center">
                  <p className="text-[13px] text-slate-500 mb-1">No custom roles yet</p>
                  <p className="text-[12px] text-slate-400">Roles can be customized directly in the code configuration.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-[13px] font-bold text-slate-700">Role Hierarchy</h4>
            </div>
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Super Admin has full access and can manage administrative roles. Sub-roles are restricted via granular permissions. Disabling &apos;View&apos; automatically disables editing actions for that module.
            </p>
          </div>
        </div>

        {/* Right Side: Role Details & Permissions */}
        <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {selectedRole ? (
            <>
              {/* Role Info Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{selectedRole.name}</h2>
                      {selectedRole.isSystem && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200">
                          System Role
                        </span>
                      )}
                    </div>
                    <p className="text-[14px] text-slate-500">{selectedRole.description}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 mt-6 border-b border-slate-200">
                  <button 
                    onClick={() => setActiveTab('permissions')}
                    className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'permissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    Permissions
                  </button>
                  <button 
                    onClick={() => setActiveTab('details')}
                    className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    Role Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`pb-3 text-[14px] font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                  >
                    Assigned Users
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 bg-white">
                
                {/* PERMISSIONS TAB */}
                {activeTab === 'permissions' && (
                  <div className="w-full">
                    <div className="p-5 flex items-center justify-between bg-white border-b border-slate-100">
                      <div>
                        <h3 className="text-[15px] font-bold text-slate-900">Module Permissions</h3>
                        <p className="text-[13px] text-slate-500 mt-0.5">Configure what this role can do in each module.</p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                          <tr>
                            <th className="sticky left-0 bg-slate-50 p-4 border-b border-slate-200 text-[12px] font-bold text-slate-500 uppercase tracking-wider w-80 z-10">Module</th>
                            {ALL_ACTIONS.map(action => (
                              <th key={action} className="p-4 bg-slate-50 border-b border-slate-200 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-center">
                                {action}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {MODULE_DEFINITIONS.map((module) => {
                            const modulePerms = selectedRole.permissions[module.name] || [];
                            const canView = modulePerms.includes('view');

                            return (
                              <tr key={module.name} className="hover:bg-slate-50/50 transition-colors">
                                <td className="sticky left-0 bg-white group-hover:bg-slate-50/50 p-4 w-80 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                  <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-slate-400">
                                      {module.icon}
                                    </div>
                                    <div>
                                      <p className="text-[14px] font-semibold text-slate-900">{module.name}</p>
                                      <p className="text-[12px] text-slate-500 mt-0.5">{module.description}</p>
                                    </div>
                                  </div>
                                </td>
                                {ALL_ACTIONS.map(action => {
                                  const isChecked = modulePerms.includes(action);
                                  
                                  // Dependent checks (can only edit/create/delete if view is enabled)
                                  const isDisabled = (!canEdit) || (action !== 'view' && !canView);

                                  return (
                                    <td key={action} className="p-4 text-center align-middle">
                                      <button
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleTogglePermission(module.name, action)}
                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:cursor-not-allowed ${
                                          isChecked ? 'bg-blue-600' : 'bg-slate-200'
                                        } ${isDisabled && !isChecked ? 'opacity-50' : ''}`}
                                      >
                                        <span
                                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                            isChecked ? 'translate-x-1.5' : '-translate-x-1.5'
                                          }`}
                                        />
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="p-6">
                    <div className="max-w-2xl bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
                      <div>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Name</p>
                        <p className="text-[15px] font-semibold text-slate-900">{selectedRole.name}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-[14px] text-slate-700 leading-relaxed">{selectedRole.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                        <div>
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Type</p>
                          <p className="text-[14px] font-medium text-slate-900">{selectedRole.isSystem ? 'System Managed' : 'Custom Role'}</p>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enabled Permissions</p>
                          <p className="text-[14px] font-medium text-slate-900">
                            {Object.values(selectedRole.permissions).reduce((sum, perms) => sum + (perms ? perms.length : 0), 0)} actions allowed
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modules Accessed</p>
                          <p className="text-[14px] font-medium text-slate-900">
                            {Object.values(selectedRole.permissions).filter(perms => perms && perms.length > 0).length} modules
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned Users</p>
                          <p className="text-[14px] font-medium text-slate-900">{getRoleUserCount(selectedRole.id)} admins</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                  <div className="p-0">
                    {admins.filter(a => a.roleId === selectedRole.id).length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {admins.filter(a => a.roleId === selectedRole.id).map(admin => {
                          const getInitials = (name: string) => {
                            const parts = name.split(' ');
                            return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
                          };
                          const getAvatarColor = (name: string) => {
                            const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-pink-100 text-pink-700"];
                            let sum = 0;
                            for(let i=0; i<name.length; i++) sum += name.charCodeAt(i);
                            return colors[sum % colors.length];
                          };

                          return (
                            <div key={admin.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${getAvatarColor(admin.name)}`}>
                                  {getInitials(admin.name)}
                                </div>
                                <div>
                                  <p className="text-[14px] font-semibold text-slate-900">{admin.name}</p>
                                  <p className="text-[13px] text-slate-500">{admin.email}</p>
                                </div>
                              </div>
                              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-semibold border ${
                                admin.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {admin.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-16 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <h3 className="text-[15px] font-bold text-slate-900 mb-1">No users assigned</h3>
                        <p className="text-[14px] text-slate-500">There are currently no administrators assigned to this role.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 p-16 flex flex-col items-center justify-center text-center bg-slate-50/50">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Role Selected</h3>
              <p className="text-[14px] text-slate-500 max-w-sm">Select a role from the sidebar to view and manage its permissions, details, and assigned users.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
