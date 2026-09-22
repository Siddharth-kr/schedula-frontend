"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addNotification } from "@/store/slices/notificationSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { toast } from "react-toastify";
import type { AdminNotification, NotificationAudience } from "@/types/notification";
import { mockUsers } from "@/lib/mock-data/users";

export function AdminNotificationsClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const notifications = useAppSelector((state) => state.notifications.notifications);
  const doctors = useAppSelector((state) => state.doctors.doctors);
  
  const [searchTerm, setSearchTerm] = useState("");
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesSearch = 
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.audience.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, searchTerm]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
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

  const columns: AdminTableColumn<AdminNotification>[] = useMemo(() => [
    {
      key: "title",
      title: "Title",
      render: (notif) => <span className="font-medium text-slate-900">{notif.title}</span>,
    },
    {
      key: "message",
      title: "Message",
      render: (notif) => (
        <span className="text-slate-300 truncate max-w-[200px] block">
          {notif.message}
        </span>
      ),
    },
    {
      key: "audience",
      title: "Audience",
      render: (notif) => (
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
          {notif.audience}
        </span>
      ),
    },
    {
      key: "sentDate",
      title: "Sent Date",
      render: (notif) => (
        <span className="text-slate-300">
          {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: '2-digit', minute:'2-digit' })}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (notif) => (
        <AdminStatusBadge 
          status={notif.status} 
        />
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (notif) => (
        <button
          onClick={() => setSelectedNotification(notif)}
          className="text-sm font-medium text-blue-300 hover:text-blue-800"
        >
          View Details
        </button>
      ),
    },
  ], []);

  if (!isClient || isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Notifications</h1>
          <p className="text-slate-500 mt-1">Manage and send alerts to patients and doctors.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-300 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          Create Notification
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <div className="mb-6 max-w-md">
          <AdminSearch 
            placeholder="Search notifications..." 
            value={searchTerm} 
            onChange={setSearchTerm} 
          />
        </div>

        {filteredNotifications.length > 0 ? (
          <>
            <AdminTable data={paginatedNotifications} columns={columns} keyExtractor={(notif) => notif.id} />
            <div className="mt-6">
              <AdminPagination
                currentPage={validCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <AdminEmptyState
            title="No notifications yet"
            description="You haven't sent any system notifications."
            icon={
              <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        )}
      </div>

      {/* Create Notification Modal */}
      <AdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Notification"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300/20"
              placeholder="e.g. System Maintenance"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300/20 min-h-[100px] resize-y"
              placeholder="Enter your message here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
            <select 
              value={newAudience}
              onChange={(e) => setNewAudience(e.target.value as NotificationAudience)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300/20"
            >
              <option value="All Patients">All Patients</option>
              <option value="All Doctors">All Doctors</option>
              <option value="Selected Users">Selected Users</option>
            </select>
          </div>

          {newAudience === "Selected Users" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Users</label>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300/20"
                  placeholder="Search by name..."
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
                        className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                      >
                        <span className="text-sm font-medium text-slate-900">{u.name}</span>
                        <span className="text-xs text-slate-500">{u.role}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedUserIds.map(id => {
                    const user = allAvailableUsers.find(u => u.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {user?.name || id}
                        <button 
                          onClick={() => setSelectedUserIds(selectedUserIds.filter(uid => uid !== id))}
                          className="hover:text-blue-900 ml-1"
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

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendNotification}
              className="px-4 py-2 bg-blue-300 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
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
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-bold text-slate-900">{selectedNotification.title}</h3>
              <AdminStatusBadge 
                status={selectedNotification.status} 
              />
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-slate-700 text-sm whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Audience</p>
                <p className="font-medium text-slate-900">{selectedNotification.audience}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Sent Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedNotification.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: '2-digit', minute:'2-digit' })}
                </p>
              </div>
            </div>

            {selectedNotification.audience === "Selected Users" && selectedNotification.selectedUserIds && (
              <div>
                <p className="text-slate-500 text-sm mb-2">Recipients ({selectedNotification.selectedUserIds.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNotification.selectedUserIds.map(id => {
                    const user = allAvailableUsers.find(u => u.id === id);
                    return (
                      <span key={id} className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200">
                        {user?.name || id}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
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
