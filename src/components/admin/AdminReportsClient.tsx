"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addAuditLog } from "@/store/slices/auditSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminFilter } from "./AdminFilter";
import { AdminSearch } from "./AdminSearch";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminModal } from "./AdminModal";
import { toast } from "react-toastify";
import type { Appointment } from "@/types/appointment";

// For Exports
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function AdminReportsClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  
  const appointments = useAppSelector(state => state.appointments.appointments);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  const filteredData = useMemo(() => {
    return appointments.filter(apt => {
      // Date filter
      const aptDate = new Date(apt.startsAt).toISOString().split('T')[0];
      if (dateFrom && aptDate < dateFrom) return false;
      if (dateTo && aptDate > dateTo) return false;

      // Type
      if (typeFilter !== "all" && apt.consultationType !== typeFilter) return false;
      
      // Status
      if (statusFilter !== "all" && apt.status !== statusFilter) return false;

      // Payment
      if (paymentFilter !== "all" && (apt.paymentStatus || "pending") !== paymentFilter) return false;

      // Search (Patient, Doctor, ID)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const patientMatch = apt.patient.name.toLowerCase().includes(term);
        const doctorMatch = apt.clinician.toLowerCase().includes(term);
        const idMatch = apt.id.toLowerCase().includes(term);
        if (!patientMatch && !doctorMatch && !idMatch) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointments, dateFrom, dateTo, typeFilter, statusFilter, paymentFilter, searchTerm]);

  const summary = useMemo(() => {
    let completed = 0;
    let cancelled = 0;
    let online = 0;
    let inPerson = 0;
    let revenue = 0;
    let refunded = 0;

    filteredData.forEach(apt => {
      if (apt.status === "completed") completed++;
      if (apt.status === "cancelled") cancelled++;
      if (apt.consultationType === "online") online++;
      else inPerson++;
      if (apt.paymentStatus === "paid") revenue += (apt.consultationFee || 0);
      if (apt.paymentStatus === "refunded") refunded += (apt.consultationFee || 0);
    });

    return { total: filteredData.length, completed, cancelled, online, inPerson, revenue, refunded };
  }, [filteredData]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, validCurrentPage, rowsPerPage]);

  const handleReset = () => {
    setDateFrom("");
    setDateTo("");
    setTypeFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const getExportData = () => {
    return filteredData.map(apt => ({
      ID: apt.id,
      Date: new Date(apt.startsAt).toLocaleDateString(),
      Patient: apt.patient.name,
      Doctor: apt.clinician,
      Type: apt.consultationType === "online" ? "Online" : "In-person",
      Status: apt.status.toUpperCase(),
      Payment: apt.paymentStatus ? apt.paymentStatus.toUpperCase() : "PENDING",
      Amount: apt.consultationFee ? `$${apt.consultationFee}` : "$0"
    }));
  };

  const logExport = (format: string) => {
    dispatch(addAuditLog({
      admin: "Schedula Admin",
      action: "Report generated",
      entity: `${format.toUpperCase()} Report`,
      details: `Generated ${format.toUpperCase()} report with ${filteredData.length} records.`
    }));
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const exportCSV = () => {
    const data = getExportData();
    if (!data.length) return toast.info("No data to export");
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(","));
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `schedula_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logExport("CSV");
  };

  const exportExcel = () => {
    const data = getExportData();
    if (!data.length) return toast.info("No data to export");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `schedula_report_${new Date().getTime()}.xlsx`);
    logExport("Excel");
  };

  const exportPDF = () => {
    const data = getExportData();
    if (!data.length) return toast.info("No data to export");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Schedula Platform Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [Object.keys(data[0])],
      body: data.map(obj => Object.values(obj).map(v => String(v))),
    });
    doc.save(`schedula_report_${new Date().getTime()}.pdf`);
    logExport("PDF");
  };

  const columns: AdminTableColumn<Appointment>[] = useMemo(() => [
    {
      key: "datetime",
      title: "Date & Time",
      render: (apt) => {
        const d = new Date(apt.startsAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-sm text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      key: "patient",
      title: "Patient",
      render: (apt) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100 shrink-0">
            {apt.patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{apt.patient.name}</span>
            <span className="text-[13px] text-slate-500">{apt.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com</span>
          </div>
        </div>
      ),
    },
    {
      key: "doctor",
      title: "Doctor",
      render: (apt) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">Dr. {apt.clinician}</span>
          <span className="text-[13px] text-slate-500">{apt.specialty || "General Medicine"}</span>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (apt) => {
        const isOnline = apt.consultationType === "online";
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-medium ${isOnline ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
            {isOnline ? "Online" : "In-person"}
          </span>
        );
      },
    },
    {
      key: "status",
      title: "Status",
      render: (apt) => <AdminStatusBadge status={apt.status} />,
    },
    {
      key: "payment",
      title: "Payment",
      render: (apt) => <AdminStatusBadge status={apt.paymentStatus || "pending"} />,
    },
    {
      key: "amount",
      title: "Amount",
      render: (apt) => <span className="font-semibold text-slate-900">${apt.consultationFee || 0}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      render: (apt) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedAppointment(apt)}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[13px] font-medium hover:bg-slate-50 shadow-sm transition-colors whitespace-nowrap"
          >
            View
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        </div>
      ),
    }
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
            <span className="text-slate-900 font-medium">Reports</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-[15px] text-slate-500 mt-1">Generate and export detailed platform activity reports.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Export Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 h-10 px-4 bg-blue-600 border border-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Reports Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Filter Reports</h2>
              <p className="text-sm text-slate-500">Select a date range and filters to generate your report.</p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date From</label>
            <div className="relative">
              <input 
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 border border-slate-200 text-slate-700 rounded-lg pl-3 pr-10 text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none"
              />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date To</label>
            <div className="relative">
              <input 
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 border border-slate-200 text-slate-700 rounded-lg pl-3 pr-10 text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm appearance-none"
              />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Appointment Type</label>
            <AdminFilter
              options={[
                { label: "All Types", value: "all" },
                { label: "Online", value: "online" },
                { label: "In-person", value: "in-person" },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Appointment Status</label>
            <AdminFilter
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Upcoming", value: "upcoming" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Rescheduled", value: "rescheduled" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Status</label>
            <AdminFilter
              options={[
                { label: "All Payments", value: "all" },
                { label: "Paid", value: "paid" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
              ]}
              value={paymentFilter}
              onChange={setPaymentFilter}
            />
          </div>
          <div className="w-full flex items-end">
            <button 
              onClick={() => setCurrentPage(1)} // State changes automatically trigger useMemo, but good for UX intent
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Total Appointments", value: summary.total, icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "blue" },
          { label: "Completed", value: summary.completed, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Cancelled", value: summary.cancelled, icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "red" },
          { label: "Online", value: summary.online, icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", color: "blue" },
          { label: "In-person", value: summary.inPerson, icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", color: "purple" },
          { label: "Total Revenue", value: `$${summary.revenue.toLocaleString()}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Refunded", value: `$${summary.refunded.toLocaleString()}`, icon: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6", color: "slate" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col justify-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</p>
              <p className="text-[13px] font-medium text-slate-500 leading-tight">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Report Data Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Card Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Appointment Report</h2>
              <p className="text-sm text-slate-500">Detailed list of appointments based on selected filters.</p>
            </div>
          </div>
          <div className="w-full lg:w-72 shrink-0">
            <AdminSearch 
              placeholder="Search patient, doctor or ID..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredData.length > 0 ? (
              <>
                <AdminTable data={paginatedData} columns={columns} keyExtractor={(apt) => apt.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * rowsPerPage + 1, filteredData.length)} to {Math.min(validCurrentPage * rowsPerPage, filteredData.length)} of {filteredData.length} records
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <select 
                        className="bg-white border border-slate-200 rounded-md text-slate-700 py-1 pl-2 pr-6 outline-none focus:border-blue-500 shadow-sm text-sm"
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <AdminPagination
                      currentPage={validCurrentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12">
                <AdminEmptyState
                  title="No records found"
                  description="No data matches your selected filters. Try adjusting your criteria."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      <AdminModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Appointment ID</p>
                <p className="font-mono text-sm text-slate-900">{selectedAppointment.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Date & Time</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedAppointment.startsAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Patient</p>
                <p className="font-medium text-slate-900">{selectedAppointment.patient.name}</p>
                <p className="text-sm text-slate-500">{selectedAppointment.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Doctor</p>
                <p className="font-medium text-slate-900">Dr. {selectedAppointment.clinician}</p>
                <p className="text-sm text-slate-500">{selectedAppointment.specialty || "General Medicine"}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Type</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[13px] font-medium ${selectedAppointment.consultationType === "online" ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                  {selectedAppointment.consultationType === "online" ? "Online" : "In-person"}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Status</p>
                <AdminStatusBadge status={selectedAppointment.status} />
              </div>
              
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Payment</p>
                <AdminStatusBadge status={selectedAppointment.paymentStatus || "pending"} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Amount</p>
                <p className="font-bold text-slate-900 text-lg">${selectedAppointment.consultationFee || 0}</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
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
