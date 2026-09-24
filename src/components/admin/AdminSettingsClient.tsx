"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateAdminUser, updateSettings, updatePreferences } from "@/store/slices/adminSlice";
import { loginAdmin } from "@/store/slices/authSlice";
import { addAuditLog } from "@/store/slices/auditSlice";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { usePermissions } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { AdminNotificationPreferences, PlatformSettings } from "@/types/admin";

type Tab = 'profile' | 'security' | 'notifications' | 'platform';

export function AdminSettingsClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  
  const currentUser = useAppSelector((state) => state.auth.admin);
  const { admins, roles, settings, preferences } = useAppSelector((state) => state.adminState);
  
  const currentAdminData = admins.find(a => a.email === currentUser?.email);
  const currentRole = roles.find(r => r.id === currentAdminData?.roleId);

  const { hasPermission } = usePermissions();
  const canEditSettings = hasPermission('Settings', 'edit');

  // Form states
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [platformData, setPlatformData] = useState<PlatformSettings>(settings);
  const [notifData, setNotifData] = useState<AdminNotificationPreferences>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsClient(true); // eslint-disable-line
    if (currentAdminData) {
      setProfileData({ // eslint-disable-line react-hooks/set-state-in-effect
        name: currentAdminData.name,
        email: currentAdminData.email,
        phone: currentAdminData.phone || "",
      });
    }
  }, [currentAdminData]);

  // Sync settings when they change externally
  useEffect(() => {
    setPlatformData(settings); // eslint-disable-line react-hooks/set-state-in-effect
  }, [settings]);
  
  useEffect(() => {
    setNotifData(preferences); // eslint-disable-line react-hooks/set-state-in-effect
  }, [preferences]);

  if (!isClient) return <AdminPageSkeleton />;
  if (!currentAdminData) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminData) return;
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    
    const updatedAdmin = { ...currentAdminData, ...profileData };
    dispatch(updateAdminUser(updatedAdmin));
    if (currentUser) {
      dispatch(loginAdmin({ ...currentUser, name: profileData.name }));
    }
    
    dispatch(addAuditLog({
      admin: currentUser?.name || "System",
      action: "Update Profile",
      entity: "Admin Users",
      details: "Updated personal profile information."
    }));
    toast.success("Profile saved successfully");
    setIsSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(passwordData.new)) {
      toast.error("New password must contain an uppercase letter");
      return;
    }
    if (!/[a-z]/.test(passwordData.new)) {
      toast.error("New password must contain a lowercase letter");
      return;
    }
    if (!/[0-9]/.test(passwordData.new)) {
      toast.error("New password must contain a number");
      return;
    }
    if (!/[!@#$%^&*]/.test(passwordData.new)) {
      toast.error("New password must contain a special character");
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    
    setPasswordData({ current: "", new: "", confirm: "" });
    dispatch(addAuditLog({
      admin: currentUser?.name || "System",
      action: "Change Password",
      entity: "Admin Users",
      details: "Changed account password."
    }));
    toast.success("Password updated successfully");
    setIsSaving(false);
  };

  const handleUpdatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSettings) {
      toast.error("You do not have permission to edit settings");
      return;
    }
    if (!platformData.platformName.trim()) {
      toast.error("Platform name is required");
      return;
    }
    
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    
    dispatch(updateSettings(platformData));
    dispatch(addAuditLog({
      admin: currentUser?.name || "System",
      action: "Update Settings",
      entity: "Settings",
      details: "Updated global platform settings."
    }));
    toast.success("Platform settings saved successfully");
    setIsSaving(false);
  };

  const handleTogglePreference = (key: keyof AdminNotificationPreferences) => {
    const newPrefs = { ...notifData, [key]: !notifData[key] };
    setNotifData(newPrefs);
    dispatch(updatePreferences(newPrefs));
    toast.success("Preference updated");
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700"];
    let sum = 0;
    for(let i=0; i<name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // Profile dirty state check
  const hasProfileChanges = profileData.name !== currentAdminData.name || (profileData.phone || "") !== (currentAdminData.phone || "");

  // Platform settings dirty state check
  const hasPlatformChanges = JSON.stringify(platformData) !== JSON.stringify(settings);

  return (
    <div className="w-full pb-16 px-4 md:px-8 xl:px-12 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
          <span>Home</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-900 font-medium">Settings</span>
        </div>
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-[14px] text-slate-500 mt-1">Manage your profile, security, notification preferences, and platform configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 xl:gap-12 items-start">
        
        {/* Left Settings Navigation */}
        <div className="w-full md:w-[240px] shrink-0 space-y-8 flex flex-row overflow-x-auto md:overflow-visible md:flex-col pb-4 md:pb-0 hide-scrollbar border-b border-slate-200 md:border-none">
          
          <div className="min-w-fit md:min-w-0 pr-6 md:pr-0">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 hidden md:block">Account</h4>
            <div className="flex md:flex-col gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-start px-4 py-3 rounded-xl transition-all text-left min-w-[160px] md:min-w-0 ${
                  activeTab === 'profile' 
                    ? 'bg-blue-50/80 text-blue-700 shadow-[inset_2px_0_0_0_#2563eb] md:shadow-[inset_3px_0_0_0_#2563eb]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <svg className={`w-4 h-4 ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-[14px] font-bold">Profile</span>
                </div>
                <span className={`text-[12px] hidden md:block ${activeTab === 'profile' ? 'text-blue-600/70' : 'text-slate-400'}`}>Personal information</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex flex-col items-start px-4 py-3 rounded-xl transition-all text-left min-w-[160px] md:min-w-0 ${
                  activeTab === 'security' 
                    ? 'bg-blue-50/80 text-blue-700 shadow-[inset_2px_0_0_0_#2563eb] md:shadow-[inset_3px_0_0_0_#2563eb]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <svg className={`w-4 h-4 ${activeTab === 'security' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-[14px] font-bold">Security</span>
                </div>
                <span className={`text-[12px] hidden md:block ${activeTab === 'security' ? 'text-blue-600/70' : 'text-slate-400'}`}>Password and access</span>
              </button>
            </div>
          </div>

          <div className="min-w-fit md:min-w-0 pr-6 md:pr-0">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 hidden md:block">Preferences</h4>
            <div className="flex md:flex-col gap-2">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex flex-col items-start px-4 py-3 rounded-xl transition-all text-left min-w-[160px] md:min-w-0 ${
                  activeTab === 'notifications' 
                    ? 'bg-blue-50/80 text-blue-700 shadow-[inset_2px_0_0_0_#2563eb] md:shadow-[inset_3px_0_0_0_#2563eb]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <svg className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  <span className="text-[14px] font-bold">Notifications</span>
                </div>
                <span className={`text-[12px] hidden md:block ${activeTab === 'notifications' ? 'text-blue-600/70' : 'text-slate-400'}`}>Alerts & communication</span>
              </button>
            </div>
          </div>

          <div className="min-w-fit md:min-w-0 pr-6 md:pr-0">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 hidden md:block">Platform</h4>
            <div className="flex md:flex-col gap-2">
              <button
                onClick={() => setActiveTab('platform')}
                className={`flex flex-col items-start px-4 py-3 rounded-xl transition-all text-left min-w-[160px] md:min-w-0 ${
                  activeTab === 'platform' 
                    ? 'bg-blue-50/80 text-blue-700 shadow-[inset_2px_0_0_0_#2563eb] md:shadow-[inset_3px_0_0_0_#2563eb]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <svg className={`w-4 h-4 ${activeTab === 'platform' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  <span className="text-[14px] font-bold">Platform Settings</span>
                </div>
                <span className={`text-[12px] hidden md:block ${activeTab === 'platform' ? 'text-blue-600/70' : 'text-slate-400'}`}>Global defaults & modes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Main Content Workspace */}
        <div className="flex-1 w-full max-w-5xl">
          
          {/* PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Profile Overview Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shrink-0 ${getAvatarColor(currentAdminData.name)}`}>
                  {getInitials(currentAdminData.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-[20px] font-bold text-slate-900 mb-1">{currentAdminData.name}</h2>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 text-[14px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {currentAdminData.email}
                    </span>
                    <span className="hidden md:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                      {currentRole?.name || "Unknown"}
                    </span>
                    <span className="hidden md:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${currentAdminData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {currentAdminData.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100">
                  <h3 className="text-[16px] font-bold text-slate-900 mb-6 uppercase tracking-wider text-slate-400">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">Full Name</label>
                      <input 
                        type="text" required
                        value={profileData.name} 
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">Phone Number</label>
                      <input 
                        type="tel"
                        value={profileData.phone} 
                        onChange={e => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-700 mb-2">Email Address</label>
                      <input 
                        type="email" disabled
                        value={profileData.email} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-500 cursor-not-allowed opacity-70"
                      />
                      <p className="text-[12px] text-slate-400 mt-2">Email address cannot be changed for security purposes.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:px-8 md:py-5 bg-slate-50 flex items-center justify-between">
                  <div>
                    {hasProfileChanges ? (
                      <p className="text-[13px] font-medium text-amber-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        You have unsaved changes
                      </p>
                    ) : (
                      <p className="text-[13px] font-medium text-slate-500 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Profile is up to date
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {hasProfileChanges && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileData({
                            name: currentAdminData.name,
                            email: currentAdminData.email,
                            phone: currentAdminData.phone || "",
                          });
                        }}
                        className="px-5 py-2 text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSaving || !hasProfileChanges}
                      className="px-6 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${currentAdminData.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <p className="text-[15px] font-bold text-slate-900 capitalize">{currentAdminData.status}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Role</p>
                  <p className="text-[15px] font-bold text-slate-900 truncate">{currentRole?.name || "Unknown"}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Last Active</p>
                  <p className="text-[14px] font-bold text-slate-900">
                    {currentAdminData.lastActive 
                      ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(currentAdminData.lastActive))
                      : 'Just now'}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Joined</p>
                  <p className="text-[14px] font-bold text-slate-900">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(currentAdminData.createdAt))}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Change Password</h3>
                  <p className="text-[13px] text-slate-500 mb-6">Update your password to keep your account secure.</p>
                  
                  <div className="flex flex-col md:flex-row gap-8 xl:gap-12">
                    <form onSubmit={handleUpdatePassword} className="flex-1 space-y-5 max-w-sm">
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Current Password</label>
                        <input 
                          type="password" required
                          value={passwordData.current} 
                          onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">New Password</label>
                        <input 
                          type="password" required
                          value={passwordData.new} 
                          onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Confirm New Password</label>
                        <input 
                          type="password" required
                          value={passwordData.confirm} 
                          onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isSaving || !passwordData.current || !passwordData.new}
                          className="px-6 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 shadow-sm"
                        >
                          {isSaving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>

                    <div className="w-full md:w-64 shrink-0 bg-slate-50/80 rounded-xl p-5 border border-slate-100 self-start">
                      <h4 className="text-[13px] font-bold text-slate-900 mb-4">Password Requirements</h4>
                      <ul className="space-y-3">
                        <li className={`flex items-center gap-2 text-[13px] font-medium ${passwordData.new.length >= 8 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          At least 8 characters
                        </li>
                        <li className={`flex items-center gap-2 text-[13px] font-medium ${/[A-Z]/.test(passwordData.new) ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          One uppercase letter
                        </li>
                        <li className={`flex items-center gap-2 text-[13px] font-medium ${/[a-z]/.test(passwordData.new) ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          One lowercase letter
                        </li>
                        <li className={`flex items-center gap-2 text-[13px] font-medium ${/[0-9]/.test(passwordData.new) ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          One number
                        </li>
                        <li className={`flex items-center gap-2 text-[13px] font-medium ${/[!@#$%^&*]/.test(passwordData.new) ? 'text-emerald-600' : 'text-slate-500'}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          One special character
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Communication</h3>
                <p className="text-[13px] text-slate-500">Manage email delivery and critical system announcements.</p>
              </div>
              
              <div className="divide-y divide-slate-100">
                <div className="p-6 md:px-8 flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900 mb-1">Email Notifications</h4>
                    <p className="text-[13px] text-slate-500">Receive daily summary digests and important updates directly to your inbox.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${notifData.emailNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${notifData.emailNotifications ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                  </button>
                </div>

                <div className="p-6 md:px-8 flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900 mb-1">System Alerts</h4>
                    <p className="text-[13px] text-slate-500">Critical platform updates, upcoming scheduled maintenance, and feature rollouts.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('systemAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${notifData.systemAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${notifData.systemAlerts ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 border-y border-slate-100 bg-slate-50/50">
                <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Operations</h3>
                <p className="text-[13px] text-slate-500">Alerts regarding appointments, payments, and platform usage.</p>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="p-6 md:px-8 flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900 mb-1">Appointment Alerts</h4>
                    <p className="text-[13px] text-slate-500">Notifications regarding new, rescheduled, or cancelled bookings across the platform.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('appointmentAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${notifData.appointmentAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${notifData.appointmentAlerts ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                  </button>
                </div>

                <div className="p-6 md:px-8 flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-slate-900 mb-1">Payment Alerts</h4>
                    <p className="text-[13px] text-slate-500">Alerts for failed transactions, refunds, chargebacks, and payout operations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePreference('paymentAlerts')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${notifData.paymentAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${notifData.paymentAlerts ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 border-y border-slate-100 bg-slate-50/50">
                <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Security</h3>
                <p className="text-[13px] text-slate-500">Notifications for anomalous behavior and security events.</p>
              </div>

              <div className="p-6 md:px-8 flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-[15px] font-bold text-slate-900 mb-1">Security Alerts</h4>
                  <p className="text-[13px] text-slate-500">Urgent notifications for unusual login activity, role modifications, or permission changes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePreference('securityAlerts')}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none ${notifData.securityAlerts ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${notifData.securityAlerts ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                </button>
              </div>

            </div>
          )}

          {/* PLATFORM SETTINGS */}
          {activeTab === 'platform' && (
            <div className="flex flex-col xl:flex-row gap-6">
              
              <div className="flex-1 order-2 xl:order-1">
                <form onSubmit={handleUpdatePlatform} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  
                  {!canEditSettings && (
                    <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-slate-700">Read-Only Mode</p>
                      <span className="text-[12px] text-slate-500">You do not have permission to edit settings.</span>
                    </div>
                  )}

                  <div className="p-6 md:p-8 border-b border-slate-100">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Platform Identity</h3>
                    <p className="text-[13px] text-slate-500 mb-6">Global branding and primary contact information.</p>
                    
                    <div className="space-y-6 max-w-lg">
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Platform Name</label>
                        <input 
                          type="text" required disabled={!canEditSettings}
                          value={platformData.platformName} 
                          onChange={e => setPlatformData({...platformData, platformName: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[13px] font-bold text-slate-700 mb-2">Support Email</label>
                          <input 
                            type="email" required disabled={!canEditSettings}
                            value={platformData.supportEmail} 
                            onChange={e => setPlatformData({...platformData, supportEmail: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[13px] font-bold text-slate-700 mb-2">Support Phone</label>
                          <input 
                            type="tel" disabled={!canEditSettings}
                            value={platformData.supportPhone} 
                            onChange={e => setPlatformData({...platformData, supportPhone: e.target.value})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 border-b border-slate-100">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Appointment Defaults</h3>
                    <p className="text-[13px] text-slate-500 mb-6">Default values utilized for new doctors and scheduling grids.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Slot Duration</label>
                        <div className="relative">
                          <input 
                            type="number" required min="5" step="5" disabled={!canEditSettings}
                            value={platformData.defaultAppointmentDuration} 
                            onChange={e => setPlatformData({...platformData, defaultAppointmentDuration: Number(e.target.value)})}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-12 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400 pointer-events-none">min</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-700 mb-2">Consultation Fee</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-slate-400 pointer-events-none">$</span>
                          <input 
                            type="number" required min="0" step="1" disabled={!canEditSettings}
                            value={platformData.defaultConsultationFee} 
                            onChange={e => setPlatformData({...platformData, defaultConsultationFee: Number(e.target.value)})}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-slate-50/50">
                    <h3 className="text-[16px] font-bold text-slate-900 mb-1 uppercase tracking-wider text-slate-400">Platform Availability</h3>
                    <p className="text-[13px] text-slate-500 mb-6">Manage global platform access state.</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-xl border border-red-200 shadow-sm gap-4">
                      <div className="flex-1 pr-0 sm:pr-6">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          <h3 className="text-[15px] font-bold text-red-900">Maintenance Mode</h3>
                        </div>
                        <p className="text-[13px] text-red-700/80 leading-relaxed ml-7">
                          Temporarily disable patient and doctor access. Admins will retain access. 
                          Use during scheduled upgrades.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canEditSettings}
                        onClick={() => {
                          if (!canEditSettings) return;
                          const val = !platformData.maintenanceMode;
                          if (val && !window.confirm("Are you sure you want to enable Maintenance Mode? This will restrict external access immediately.")) return;
                          setPlatformData({...platformData, maintenanceMode: val});
                        }}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${platformData.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${platformData.maintenanceMode ? 'translate-x-2.5' : '-translate-x-2.5'}`} />
                      </button>
                    </div>
                  </div>

                  {canEditSettings && (
                    <div className="p-4 md:px-8 md:py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        {hasPlatformChanges ? (
                          <p className="text-[13px] font-medium text-amber-600 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            You have unsaved changes
                          </p>
                        ) : (
                          <p className="text-[13px] font-medium text-slate-500 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Settings are up to date
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        {hasPlatformChanges && (
                          <button
                            type="button"
                            onClick={() => setPlatformData(settings)}
                            className="px-5 py-2 text-[14px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={isSaving || !hasPlatformChanges}
                          className="px-6 py-2.5 bg-blue-600 text-white text-[14px] font-semibold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
                        >
                          {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Right Side Summary Panel */}
              <div className="w-full xl:w-80 shrink-0 order-1 xl:order-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
                  <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-5">Platform Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[12px] font-medium text-slate-500 mb-1">Platform Name</p>
                      <p className="text-[14px] font-bold text-slate-900">{settings.platformName}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-slate-500 mb-1">Support Contacts</p>
                      <p className="text-[14px] font-bold text-slate-900">{settings.supportEmail}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">{settings.supportPhone || 'No phone set'}</p>
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-slate-500 mb-1">Appointment Metrics</p>
                      <p className="text-[14px] font-bold text-slate-900">{settings.defaultAppointmentDuration} minutes</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">${settings.defaultConsultationFee} base fee</p>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[12px] font-medium text-slate-500 mb-1.5">System Status</p>
                      {settings.maintenanceMode ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-[12px] font-bold border border-red-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                           Maintenance Mode Active
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-emerald-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                           Systems Operational
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
