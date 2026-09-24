"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateDoctorStatus } from "@/store/slices/doctorSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminModal } from "./AdminModal";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { usePermissions } from "@/lib/permissions";
import type { Doctor } from "@/types/doctor";
import { toast } from "react-toastify";

export function AdminDoctorsClient() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(state => state.doctors.doctors);
  const [isClient, setIsClient] = useState(false);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission('Doctors', 'edit');
  const canCreate = hasPermission('Doctors', 'create');
  
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [doctorToToggle, setDoctorToToggle] = useState<Doctor | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsClient(true); }, []);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchStr) || 
        doc.specialty.toLowerCase().includes(searchStr) ||
        (doc.email && doc.email.toLowerCase().includes(searchStr));

      const matchesVerification = verificationFilter === "all" || doc.verificationStatus === verificationFilter;
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? doc.active : !doc.active);

      return matchesSearch && matchesVerification && matchesStatus;
    });
  }, [doctors, searchTerm, verificationFilter, statusFilter]);

  const totalPages = Math.ceil(filteredDoctors.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedDoctors = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, validCurrentPage, pageSize]);

  // Derive Summary Stats
  const summary = useMemo(() => {
    const total = doctors.length;
    let active = 0;
    let pending = 0;
    let inactive = 0;
    
    doctors.forEach(doc => {
      if (doc.active) active++;
      else inactive++;
      if (doc.verificationStatus === "pending") pending++;
    });
    
    return { total, active, pending, inactive };
  }, [doctors]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCurrentPage(1); }, [searchTerm, verificationFilter, statusFilter]);

  const handleToggleConfirm = () => {
    if (!doctorToToggle) return;
    dispatch(updateDoctorStatus({ id: doctorToToggle.id, active: !doctorToToggle.active }));
    toast.success(`Doctor successfully ${doctorToToggle.active ? 'deactivated' : 'activated'}.`);
    
    // Update local selectedDoctor if it's currently open
    if (selectedDoctor && selectedDoctor.id === doctorToToggle.id) {
      setSelectedDoctor({ ...selectedDoctor, active: !doctorToToggle.active });
    }
    
    setDoctorToToggle(null);
  };
  
  const handleReset = () => {
    setSearchTerm("");
    setVerificationFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const columns: AdminTableColumn<Doctor>[] = useMemo(() => [
    {
      key: "name",
      title: "Doctor",
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[14px] border border-blue-100 shrink-0">
            {doc.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{doc.name}</span>
            <span className="text-[13px] text-slate-500">{doc.email || "No email"}</span>
          </div>
        </div>
      )
    },
    { 
      key: "specialty", 
      title: "Specialty", 
      render: (doc) => <span className="text-[14px] text-slate-700 font-medium">{doc.specialty}</span> 
    },
    {
      key: "verificationStatus",
      title: "Verification",
      render: (doc) => <AdminStatusBadge status={doc.verificationStatus || "pending"} />
    },
    {
      key: "active",
      title: "Account Status",
      render: (doc) => <AdminStatusBadge status={doc.active ? "active" : "inactive"} />
    },
    {
      key: "experience",
      title: "Experience",
      render: (doc) => <span className="text-[14px] text-slate-600">{doc.experienceYears} years</span>
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (doc) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedDoctor(doc)}
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
      )
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
            <span className="text-slate-900 font-medium">Doctors</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctors</h1>
          <p className="text-[15px] text-slate-500 mt-1">Manage doctor profiles, verification status and account access.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Doctors", value: summary.total, sub: "All registered doctors", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "blue" },
          { label: "Active", value: summary.active, sub: "Currently active accounts", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Pending Verification", value: summary.pending, sub: "Awaiting verification", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" },
          { label: "Inactive", value: summary.inactive, sub: "Disabled accounts", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "red" },
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
              <p className="text-sm text-slate-500">Search and filter doctors to find specific records.</p>
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Search Doctors</label>
            <AdminSearch 
              placeholder="Search by name, email or specialty..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Verification</label>
            <AdminFilter
              options={[
                { label: "All Verifications", value: "all" },
                { label: "Approved", value: "approved" },
                { label: "Pending", value: "pending" },
                { label: "Rejected", value: "rejected" },
              ]}
              value={verificationFilter}
              onChange={setVerificationFilter}
            />
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Account Status</label>
            <AdminFilter
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 border border-slate-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Doctor Directory</h2>
              <p className="text-sm text-slate-500">Comprehensive list of all platform doctors.</p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredDoctors.length > 0 ? (
              <>
                <AdminTable data={paginatedDoctors} columns={columns} keyExtractor={(doc) => doc.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * pageSize + 1, filteredDoctors.length)} to {Math.min(validCurrentPage * pageSize, filteredDoctors.length)} of {filteredDoctors.length} doctors
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
                  title="No doctors found"
                  description="Try adjusting your filters or search criteria."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Details Modal */}
      <AdminModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Doctor Profile & Settings"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            
            {/* Modal Header Profile */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl border border-blue-200 shrink-0">
                {selectedDoctor.name.replace("Dr. ", "").charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedDoctor.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-2">{selectedDoctor.specialty}</p>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge status={selectedDoctor.verificationStatus || "pending"} />
                  <AdminStatusBadge status={selectedDoctor.active ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
              {/* Doctor Profile */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Contact Information</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Email</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.email || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Phone</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Clinic Name</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.clinic || "Not provided"}</span>
                  </div>
                </div>
              </div>
              
              {/* Professional Information */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Professional Details</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Experience</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.experienceYears} years</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Qualification</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.qualification || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Consultation Fee</span>
                    <span className="text-[14px] font-bold text-slate-900">${selectedDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Record Block */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Verification Record</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">Submitted Date</span>
                  <span className="text-[14px] font-medium text-slate-900">
                    {selectedDoctor.submittedAt ? new Date(selectedDoctor.submittedAt).toLocaleDateString() : "Not available"}
                  </span>
                </div>
              </div>
              {selectedDoctor.verificationStatus === 'rejected' && selectedDoctor.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-[13px] border border-red-100 leading-relaxed">
                  <strong className="font-semibold block mb-0.5">Reason for rejection:</strong> 
                  {selectedDoctor.rejectionReason}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              {canEdit ? (
                <button
                  onClick={() => setDoctorToToggle(selectedDoctor)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${
                    selectedDoctor.active 
                      ? "bg-white border-red-200 text-red-600 hover:bg-red-50" 
                      : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {selectedDoctor.active ? "Deactivate Account" : "Activate Account"}
                </button>
              ) : <div />}
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        )}
      </AdminModal>

      {/* Confirmation Modal */}
      <AdminModal
        isOpen={!!doctorToToggle}
        onClose={() => setDoctorToToggle(null)}
        title={doctorToToggle?.active ? "Deactivate Doctor Account" : "Activate Doctor Account"}
      >
        <div className="py-2">
          <p className="text-slate-700 text-[15px] leading-relaxed">
            Are you sure you want to <strong className={doctorToToggle?.active ? "text-red-600" : "text-emerald-600"}>{doctorToToggle?.active ? "deactivate" : "activate"}</strong> Dr. {doctorToToggle?.name}? 
          </p>
          {doctorToToggle?.active && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-800 text-[13px] leading-relaxed">
                A deactivated doctor cannot log in or receive new appointments. Their verification status will not change.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDoctorToToggle(null)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-sm ${
                doctorToToggle?.active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {doctorToToggle?.active ? "Confirm Deactivation" : "Confirm Activation"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
