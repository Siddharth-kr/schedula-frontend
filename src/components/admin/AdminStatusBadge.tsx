import React from "react";

export type AdminStatus = 
  | "pending" 
  | "confirmed" 
  | "upcoming" 
  | "completed" 
  | "cancelled" 
  | "missed" 
  | "verified" 
  | "rejected" 
  | "active" 
  | "inactive"
  | string;

interface AdminStatusBadgeProps {
  status: AdminStatus;
  className?: string;
}

export function AdminStatusBadge({ status, className = "" }: AdminStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    confirmed: "bg-teal-50 text-teal-700 ring-teal-600/20",
    upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-error/10 text-error ring-error/20",
    rejected: "bg-error/10 text-error ring-error/20",
    failed: "bg-error/10 text-error ring-error/20",
    reported: "bg-error/10 text-error ring-error/20",
    missed: "bg-slate-100 text-slate-600 ring-slate-500/20",
    inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
    rescheduled: "bg-purple-50 text-purple-700 ring-purple-600/20",
    refunded: "bg-purple-50 text-purple-700 ring-purple-600/20",
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    sent: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };
  
  const style = styles[normalizedStatus] || "bg-slate-50 text-slate-600 ring-slate-500/20";
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${style} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}
