"use client";

import { useEffect, useState, useRef } from "react";
import { getUserNotifications, markNotificationRead, markAllUserNotificationsRead, type AppNotification } from "@/lib/notification-store";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const loadNotifs = () => {
    setNotifications(getUserNotifications(userId));
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      loadNotifs();
    });
    const handleUpdate = () => loadNotifs();
    window.addEventListener("schedula_notifications_updated", handleUpdate);
    return () => window.removeEventListener("schedula_notifications_updated", handleUpdate);
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 rounded-full text-[var(--muted)] hover:bg-slate-100 hover:text-[var(--ink)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
        aria-label="Notifications"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-[var(--error)] text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[var(--line)] z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--line)] mb-2">
            <h3 className="font-bold text-[var(--ink)]">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllUserNotificationsRead(userId)} className="text-xs font-semibold text-[var(--brand)] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--muted)]">No notifications yet.</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-xl transition-colors ${!n.read ? 'bg-[var(--brand)]/5' : 'hover:bg-slate-50'}`}
                  onClick={() => { if (!n.read) markNotificationRead(n.id); }}
                >
                  <div className="flex items-start gap-3 cursor-pointer">
                    {!n.read && <div className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--brand)]"></div>}
                    <div className="flex-1">
                      <p className={`text-sm ${!n.read ? 'font-semibold text-[var(--ink)]' : 'text-[var(--muted)]'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-[var(--muted)] mt-1 opacity-75">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
