"use client";

import { useState, useMemo, useEffect } from "react";
import { mockUsers } from "@/lib/mock-data/users";
import { getUserProfiles, updateUserProfile } from "@/lib/user-profile-store";
import { useAppSelector } from "@/store/hooks";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { toast } from "react-toastify";
import type { UserProfile } from "@/types/user-profile";

type CombinedPatient = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  accountStatus: "active" | "inactive";
  registrationDate: string;
  appointmentCount: number;
  profileData?: UserProfile | null;
};

export function AdminPatientsClient() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const appointments = useAppSelector((state) => state.appointments.appointments);
  const [profiles, setProfiles] = useState(() => {
    if (typeof window !== "undefined") return getUserProfiles();
    return [];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedPatient, setSelectedPatient] = useState<CombinedPatient | null>(null);
  const [isConfirmingDeactivate, setIsConfirmingDeactivate] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    setProfiles(getUserProfiles());
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const combinedPatients = useMemo(() => {
    const patientsList: CombinedPatient[] = [];
    
    // Process mock users who are patients
    Object.values(mockUsers).forEach(u => {
      if (u.role === "patient") {
        const profile = profiles.find(p => p.email === u.email || p.id === u.id);
        const apts = appointments.filter(a => a.patient.name === u.name || a.patientInfo?.email === u.email);
        
        patientsList.push({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: profile?.phone || "N/A",
          accountStatus: profile?.accountStatus || "active",
          registrationDate: profile?.registrationDate || new Date("2026-08-01").toISOString(),
          appointmentCount: apts.length,
          profileData: profile
        });
      }
    });

    return patientsList;
  }, [profiles, appointments]);

  const filteredPatients = useMemo(() => {
    return combinedPatients.filter(pat => {
      const matchSearch = 
        pat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pat.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === "all" || pat.accountStatus === statusFilter;
      
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
  }, [combinedPatients, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedPatients = filteredPatients.slice((validCurrentPage - 1) * itemsPerPage, validCurrentPage * itemsPerPage);

  // Derived KPI calculations
  const summary = useMemo(() => {
    const total = combinedPatients.length;
    const active = combinedPatients.filter(p => p.accountStatus === "active").length;
    let totalApts = 0;
    let newThisMonth = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    combinedPatients.forEach(p => {
      totalApts += p.appointmentCount;
      const regDate = new Date(p.registrationDate);
      if (regDate.getMonth() === currentMonth && regDate.getFullYear() === currentYear) {
        newThisMonth++;
      }
    });

    return { total, active, totalApts, newThisMonth };
  }, [combinedPatients]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const toggleAccountStatus = () => {
    if (!selectedPatient) return;
    
    const newStatus = selectedPatient.accountStatus === "active" ? "inactive" : "active";
    
    // Create or update profile
    let existingProfile = profiles.find(p => p.email === selectedPatient.email || p.id === selectedPatient.id);
    
    if (!existingProfile) {
      existingProfile = {
        id: selectedPatient.id, email: selectedPatient.email, fullName: selectedPatient.name, phone: selectedPatient.phone,
        dob: "", gender: "", address: "", city: "", state: "", pincode: "", height: "", weight: "", bloodGroup: "",
        medicalConditions: [], allergies: [], currentMedications: [], insuranceProvider: "", policyNumber: "",
        emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
        accountStatus: newStatus,
        registrationDate: selectedPatient.registrationDate
      };
    } else {
      existingProfile = { ...existingProfile, accountStatus: newStatus };
    }
    
    updateUserProfile(existingProfile);
    
    // Update local state to reflect UI change immediately without full reload
    setProfiles(getUserProfiles());
    setSelectedPatient({ ...selectedPatient, accountStatus: newStatus });
    setIsConfirmingDeactivate(false);
    
    toast.success(`Patient account successfully ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
  };

  const columns: AdminTableColumn<CombinedPatient>[] = useMemo(() => [
    {
      key: "name",
      title: "Patient",
      render: (pat) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[14px] border border-blue-100 shrink-0">
            {pat.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{pat.name}</span>
            <span className="text-[13px] text-slate-500">{pat.email}</span>
          </div>
        </div>
      )
    },
    { 
      key: "phone", 
      title: "Phone", 
      render: (pat) => <span className="text-[14px] text-slate-700 font-medium">{pat.phone}</span> 
    },
    {
      key: "joined",
      title: "Joined",
      render: (pat) => {
        const d = new Date(pat.registrationDate);
        return <span className="text-[14px] text-slate-600 font-medium">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>;
      }
    },
    {
      key: "appointments",
      title: "Appointments",
      render: (pat) => <span className="text-[14px] font-semibold text-slate-900">{pat.appointmentCount}</span>
    },
    {
      key: "accountStatus",
      title: "Status",
      render: (pat) => <AdminStatusBadge status={pat.accountStatus} />
    },
    {
      key: "actions",
      title: "Actions",
      className: "text-right",
      render: (pat) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setSelectedPatient(pat)}
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

  const selectedPatientAppointments = selectedPatient 
    ? appointments.filter(a => a.patient.name === selectedPatient.name || a.patientInfo?.email === selectedPatient.email).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    : [];

  if (!isClient || isLoading) {
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
          <span className="text-slate-900 font-medium">Patients</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patients</h1>
        <p className="text-[15px] text-slate-500">Manage patient accounts and view their appointment history.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Patients", value: summary.total, sub: "Registered patients", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", color: "blue" },
          { label: "Active Patients", value: summary.active, sub: "Currently active", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "emerald" },
          { label: "Total Appointments", value: summary.totalApts, sub: "Across all patients", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "purple" },
          { label: "New This Month", value: summary.newThisMonth, sub: `Joined in ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber" },
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

      {/* Filter Toolbar */}
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
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-[14px] text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="w-full md:w-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-slate-500 whitespace-nowrap">Account Status</span>
              <div className="w-40">
                <AdminFilter
                  options={[
                    { label: "All Statuses", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
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
        {/* Card Header */}
        <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-slate-900">Patient List</h2>
              <p className="text-sm text-slate-500">View and manage all registered patients.</p>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-0">
          <div className="w-full overflow-x-auto">
            {filteredPatients.length > 0 ? (
              <>
                <AdminTable data={paginatedPatients} columns={columns} keyExtractor={(p) => p.id} />
                <div className="p-5 lg:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[14px] text-slate-600">
                  <div>
                    Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredPatients.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
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
                  title="No patients found"
                  description="Adjust your search or filter criteria to see results."
                  icon={
                    <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

      {/* Patient Details Modal */}
      <AdminModal
        isOpen={!!selectedPatient && !isConfirmingDeactivate}
        onClose={() => setSelectedPatient(null)}
        title="Patient Details"
      >
        {selectedPatient && (
          <div className="space-y-6">
            
            {/* Modal Header Profile */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl border border-blue-200 shrink-0">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedPatient.name}</h3>
                <p className="text-sm font-medium text-slate-500 mb-2">{selectedPatient.email}</p>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge status={selectedPatient.accountStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              {/* Demographics */}
              <div className="sm:col-span-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Profile & Demographics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Phone</span>
                    <span className="text-[14px] font-medium text-slate-900">{selectedPatient.phone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Registration Date</span>
                    <span className="text-[14px] font-medium text-slate-900">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</span>
                  </div>
                  {selectedPatient.profileData?.dob && (
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Date of Birth</span>
                      <span className="text-[14px] font-medium text-slate-900">{new Date(selectedPatient.profileData.dob).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedPatient.profileData?.gender && (
                    <div>
                      <span className="text-xs text-slate-500 block mb-1">Gender</span>
                      <span className="text-[14px] font-medium text-slate-900 capitalize">{selectedPatient.profileData.gender}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment History Block */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h4 className="text-[13px] font-bold text-slate-800">Appointment History</h4>
              </div>
              
              {selectedPatientAppointments.length > 0 ? (
                <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                  {selectedPatientAppointments.map(apt => (
                    <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900 text-[14px]">{apt.clinician}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-slate-500 text-[13px] flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(apt.startsAt).toLocaleDateString()} at {new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold px-1.5 py-0.5 bg-slate-100 rounded">
                            {apt.consultationType === "online" ? "Online" : "In-person"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <AdminStatusBadge status={apt.rescheduledFrom ? "rescheduled" : apt.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-[14px] text-slate-500 italic">No appointment history found for this patient.</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="border-t border-slate-100 pt-5 flex items-center justify-between">
              <button
                onClick={() => setIsConfirmingDeactivate(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${
                  selectedPatient.accountStatus === 'active' 
                    ? "bg-white border-red-200 text-red-600 hover:bg-red-50" 
                    : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {selectedPatient.accountStatus === 'active' ? "Deactivate Account" : "Activate Account"}
              </button>
              <button
                onClick={() => setSelectedPatient(null)}
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
        isOpen={isConfirmingDeactivate}
        onClose={() => setIsConfirmingDeactivate(false)}
        title={selectedPatient?.accountStatus === 'active' ? "Deactivate Patient Account" : "Activate Patient Account"}
      >
        <div className="py-2">
          <p className="text-slate-700 text-[15px] leading-relaxed">
            Are you sure you want to <strong className={selectedPatient?.accountStatus === 'active' ? "text-red-600" : "text-emerald-600"}>{selectedPatient?.accountStatus === 'active' ? "deactivate" : "activate"}</strong> the account for {selectedPatient?.name}? 
          </p>
          {selectedPatient?.accountStatus === 'active' && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
              <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-800 text-[13px] leading-relaxed">
                A deactivated patient cannot log in or book new appointments. Existing appointments will remain in the system.
              </p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsConfirmingDeactivate(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={toggleAccountStatus}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-sm ${
                selectedPatient?.accountStatus === 'active' ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {selectedPatient?.accountStatus === 'active' ? "Confirm Deactivation" : "Confirm Activation"}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
