"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { toast } from "react-toastify";
import type { AuditLog } from "@/store/slices/auditSlice";

export function AdminAuditLogsClient() {
  const [isClient, setIsClient] = useState(false);
  
  const logs = useAppSelector(state => state.audit.logs);

  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(l => l.action))), [logs]);
  const uniqueUsers = useMemo(() => Array.from(new Set(logs.map(l => l.admin))), [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesUser = userFilter === "all" || log.admin === userFilter;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const now = new Date();
        const logDate = new Date(log.createdAt);
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (dateFilter === "today" && diffDays > 1) matchesDate = false;
        if (dateFilter === "7days" && diffDays > 7) matchesDate = false;
        if (dateFilter === "30days" && diffDays > 30) matchesDate = false;
      }
      
      return matchesSearch && matchesAction && matchesUser && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [logs, searchTerm, actionFilter, userFilter, dateFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedLogs = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, validCurrentPage, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm("");
    setActionFilter("all");
    setUserFilter("all");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const exportLogs = () => {
    toast.success("Logs exported successfully.");
  };

  // Derived Summary Stats
  const summary = useMemo(() => {
    const total = logs.length;
    let system = 0;
    let security = 0;

    logs.forEach(log => {
      if (log.admin.toLowerCase().includes("system") || log.entity.toLowerCase().includes("system")) system++;
      const act = log.action.toLowerCase();
      if (act.includes("login") || act.includes("logout") || act.includes("auth") || act.includes("password")) {
        security++;
      }
    });

    const adminActions = total - system;

    return { total, adminActions, system, security };
  }, [logs]);

  // Helper for Category determination based on action/entity
  const getCategoryAndColor = (action: string, entity: string) => {
    const str = `${action} ${entity}`.toLowerCase();
    if (str.includes("report")) return { label: "Reports", bg: "bg-blue-50", text: "text-blue-700" };
    if (str.includes("login") || str.includes("auth")) return { label: "Authentication", bg: "bg-purple-50", text: "text-purple-700" };
    if (str.includes("doctor")) return { label: "Doctor Management", bg: "bg-green-50", text: "text-green-700" };
    if (str.includes("patient")) return { label: "Patient Management", bg: "bg-teal-50", text: "text-teal-700" };
    if (str.includes("appointment")) return { label: "Appointment Management", bg: "bg-indigo-50", text: "text-indigo-700" };
    if (str.includes("payment")) return { label: "Payments", bg: "bg-amber-50", text: "text-amber-700" };
    if (str.includes("review")) return { label: "Reviews", bg: "bg-rose-50", text: "text-rose-700" };
    return { label: "System", bg: "bg-slate-100", text: "text-slate-700" };
  };

  const columns: AdminTableColumn<AuditLog>[] = useMemo(() => [
    {
      key: "user",
      title: "User",
      render: (log) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[13px] border border-blue-100 shrink-0">
            {log.admin.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{log.admin}</span>
            <span className="text-[13px] text-slate-500">Administrator</span>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (log) => (
        <div className="flex flex-col max-w-[200px]">
          <span className="font-semibold text-slate-900">{log.action}</span>
          <span className="text-[13px] text-slate-500 truncate" title={log.details}>{log.details}</span>
        </div>
      ),
    },
    {
      key: "entity",
      title: "Affected Entity",
      render: (log) => <span className="text-[14px] text-slate-700">{log.entity}</span>,
    },
    {
      key: "category",
      title: "Category",
      render: (log) => {
        const cat = getCategoryAndColor(log.action, log.entity);
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${cat.bg} ${cat.text}`}>
            {cat.label}
          </span>
        );
      }
    },
    {
      key: "datetime",
      title: "Date & Time",
      render: (log) => {
        const d = new Date(log.createdAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-[13px] text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Details",
      render: (log) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedLog(log)}
            className="px-3 py-1.5 text-[13px] font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            View Details
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      ),
    },
  ], []);

  if (!isClient) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>/</span>
            <span className="text-slate-900 font-medium">Audit Logs</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-[15px] text-slate-500 mt-1">Track and review administrative actions across the platform.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={exportLogs} className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-slate-50 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Logs
            <svg className="w-4 h-4 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: summary.total, sub: "All time", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "blue" },
          { label: "Admin Actions", value: summary.adminActions, sub: summary.total > 0 ? `${Math.round((summary.adminActions/summary.total)*100)}% of total` : "0%", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "emerald" },
          { label: "System Actions", value: summary.system, sub: summary.total > 0 ? `${Math.round((summary.system/summary.total)*100)}% of total` : "0%", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", color: "purple" },
          { label: "Security Events", value: summary.security, sub: summary.total > 0 ? `${Math.round((summary.security/summary.total)*100)}% of total` : "0%", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "amber" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 shrink-0`}>
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

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Filters</h2>
              <p className="text-sm text-slate-500">Search and filter audit logs to find specific activities.</p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search</label>
            <AdminSearch 
              placeholder="Search by user, action or entity..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Type</label>
            <AdminFilter
              options={[
                { label: "All Actions", value: "all" },
                ...uniqueActions.map(a => ({ label: a, value: a }))
              ]}
              value={actionFilter}
              onChange={setActionFilter}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">User</label>
            <AdminFilter
              options={[
                { label: "All Users", value: "all" },
                ...uniqueUsers.map(u => ({ label: u, value: u }))
              ]}
              value={userFilter}
              onChange={setUserFilter}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time Range</label>
            <AdminFilter
              options={[
                { label: "All Time", value: "all" },
                { label: "Today", value: "today" },
                { label: "Last 7 Days", value: "7days" },
                { label: "Last 30 Days", value: "30days" },
              ]}
              value={dateFilter}
              onChange={setDateFilter}
            />
          </div>
          <div className="lg:col-span-2 flex items-end">
            <button 
              onClick={() => setCurrentPage(1)} 
              className="w-full h-10 flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Audit Log Entries</h2>
              <p className="text-sm text-slate-500">A chronological list of administrative actions.</p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredLogs.length > 0 ? (
              <>
                <AdminTable data={paginatedLogs} columns={columns} keyExtractor={(log) => log.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredLogs.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
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
                  title="No audit logs found"
                  description="Try adjusting your filters or search criteria."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <AdminModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                {selectedLog.admin.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-0.5">Performed by</p>
                <p className="text-base font-bold text-slate-900 leading-tight">{selectedLog.admin}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Action</p>
                <p className="font-medium text-slate-900">{selectedLog.action}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Category</p>
                {(() => {
                  const cat = getCategoryAndColor(selectedLog.action, selectedLog.entity);
                  return (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium ${cat.bg} ${cat.text}`}>
                      {cat.label}
                    </span>
                  );
                })()}
              </div>
              
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Affected Entity</p>
                <p className="font-medium text-slate-900">{selectedLog.entity}</p>
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Date</p>
                <p className="font-medium text-slate-900">{selectedLog.date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Time</p>
                <p className="font-medium text-slate-900">{selectedLog.time}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Log ID</p>
                <p className="text-[13px] font-mono text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">{selectedLog.id}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-2">Description</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-[14px] text-slate-700 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
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
