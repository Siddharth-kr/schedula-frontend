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
import type { Doctor } from "@/types/doctor";
import { toast } from "react-toastify";

export function AdminDoctorsClient() {
  const dispatch = useAppDispatch();
  const doctors = useAppSelector(state => state.doctors.doctors);
  const [isClient, setIsClient] = useState(false);
  
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
  const paginatedDoctors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDoctors.slice(start, start + pageSize);
  }, [filteredDoctors, currentPage, pageSize]);

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

  const columns: AdminTableColumn<Doctor>[] = useMemo(() => [
    {
      key: "name",
      title: "Doctor",
      render: (doc) => (
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
            {doc.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900">{doc.name}</div>
            <div className="text-xs text-slate-500">{doc.email || "No email"}</div>
          </div>
        </div>
      )
    },
    { key: "specialty", title: "Specialty", render: (doc) => <span className="text-slate-600 font-medium">{doc.specialty}</span> },
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
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (doc) => (
        <button 
          onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doc); }}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Details
        </button>
      )
    }
  ], []);

  if (!isClient) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">Manage doctor accounts and profiles.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="w-full lg:w-96">
            <AdminSearch value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, specialty, email..." />
          </div>
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <AdminFilter 
              label="Verification:"
              value={verificationFilter} 
              onChange={setVerificationFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]} 
            />
            <AdminFilter 
              label="Status:"
              value={statusFilter} 
              onChange={setStatusFilter}
              options={[
                { label: "All", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]} 
            />
          </div>
        </div>

        <AdminTable 
          columns={columns} 
          data={paginatedDoctors} 
          keyExtractor={(doc) => doc.id} 
          onRowClick={(doc) => setSelectedDoctor(doc)}
          emptyStateTitle="No doctors found"
          emptyStateMessage="Try adjusting your search or filters."
          className="border-0 shadow-none rounded-none"
        />

        {filteredDoctors.length > 0 && (
          <div className="border-t border-border">
            <AdminPagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={setCurrentPage} 
              className="border-0 shadow-none rounded-none bg-slate-50/30"
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AdminModal
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
        title="Doctor Details"
        footer={
          selectedDoctor && (
            <div className="flex justify-end gap-3 w-full">
              <button
                onClick={() => setDoctorToToggle(selectedDoctor)}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  selectedDoctor.active 
                    ? "bg-error hover:bg-error/90" 
                    : "bg-success hover:bg-success/90"
                }`}
              >
                {selectedDoctor.active ? "Deactivate Account" : "Activate Account"}
              </button>
            </div>
          )
        }
      >
        {selectedDoctor && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xl">
                {selectedDoctor.name.replace("Dr. ", "").charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedDoctor.name}</h3>
                <p className="text-sm font-medium text-blue-600">{selectedDoctor.specialty}</p>
                <div className="flex items-center gap-2 mt-2">
                  <AdminStatusBadge status={selectedDoctor.verificationStatus || "pending"} />
                  <AdminStatusBadge status={selectedDoctor.active ? "active" : "inactive"} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Email</span>
                    <span className="text-sm font-medium text-slate-900">{selectedDoctor.email || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Phone</span>
                    <span className="text-sm font-medium text-slate-900">{selectedDoctor.phone || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Clinic</span>
                    <span className="text-sm font-medium text-slate-900">{selectedDoctor.clinic || "Not provided"}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Professional Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-slate-500 block">Experience</span>
                    <span className="text-sm font-medium text-slate-900">{selectedDoctor.experienceYears} years</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Qualification</span>
                    <span className="text-sm font-medium text-slate-900">{selectedDoctor.qualification || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Consultation Fee</span>
                    <span className="text-sm font-medium text-slate-900">${selectedDoctor.consultationFee}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-border">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verification Record</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Status</span>
                  <AdminStatusBadge status={selectedDoctor.verificationStatus || "pending"} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Submitted</span>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedDoctor.submittedAt ? new Date(selectedDoctor.submittedAt).toLocaleDateString() : "Not available"}
                  </span>
                </div>
                {selectedDoctor.verificationStatus === 'rejected' && selectedDoctor.rejectionReason && (
                  <div className="mt-3 p-3 bg-error/10 text-error rounded-lg text-sm border border-error/20">
                    <strong>Reason for rejection:</strong> {selectedDoctor.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Confirmation Modal */}
      <AdminModal
        isOpen={!!doctorToToggle}
        onClose={() => setDoctorToToggle(null)}
        title={doctorToToggle?.active ? "Deactivate Doctor Account" : "Activate Doctor Account"}
        footer={
          <>
            <button
              onClick={() => setDoctorToToggle(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleConfirm}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                doctorToToggle?.active ? "bg-error hover:bg-error/90" : "bg-success hover:bg-success/90"
              }`}
            >
              {doctorToToggle?.active ? "Deactivate" : "Activate"}
            </button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-slate-600 text-sm">
            Are you sure you want to <strong>{doctorToToggle?.active ? "deactivate" : "activate"}</strong> Dr. {doctorToToggle?.name}? 
          </p>
          {doctorToToggle?.active && (
            <p className="text-error text-sm mt-2">
              A deactivated doctor cannot log in or receive new appointments. Their verification status will not change.
            </p>
          )}
        </div>
      </AdminModal>
    </div>
  );
}
