"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addNotification } from "@/store/slices/notificationSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { usePermissions } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { AdminNotification, NotificationAudience } from "@/types/notification";
import { mockUsers } from "@/lib/mock-data/users";

export function AdminNotificationsClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('Notifications', 'create');
  
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const doctors = useAppSelector((state) => state.doctors.doctors);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newAudience, setNewAudience] = useState<NotificationAudience>("All Patients");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  useEffect(() => {
    setIsClient(true); // eslint-disable-line
    const timer = setTimeout(() => {
      setIsLoading(false); // eslint-disable-line
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const summary = useMemo(() => {
    const total = notifications.length;
    let sent = 0;
    let scheduled = 0;
    let failed = 0;

    notifications.forEach(notif => {
      const stat = notif.status as string;
      if (stat === "Sent") sent++;
      else if (stat === "Scheduled") scheduled++;
      else if (stat === "Failed") failed++;
    });

    return { total, sent, scheduled, failed };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesSearch = 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.audience.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAudience = audienceFilter === "all" || notif.audience === audienceFilter;
      const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
      
      return matchesSearch && matchesAudience && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, searchTerm, audienceFilter, statusFilter]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedNotifications = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, validCurrentPage, itemsPerPage]);

  const allAvailableUsers = useMemo(() => {
    const users = Object.values(mockUsers).map(u => ({ id: u.id, name: u.name, role: 'Patient' }));
    const docs = doctors.map(d => ({ id: d.id, name: d.name, role: 'Doctor' }));
    return [...users, ...docs];
  }, [doctors]);

  const filteredUserSearch = useMemo(() => {
    if (!userSearchTerm) return [];
    return allAvailableUsers.filter(u => 
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) && 
      !selectedUserIds.includes(u.id)
    ).slice(0, 5);
  }, [allAvailableUsers, userSearchTerm, selectedUserIds]);

  const handleSendNotification = () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a notification title");
      return;
    }
    if (!newMessage.trim()) {
      toast.error("Please enter a notification message");
      return;
    }
    if (newAudience === "Selected Users" && selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    const newNotification: AdminNotification = {
      id: `notif-${Date.now()}`,
      title: newTitle,
      message: newMessage,
      audience: newAudience,
      selectedUserIds: newAudience === "Selected Users" ? selectedUserIds : undefined,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: "Sent"
    };

    dispatch(addNotification(newNotification));
    toast.success("Notification sent successfully");
    
    setIsCreateModalOpen(false);
    setNewTitle("");
    setNewMessage("");
    setNewAudience("All Patients");
    setSelectedUserIds([]);
    setUserSearchTerm("");
  };

  const handleReset = () => {
    setSearchTerm("");
    setAudienceFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const columns: AdminTableColumn<AdminNotification>[] = useMemo(() => [
    {
      key: "title",
      title: "Notification",
      render: (notif) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            {notif.title.toLowerCase().includes('maintenance') ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : notif.title.toLowerCase().includes('video') ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            )}
          </div>
          <span className="font-semibold text-slate-900 text-[14px]">{notif.title}</span>
        </div>
      ),
    },
    {
      key: "message",
      title: "Message",
      render: (notif) => (
        <span className="text-slate-500 text-[13px] truncate max-w-[250px] lg:max-w-[300px] block">
          {notif.message}
        </span>
      ),
    },
    {
      key: "audience",
      title: "Audience",
      render: (notif) => (
        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide rounded-full border border-slate-200">
          {notif.audience}
        </span>
      ),
    },
    {
      key: "sentAt",
      title: "Sent Date",
      render: (notif) => {
        const d = new Date(notif.sentAt || notif.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900 text-[14px]">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-[13px] text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (notif) => <AdminStatusBadge status={notif.status.toLowerCase()} />,
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (notif) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedNotification(notif)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      ),
    }
  ], []);

  if (!isClient || isLoading) return <AdminPageSkeleton />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>/</span>
            <span className="text-slate-900 font-medium">Notifications</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-[15px] text-slate-500">Manage and send alerts to patients and doctors.</p>
        </div>
        {canCreate && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap text-[14px]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Notification
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Notifications", value: summary.total, sub: "All notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", color: "blue" },
          { label: "Sent", value: summary.sent, sub: "Successfully sent", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8", color: "emerald" },
          { label: "Scheduled", value: summary.scheduled, sub: "Scheduled to send", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" },
          { label: "Failed", value: summary.failed, sub: "Failed to send", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "red" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 shrink-0 border border-${stat.color}-100`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</p>
              <p className="text-[12px] text-slate-400">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full h-11 pl-10 pr-4 text-[14px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="flex flex-col w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Audience</span>
              <div className="w-full sm:w-[150px]">
                <AdminFilter
                  options={[
                    { label: "All Audiences", value: "all" },
                    { label: "All Patients", value: "All Patients" },
                    { label: "All Doctors", value: "All Doctors" },
                    { label: "Selected Users", value: "Selected Users" },
                  ]}
                  value={audienceFilter}
                  onChange={(val) => { setAudienceFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Status</span>
              <div className="w-full sm:w-[140px]">
                <AdminFilter
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "Sent", value: "Sent" },
                    { label: "Scheduled", value: "Scheduled" },
                    { label: "Failed", value: "Failed" },
                  ]}
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col self-end">
              <button 
                onClick={handleReset}
                className="h-11 px-5 flex items-center justify-center text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors w-full sm:w-auto"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-500">View and manage all system notifications sent to patients and doctors.</p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredNotifications.length > 0 ? (
              <>
                <AdminTable data={paginatedNotifications} columns={columns} keyExtractor={(p) => p.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredNotifications.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length} notifications
                  </div>
                  <AdminPagination
                    currentPage={validCurrentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            ) : (
              <div className="p-12">
                <AdminEmptyState
                  title="No notifications found"
                  description="Try adjusting your search or filter criteria."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  }
                  action={
                    (searchTerm || audienceFilter !== 'all' || statusFilter !== 'all') ? (
                      <button onClick={handleReset} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-100 transition-colors">
                        Clear filters
                      </button>
                    ) : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Notification"
      >
        <div className="space-y-5 p-1">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Notification Title</label>
            <input 
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="e.g. System Maintenance Scheduled"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Message Content</label>
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-3 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[120px] resize-y transition-all"
              placeholder="Enter your message here..."
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Target Audience</label>
            <select 
              value={newAudience}
              onChange={(e) => setNewAudience(e.target.value as NotificationAudience)}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="All Patients">All Patients</option>
              <option value="All Doctors">All Doctors</option>
              <option value="Selected Users">Selected Users</option>
            </select>
          </div>

          {newAudience === "Selected Users" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
              <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Select Users</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Search user by name..."
                />
                
                {filteredUserSearch.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredUserSearch.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => {
                          setSelectedUserIds([...selectedUserIds, u.id]);
                          setUserSearchTerm("");
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-0"
                      >
                        <span className="text-[13px] font-medium text-slate-900">{u.name}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-200">
                  {selectedUserIds.map(id => {
                    const user = allAvailableUsers.find(u => u.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg text-[12px] font-medium border border-blue-200">
                        {user?.name || id}
                        <button 
                          onClick={() => setSelectedUserIds(selectedUserIds.filter(uid => uid !== id))}
                          className="hover:text-red-600 bg-white rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-[14px] font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSendNotification}
              className="px-5 py-2.5 bg-blue-600 text-white text-[14px] font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Send Notification
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Notification Details Modal */}
      <AdminModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Notification Details"
      >
        {selectedNotification && (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-[16px] font-bold text-slate-900 leading-tight">{selectedNotification.title}</h3>
                <AdminStatusBadge status={selectedNotification.status.toLowerCase()} />
              </div>
              <p className="text-slate-700 text-[14px] leading-relaxed whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Audience</p>
                <p className="font-semibold text-slate-900 text-[14px]">{selectedNotification.audience}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sent Date</p>
                <p className="font-semibold text-slate-900 text-[14px]">
                  {new Date(selectedNotification.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(selectedNotification.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>

            {selectedNotification.audience === "Selected Users" && selectedNotification.selectedUserIds && (
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Recipients ({selectedNotification.selectedUserIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNotification.selectedUserIds.map(id => {
                    const user = allAvailableUsers.find(u => u.id === id);
                    return (
                      <span key={id} className="bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-[13px] font-medium border border-slate-200">
                        {user?.name || id}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 text-[14px] font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
