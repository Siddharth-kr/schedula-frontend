"use client";

import { useState, useMemo, useEffect } from "react";
import { mockUsers } from "@/lib/mock-data/users";
import { getUserProfiles, updateUserProfile } from "@/lib/user-profile-store";
import { useAppSelector } from "@/store/hooks";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
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

    // We could theoretically add profiles that are not in mockUsers if someone signed up,
    // but for this phase mockUsers + existing profiles is our core truth.

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

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };
  
  const toggleAccountStatus = () => {
    if (!selectedPatient) return;
    
    const newStatus = selectedPatient.accountStatus === "active" ? "inactive" : "active";
    
    // Create or update profile
    let existingProfile = profiles.find(p => p.email === selectedPatient.email || p.id === selectedPatient.id);
    
    if (!existingProfile) {
      existingProfile = {
        id: selectedPatient.id,
        fullName: selectedPatient.name,
        email: selectedPatient.email,
        phone: selectedPatient.phone,
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
    setProfiles(getUserProfiles());
    
    setSelectedPatient({ ...selectedPatient, accountStatus: newStatus, profileData: existingProfile });
    setIsConfirmingDeactivate(false);
    toast.success(`Patient account is now ${newStatus}.`);
  };

  if (!isClient || isLoading) return <AdminPageSkeleton />;

  const columns: AdminTableColumn<CombinedPatient>[] = [
    {
      key: "patient",
      title: "Patient",
      render: (pat) => (
        <div>
          <div className="font-medium text-slate-900">{pat.name}</div>
          <div className="text-xs text-slate-500">{pat.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (pat) => (
        <span className="text-slate-600 text-sm">{pat.phone}</span>
      ),
    },
    {
      key: "joined",
      title: "Joined",
      render: (pat) => (
        <span className="text-slate-600 text-sm">{new Date(pat.registrationDate).toLocaleDateString()}</span>
      ),
    },
    {
      key: "appointments",
      title: "Appointments",
      render: (pat) => (
        <span className="text-slate-900 font-medium">{pat.appointmentCount}</span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (pat) => (
        <AdminStatusBadge status={pat.accountStatus} />
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (pat) => (
        <button
          onClick={() => setSelectedPatient(pat)}
          className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors"
        >
          View Details
        </button>
      ),
    },
  ];
  
  const selectedPatientAppointments = selectedPatient 
    ? appointments.filter(a => a.patient.name === selectedPatient.name || a.patientInfo?.email === selectedPatient.email).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Patients</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage patient accounts and view history.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <AdminSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or phone..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminFilter
              label="Account Status"
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
            />
          </div>
        </div>

        {filteredPatients.length > 0 ? (
          <>
            <AdminTable columns={columns} data={paginatedPatients} keyExtractor={(p) => p.id} />
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <AdminEmptyState
            title="No patients found"
            description="Adjust your search or filter to see results."
            action={
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            }
          />
        )}
      </div>

      <AdminModal
        isOpen={!!selectedPatient && !isConfirmingDeactivate}
        onClose={() => setSelectedPatient(null)}
        title="Patient Details"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-700 text-xl">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.name}</h3>
                  <p className="text-sm text-slate-500">{selectedPatient.email}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <AdminStatusBadge status={selectedPatient.accountStatus} />
                <button 
                  onClick={() => setIsConfirmingDeactivate(true)}
                  className={`text-xs font-medium px-2 py-1 rounded border ${
                    selectedPatient.accountStatus === 'active' 
                      ? 'border-red-200 text-red-600 hover:bg-red-50' 
                      : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                  } transition-colors`}
                >
                  {selectedPatient.accountStatus === 'active' ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Phone</p>
                <p className="font-medium text-slate-900">{selectedPatient.phone}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Registration Date</p>
                <p className="font-medium text-slate-900">{new Date(selectedPatient.registrationDate).toLocaleDateString()}</p>
              </div>
              {selectedPatient.profileData?.dob && (
                <div>
                  <p className="text-slate-500 mb-1">Date of Birth</p>
                  <p className="font-medium text-slate-900">{new Date(selectedPatient.profileData.dob).toLocaleDateString()}</p>
                </div>
              )}
              {selectedPatient.profileData?.gender && (
                <div>
                  <p className="text-slate-500 mb-1">Gender</p>
                  <p className="font-medium text-slate-900 capitalize">{selectedPatient.profileData.gender}</p>
                </div>
              )}
            </div>
            
            {/* Appointment History */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="font-semibold text-slate-900">Appointment History</h4>
              
              {selectedPatientAppointments.length > 0 ? (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                  {selectedPatientAppointments.map(apt => (
                    <div key={apt.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium text-slate-900">{apt.clinician}</p>
                        <p className="text-slate-500 text-xs">{new Date(apt.startsAt).toLocaleDateString()} at {new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-slate-500 text-xs">{apt.consultationType === "online" ? "Online" : "In-person"}</p>
                      </div>
                      <div>
                        <AdminStatusBadge status={apt.rescheduledFrom ? "rescheduled" : apt.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">No appointment history found.</p>
              )}
            </div>
          </div>
        )}
      </AdminModal>
      
      {/* Confirmation Modal */}
      <AdminModal
        isOpen={isConfirmingDeactivate}
        onClose={() => setIsConfirmingDeactivate(false)}
        title="Confirm Account Status Change"
      >
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Are you sure you want to {selectedPatient?.accountStatus === 'active' ? 'deactivate' : 'activate'} the account for <span className="font-semibold">{selectedPatient?.name}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setIsConfirmingDeactivate(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={toggleAccountStatus}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                selectedPatient?.accountStatus === 'active' 
                  ? 'bg-error hover:bg-error/90' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              Confirm {selectedPatient?.accountStatus === 'active' ? 'Deactivation' : 'Activation'}
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
