"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import type { Appointment } from "@/types/appointment";

export function AdminAppointmentsClient() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const appointments = useAppSelector((state) => state.appointments.appointments);

  const [searchTerm, setSearchTerm] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    setIsClient(true); // eslint-disable-line
    const timer = setTimeout(() => {
      setIsLoading(false); // eslint-disable-line
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const doctors = useMemo(() => {
    const docSet = new Set(appointments.map(a => a.clinician));
    return Array.from(docSet).map(d => ({ label: d, value: d }));
  }, [appointments]);

  const patients = useMemo(() => {
    const patSet = new Set(appointments.map(a => a.patient.name));
    return Array.from(patSet).map(p => ({ label: p, value: p }));
  }, [appointments]);

  // Derived Summary KPIs
  const summary = useMemo(() => {
    const total = appointments.length;
    let confirmed = 0;
    let rescheduled = 0;
    let cancelled = 0;

    appointments.forEach(apt => {
      if (apt.status === 'confirmed' || apt.status === 'completed') confirmed++;
      if (apt.rescheduledFrom) rescheduled++;
      if (apt.status === 'cancelled') cancelled++;
    });

    return { total, confirmed, rescheduled, cancelled };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchSearch = 
        apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clinician.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.patientInfo?.email && apt.patientInfo.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchDoctor = doctorFilter === "all" || apt.clinician === doctorFilter;
      const matchPatient = patientFilter === "all" || apt.patient.name === patientFilter;
      const matchStatus = statusFilter === "all" || (statusFilter === "rescheduled" ? !!apt.rescheduledFrom : apt.status === statusFilter);
      const matchType = typeFilter === "all" || (apt.consultationType ? apt.consultationType === typeFilter : typeFilter === "in-person");
      
      return matchSearch && matchDoctor && matchPatient && matchStatus && matchType;
    }).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointments, searchTerm, doctorFilter, patientFilter, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedAppointments = filteredAppointments.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setDoctorFilter("all");
    setPatientFilter("all");
    setStatusFilter("all");
    setTypeFilter("all");
    setCurrentPage(1);
  };

  if (!isClient || isLoading) return <AdminPageSkeleton />;

  const columns: AdminTableColumn<Appointment>[] = [
    {
      key: "patient",
      title: "Patient",
      render: (apt) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[14px] border border-blue-100 shrink-0">
            {apt.patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{apt.patient.name}</span>
            <span className="text-[13px] text-slate-500">{apt.patientInfo?.email || "No email"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "doctor",
      title: "Doctor",
      render: (apt) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{apt.clinician}</span>
          <span className="text-[13px] text-slate-500">{apt.specialty}</span>
        </div>
      ),
    },
    {
      key: "datetime",
      title: "Date & Time",
      render: (apt) => {
        const d = new Date(apt.startsAt);
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-[13px] text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      },
    },
    {
      key: "type",
      title: "Type",
      render: (apt) => (
        <span className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider ${
          apt.consultationType === "online" 
            ? "bg-blue-50 text-blue-700 border border-blue-100" 
            : "bg-purple-50 text-purple-700 border border-purple-100"
        }`}>
          {apt.consultationType === "online" ? "Online" : "In-person"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (apt) => <AdminStatusBadge status={apt.rescheduledFrom ? "rescheduled" : apt.status} />,
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (apt) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedAppointment(apt)}
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
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header Area */}
      <div className="flex flex-col justify-between items-start gap-2">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>/</span>
          <span className="text-slate-900 font-medium">Appointments</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointments</h1>
        <p className="text-[15px] text-slate-500">Manage and review all scheduled appointments.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Appointments", value: summary.total, sub: "All scheduled appointments", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "blue" },
          { label: "Confirmed", value: summary.confirmed, sub: "Successfully scheduled", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Rescheduled", value: summary.rescheduled, sub: "Moved to a new time", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "purple" },
          { label: "Cancelled", value: summary.cancelled, sub: "Appointments cancelled", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "red" },
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
        <div className="flex flex-col 2xl:flex-row gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search by patient, email, or doctor..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Doctor</span>
              <div className="w-full sm:w-[150px]">
                <AdminFilter
                  options={[{ label: "All Doctors", value: "all" }, ...doctors]}
                  value={doctorFilter}
                  onChange={(val) => { setDoctorFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Patient</span>
              <div className="w-full sm:w-[150px]">
                <AdminFilter
                  options={[{ label: "All Patients", value: "all" }, ...patients]}
                  value={patientFilter}
                  onChange={(val) => { setPatientFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Type</span>
              <div className="w-full sm:w-[130px]">
                <AdminFilter
                  options={[
                    { label: "All Types", value: "all" },
                    { label: "Online", value: "online" },
                    { label: "In-person", value: "in-person" },
                  ]}
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Status</span>
              <div className="w-full sm:w-[140px]">
                <AdminFilter
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "Confirmed", value: "confirmed" },
                    { label: "Rescheduled", value: "rescheduled" },
                    { label: "Cancelled", value: "cancelled" },
                  ]}
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                />
              </div>
            </div>
            <div className="flex flex-col self-end">
              <div className="flex items-center gap-2 h-11">
                <button 
                  onClick={handleReset}
                  className="h-full px-4 flex items-center justify-center text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Reset
                </button>
                <button 
                  onClick={() => { /* Instantaneous filters, so just superficial apply */ }}
                  className="h-full px-5 flex items-center justify-center text-[14px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Appointment List</h2>
              <p className="text-sm text-slate-500">View and manage all scheduled appointments.</p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[13px] font-medium text-slate-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>

        {/* Table Content */}
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredAppointments.length > 0 ? (
              <>
                <AdminTable data={paginatedAppointments} columns={columns} keyExtractor={(p) => p.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredAppointments.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
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
                  title="No appointments found"
                  description="Try adjusting your filters or search criteria."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  action={
                    (searchTerm || doctorFilter !== 'all' || patientFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all') ? (
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

      {/* Appointment Details Modal */}
      <AdminModal
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            
            {/* Modal Header Profile */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-lg border border-blue-200 shrink-0">
                  {selectedAppointment.patient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedAppointment.patient.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    {selectedAppointment.patientInfo?.email && (
                      <span className="text-[13px] text-slate-500 font-medium">{selectedAppointment.patientInfo.email}</span>
                    )}
                    {selectedAppointment.patientInfo?.phone && (
                      <span className="text-[13px] text-slate-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedAppointment.patientInfo.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <AdminStatusBadge status={selectedAppointment.rescheduledFrom ? "rescheduled" : selectedAppointment.status} />
                <span className="text-[11px] text-slate-400 font-mono tracking-wider">ID: {selectedAppointment.id.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>

            {/* Warning Banners */}
            {selectedAppointment.rescheduledFrom && (
              <div className="bg-purple-50 flex gap-3 p-4 rounded-xl border border-purple-100 text-[14px]">
                <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-purple-900 mb-0.5">Rescheduled Appointment</p>
                  <p className="text-purple-700">Originally scheduled for: {new Date(selectedAppointment.rescheduledFrom).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            )}
            
            {selectedAppointment.status === "cancelled" && selectedAppointment.cancelledAt && (
              <div className="bg-red-50 flex gap-3 p-4 rounded-xl border border-red-100 text-[14px]">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-900 mb-0.5">Cancelled Appointment</p>
                  <p className="text-red-700">Cancelled on: {new Date(selectedAppointment.cancelledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              {/* Doctor & Schedule Block */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Doctor</span>
                  <p className="font-semibold text-slate-900 text-[14px]">{selectedAppointment.clinician}</p>
                  <p className="text-slate-500 text-[13px]">{selectedAppointment.specialty}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Schedule</span>
                  <p className="font-semibold text-slate-900 text-[14px]">{new Date(selectedAppointment.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-slate-500 text-[13px]">{new Date(selectedAppointment.startsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.durationMinutes} min)</p>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="md:col-span-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Consultation Details</h4>
                <div className="grid grid-cols-2 gap-4 text-[14px]">
                  <div>
                    <p className="text-slate-500 mb-0.5">Consultation Type</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                      selectedAppointment.consultationType === "online" 
                        ? "bg-blue-50 text-blue-700 border border-blue-100" 
                        : "bg-purple-50 text-purple-700 border border-purple-100"
                    }`}>
                      {selectedAppointment.consultationType === "online" ? "Online" : "In-person"}
                    </span>
                  </div>
                  {selectedAppointment.room && (
                    <div>
                      <p className="text-slate-500 mb-0.5">Room / Link</p>
                      <p className="font-medium text-slate-900">{selectedAppointment.room}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500 mb-0.5">Payment Status</p>
                    <p className="font-medium text-slate-900 capitalize">{selectedAppointment.paymentStatus || "Unknown"}</p>
                  </div>
                  {selectedAppointment.consultationFee !== undefined && (
                    <div>
                      <p className="text-slate-500 mb-0.5">Fee</p>
                      <p className="font-medium text-slate-900">${selectedAppointment.consultationFee}</p>
                    </div>
                  )}
                  <div className="col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100 mt-2">
                    <p className="text-slate-500 mb-1">Reason for Visit</p>
                    <p className="font-medium text-slate-900">{selectedAppointment.reason || "Not specified"}</p>
                  </div>
                </div>
              </div>
              
              {/* Intake Medical Info */}
              {selectedAppointment.medicalInfo && (
                <div className="md:col-span-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Intake Medical Info</h4>
                  <div className="space-y-3 text-[14px]">
                    {selectedAppointment.medicalInfo.symptoms && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-24 shrink-0 font-medium">Symptoms:</span>
                        <span className="text-slate-900">{selectedAppointment.medicalInfo.symptoms}</span>
                      </div>
                    )}
                    {selectedAppointment.medicalInfo.allergies && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-24 shrink-0 font-medium">Allergies:</span>
                        <span className="text-slate-900">{selectedAppointment.medicalInfo.allergies}</span>
                      </div>
                    )}
                    {selectedAppointment.medicalInfo.medicalConditions && (
                      <div className="flex gap-2">
                        <span className="text-slate-500 w-24 shrink-0 font-medium">Conditions:</span>
                        <span className="text-slate-900">{selectedAppointment.medicalInfo.medicalConditions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-5 flex justify-end">
              <button
                onClick={() => setSelectedAppointment(null)}
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
