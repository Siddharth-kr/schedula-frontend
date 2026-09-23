"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { approveDoctor, rejectDoctor, resubmitVerification } from "@/store/slices/doctorSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminModal } from "./AdminModal";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import type { Doctor } from "@/types/doctor";
import { toast } from "react-toastify";

export function AdminDoctorVerificationClient() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(state => state.doctors.doctors);
  const [isClient, setIsClient] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [approveConfirm, setApproveConfirm] = useState<Doctor | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsClient(true); }, []);

  const verificationDocs = useMemo(() => {
    return doctors.filter(doc => doc.verificationStatus !== undefined);
  }, [doctors]);

  // Derived Summary Stats
  const summary = useMemo(() => {
    const total = verificationDocs.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    
    verificationDocs.forEach(doc => {
      if (doc.verificationStatus === "pending") pending++;
      else if (doc.verificationStatus === "approved") approved++;
      else if (doc.verificationStatus === "rejected") rejected++;
    });
    
    return { total, pending, approved, rejected };
  }, [verificationDocs]);

  const filteredDocs = useMemo(() => {
    return verificationDocs.filter(doc => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        doc.name.toLowerCase().includes(searchStr) || 
        doc.specialty.toLowerCase().includes(searchStr);

      const matchesStatus = statusFilter === "all" || doc.verificationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [verificationDocs, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedDocs = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, validCurrentPage, pageSize]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleApprove = () => {
    if (!approveConfirm) return;
    dispatch(approveDoctor(approveConfirm.id));
    
    import('@/store/slices/auditSlice').then(({ addAuditLog }) => {
      dispatch(addAuditLog({
        admin: "Schedula Admin",
        action: "Doctor verification approved",
        entity: `Dr. ${approveConfirm.name}`,
        details: `Approved verification request for Dr. ${approveConfirm.name} (${approveConfirm.specialty}).`
      }));
    });
    
    toast.success(`Verification for Dr. ${approveConfirm.name} has been approved.`);
    
    if (selectedDoctor && selectedDoctor.id === approveConfirm.id) {
      setSelectedDoctor({ ...selectedDoctor, verificationStatus: "approved" });
    }
    
    setApproveConfirm(null);
  };

  const handleReject = () => {
    if (!rejectConfirm) return;
    if (!rejectionReason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    
    dispatch(rejectDoctor({ id: rejectConfirm.id, reason: rejectionReason.trim() }));
    
    import('@/store/slices/auditSlice').then(({ addAuditLog }) => {
      dispatch(addAuditLog({
        admin: "Schedula Admin",
        action: "Doctor verification rejected",
        entity: `Dr. ${rejectConfirm.name}`,
        details: `Rejected verification request for Dr. ${rejectConfirm.name}. Reason: ${rejectionReason.trim()}`
      }));
    });
    
    toast.success(`Verification for Dr. ${rejectConfirm.name} rejected.`);
    
    if (selectedDoctor && selectedDoctor.id === rejectConfirm.id) {
      setSelectedDoctor({ ...selectedDoctor, verificationStatus: "rejected", rejectionReason: rejectionReason.trim() });
    }
    
    setRejectConfirm(null);
    setRejectionReason("");
  };

  const handleMockResubmit = (id: string) => {
    dispatch(resubmitVerification(id));
    toast.info("Doctor verification has been resubmitted.");
    if (selectedDoctor && selectedDoctor.id === id) {
      setSelectedDoctor({ ...selectedDoctor, verificationStatus: "pending", rejectionReason: undefined });
    }
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
      key: "submitted",
      title: "Submitted",
      render: (doc) => {
        const d = doc.submittedAt ? new Date(doc.submittedAt) : new Date();
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            {doc.submittedAt && <span className="text-[13px] text-slate-500">{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        );
      }
    },
    {
      key: "verificationStatus",
      title: "Status",
      render: (doc) => <AdminStatusBadge status={doc.verificationStatus || "pending"} />
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (doc) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedDoctor(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Review
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
      <div className="flex flex-col justify-between items-start gap-2">
        <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>/</span>
          <span className="text-slate-900 font-medium">Doctor Verification</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Verification</h1>
        <p className="text-[15px] text-slate-500">Review and approve doctor credentials and manage verification requests.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending Verification", value: summary.pending, sub: "Doctors awaiting review", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" },
          { label: "Approved", value: summary.approved, sub: "Verified doctors", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "emerald" },
          { label: "Rejected", value: summary.rejected, sub: "Rejected applications", icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "red" },
          { label: "Total Applications", value: summary.total, sub: "All time", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "blue" },
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

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">Status</span>
              <div className="w-40">
                <AdminFilter
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "Pending", value: "pending" },
                    { label: "Approved", value: "approved" },
                    { label: "Rejected", value: "rejected" },
                  ]}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="h-11 px-4 flex items-center justify-center gap-2 text-[14px] font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredDocs.length > 0 ? (
              <>
                <AdminTable data={paginatedDocs} columns={columns} keyExtractor={(doc) => doc.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * pageSize + 1, filteredDocs.length)} to {Math.min(validCurrentPage * pageSize, filteredDocs.length)} of {filteredDocs.length} doctors
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
                  title="No verification requests found"
                  description="There are no doctors matching the selected filters."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  action={
                    (searchTerm || statusFilter !== 'all') ? (
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

      {/* Doctor Verification Modal */}
      <AdminModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Verification Review"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            
            {/* Header Profile */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl border border-blue-200 shrink-0">
                  {selectedDoctor.name.replace("Dr. ", "").charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">Dr. {selectedDoctor.name}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-1">{selectedDoctor.specialty}</p>
                  <p className="text-[13px] text-slate-400">{selectedDoctor.email || "No email"}</p>
                </div>
              </div>
              <AdminStatusBadge status={selectedDoctor.verificationStatus || "pending"} />
            </div>

            {selectedDoctor.verificationStatus === 'rejected' && selectedDoctor.rejectionReason && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="text-[13px] font-bold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</h4>
                  <p className="text-[14px] text-red-800 leading-relaxed">{selectedDoctor.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="md:col-span-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Professional Profile</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Experience</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.experienceYears} years</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <span className="text-xs text-slate-500 block mb-1">Qualification</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.qualification || "Not provided"}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 col-span-2">
                    <span className="text-xs text-slate-500 block mb-1">Clinic / Hospital</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedDoctor.clinic || "Not provided"}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Submitted Documents</h4>
                {selectedDoctor.documents && selectedDoctor.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDoctor.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-slate-900">{doc.type}</p>
                            <p className="text-xs text-slate-500">PDF Document</p>
                          </div>
                        </div>
                        <button className="text-[13px] font-medium text-blue-600 hover:text-blue-800 transition-colors px-2">
                          View Document
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-slate-500 font-medium">No documents submitted</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedDoctor.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => setRejectConfirm(selectedDoctor)}
                      className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors shadow-sm text-[14px]"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setApproveConfirm(selectedDoctor)}
                      className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-[14px]"
                    >
                      Approve
                    </button>
                  </>
                )}
                {selectedDoctor.verificationStatus === 'rejected' && (
                  <button
                    onClick={() => handleMockResubmit(selectedDoctor.id)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors text-[13px]"
                  >
                    Mock Resubmit
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm text-[14px]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Approve Confirm Modal */}
      <AdminModal
        isOpen={!!approveConfirm}
        onClose={() => setApproveConfirm(null)}
        title="Approve Verification"
      >
        <div className="py-2">
          <p className="text-slate-700 text-[15px] leading-relaxed">
            Are you sure you want to approve verification for <strong>Dr. {approveConfirm?.name}</strong>?
          </p>
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-emerald-800 text-[13px] leading-relaxed">
              This doctor will now receive the <strong className="font-semibold">Verified Doctor</strong> badge on the patient portal and will be visible in search results.
            </p>
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setApproveConfirm(null)}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Reject Modal */}
      <AdminModal
        isOpen={!!rejectConfirm}
        onClose={() => { setRejectConfirm(null); setRejectionReason(""); }}
        title="Reject Verification"
      >
        <div className="py-2">
          <p className="text-slate-700 text-[15px] mb-5">
            You are rejecting verification for <strong>Dr. {rejectConfirm?.name}</strong>.
          </p>
          
          <label className="block text-[13px] font-bold text-slate-700 mb-1.5">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[14px] text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
            rows={4}
            placeholder="Please provide a detailed reason for rejection..."
            required
          />
          <p className="text-[12px] text-slate-500 mt-2 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            This reason will be visible to the doctor.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => { setRejectConfirm(null); setRejectionReason(""); }}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2.5 rounded-xl text-[14px] font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Reject Verification
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
