"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { approveDoctor, rejectDoctor, resubmitVerification } from "@/store/slices/doctorSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminModal } from "./AdminModal";
import { AdminStatusBadge } from "./AdminStatusBadge";
import type { Doctor } from "@/types/doctor";
import { toast } from "react-toastify";

export function AdminDoctorVerificationClient() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(state => state.doctors.doctors);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [approveConfirm, setApproveConfirm] = useState<Doctor | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const verificationDocs = useMemo(() => {
    return doctors.filter(doc => doc.verificationStatus !== undefined);
  }, [doctors]);

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
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, currentPage, pageSize]);



  const handleApprove = () => {
    if (!approveConfirm) return;
    dispatch(approveDoctor(approveConfirm.id));
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
    toast.success(`Verification for Dr. ${rejectConfirm.name} rejected.`);
    
    if (selectedDoctor && selectedDoctor.id === rejectConfirm.id) {
      setSelectedDoctor({ ...selectedDoctor, verificationStatus: "rejected", rejectionReason: rejectionReason.trim() });
    }
    
    setRejectConfirm(null);
    setRejectionReason("");
  };

  const handleMockResubmit = (id: string) => {
    dispatch(resubmitVerification(id));
    toast.info("Doctor verification has been resubmitted (Mock).");
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
          <div className="size-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600 text-sm">
            {doc.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div>
            <div className="font-bold text-stone-900">{doc.name}</div>
            <div className="text-xs text-stone-500">{doc.specialty}</div>
          </div>
        </div>
      )
    },
    {
      key: "submittedAt",
      title: "Submitted",
      render: (doc) => <span className="text-stone-600 font-medium">{doc.submittedAt ? new Date(doc.submittedAt).toLocaleDateString() : "Unknown"}</span>
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
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doc); }}
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Review
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">Doctor Verification</h1>
          <p className="text-sm text-stone-500 mt-1">Review and approve doctor credentials.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col lg:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="w-full lg:w-96">
            <AdminSearch value={searchTerm} onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} placeholder="Search by name or specialty..." />
          </div>
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <AdminFilter 
              label="Status:"
              value={statusFilter} 
              onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
              options={[
                { label: "All", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]} 
            />
          </div>
        </div>

        <AdminTable 
          columns={columns} 
          data={paginatedDocs} 
          keyExtractor={(doc) => doc.id} 
          onRowClick={(doc) => setSelectedDoctor(doc)}
          emptyStateTitle="No verification records found"
          emptyStateMessage="There are no doctors matching your current filters."
          className="border-0 shadow-none rounded-none"
        />

        {filteredDocs.length > 0 && (
          <div className="border-t border-border">
            <AdminPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              className="border-0 shadow-none rounded-none bg-stone-50/30"
            />
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AdminModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Verification Review"
        footer={
          selectedDoctor && (
            <div className="flex justify-between items-center w-full">
              <div>
                {selectedDoctor.verificationStatus === 'rejected' && (
                  <button 
                    onClick={() => handleMockResubmit(selectedDoctor.id)}
                    className="text-sm font-medium text-stone-500 hover:text-stone-900 underline"
                  >
                    Mock Resubmit
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {selectedDoctor.verificationStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => setRejectConfirm(selectedDoctor)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-error bg-error/10 hover:bg-error/20 border border-error/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setApproveConfirm(selectedDoctor)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-success hover:bg-success/90 transition-colors"
                    >
                      Approve
                    </button>
                  </>
                )}
                {selectedDoctor.verificationStatus !== 'pending' && (
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-border pb-6">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Dr. {selectedDoctor.name}</h3>
                <p className="text-sm font-medium text-primary">{selectedDoctor.specialty}</p>
                <p className="text-xs text-stone-500 mt-1">{selectedDoctor.email || "No email"}</p>
              </div>
              <AdminStatusBadge status={selectedDoctor.verificationStatus || "pending"} />
            </div>

            {selectedDoctor.verificationStatus === 'rejected' && selectedDoctor.rejectionReason && (
              <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                <h4 className="text-xs font-bold text-error uppercase tracking-wider mb-1">Rejection Reason</h4>
                <p className="text-sm text-stone-800">{selectedDoctor.rejectionReason}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Professional Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 rounded-lg p-3 border border-border">
                  <span className="text-xs text-stone-500 block">Experience</span>
                  <span className="text-sm font-medium text-stone-900">{selectedDoctor.experienceYears} years</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 border border-border">
                  <span className="text-xs text-stone-500 block">Qualification</span>
                  <span className="text-sm font-medium text-stone-900">{selectedDoctor.qualification || "Not provided"}</span>
                </div>
                <div className="bg-stone-50 rounded-lg p-3 border border-border col-span-2">
                  <span className="text-xs text-stone-500 block">Clinic/Hospital</span>
                  <span className="text-sm font-medium text-stone-900">{selectedDoctor.clinic || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Submitted Documents</h4>
              {selectedDoctor.documents && selectedDoctor.documents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDoctor.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-stone-100 rounded text-stone-500">
                          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-stone-900">{doc.type}</p>
                          <p className="text-xs text-stone-500">PDF Document</p>
                        </div>
                      </div>
                      <button className="text-sm font-medium text-primary hover:text-primary-dark">View</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed border-border rounded-xl bg-stone-50 text-stone-500 text-sm">
                  No documents were submitted.
                </div>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Approve Confirm Modal */}
      <AdminModal
        isOpen={!!approveConfirm}
        onClose={() => setApproveConfirm(null)}
        title="Approve Verification"
        footer={
          <>
            <button
              onClick={() => setApproveConfirm(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-success hover:bg-success/90 transition-colors"
            >
              Confirm Approval
            </button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-stone-600 text-sm">
            Are you sure you want to approve verification for <strong>Dr. {approveConfirm?.name}</strong>?
          </p>
          <p className="text-stone-600 text-sm mt-2">
            This doctor will now receive the <span className="font-bold text-emerald-700">Verified Doctor</span> badge on the patient portal.
          </p>
        </div>
      </AdminModal>

      {/* Reject Modal */}
      <AdminModal
        isOpen={!!rejectConfirm}
        onClose={() => { setRejectConfirm(null); setRejectionReason(""); }}
        title="Reject Verification"
        footer={
          <>
            <button
              onClick={() => { setRejectConfirm(null); setRejectionReason(""); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-error hover:bg-error/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reject Verification
            </button>
          </>
        }
      >
        <div className="py-2">
          <p className="text-stone-600 text-sm mb-4">
            You are rejecting verification for <strong>Dr. {rejectConfirm?.name}</strong>.
          </p>
          <label className="block text-sm font-bold text-stone-700 mb-1">
            Rejection Reason <span className="text-error">*</span>
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full rounded-lg border border-border p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            rows={4}
            placeholder="Please provide a detailed reason for rejection..."
            required
          />
          <p className="text-xs text-stone-500 mt-1">This reason will be visible to the doctor.</p>
        </div>
      </AdminModal>
    </div>
  );
}
