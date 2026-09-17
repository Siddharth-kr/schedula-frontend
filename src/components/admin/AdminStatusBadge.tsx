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
    confirmed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    verified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    cancelled: "bg-error/10 text-error ring-error/20",
    rejected: "bg-error/10 text-error ring-error/20",
    missed: "bg-stone-100 text-stone-600 ring-stone-500/20",
    inactive: "bg-stone-100 text-stone-600 ring-stone-500/20",
  };
  
  const style = styles[normalizedStatus] || "bg-stone-50 text-stone-600 ring-stone-500/20";
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ring-1 ring-inset ${style} ${className}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}
