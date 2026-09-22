"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
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

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchSearch = 
        apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clinician.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.patientInfo?.email && apt.patientInfo.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchDoctor = doctorFilter === "all" || apt.clinician === doctorFilter;
      const matchPatient = patientFilter === "all" || apt.patient.name === patientFilter;
      const matchStatus = statusFilter === "all" || apt.status === statusFilter;
      const matchType = typeFilter === "all" || (apt.consultationType ? apt.consultationType === typeFilter : typeFilter === "in-person");
      
      return matchSearch && matchDoctor && matchPatient && matchStatus && matchType;
    }).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [appointments, searchTerm, doctorFilter, patientFilter, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  if (!isClient || isLoading) return <AdminPageSkeleton />;

  const columns: AdminTableColumn<Appointment>[] = [
    {
      key: "patient",
      title: "Patient",
      render: (apt) => (
        <div>
          <div className="font-medium text-slate-900">{apt.patient.name}</div>
          {apt.patientInfo?.email && <div className="text-xs text-slate-500">{apt.patientInfo.email}</div>}
        </div>
      ),
    },
    {
      key: "doctor",
      title: "Doctor",
      render: (apt) => (
        <div>
          <div className="font-medium text-slate-900">{apt.clinician}</div>
          <div className="text-xs text-slate-500">{apt.specialty}</div>
        </div>
      ),
    },
    {
      key: "datetime",
      title: "Date & Time",
      render: (apt) => {
        const d = new Date(apt.startsAt);
        return (
          <div>
            <div className="font-medium text-slate-900">{d.toLocaleDateString()}</div>
            <div className="text-xs text-slate-500">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        );
      },
    },
    {
      key: "type",
      title: "Type",
      render: (apt) => (
        <span className="text-slate-600">
          {apt.consultationType === "online" ? "Online" : "In-person"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (apt) => (
        <AdminStatusBadge status={apt.rescheduledFrom ? "rescheduled" : apt.status} />
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (apt) => (
        <button
          onClick={() => setSelectedAppointment(apt)}
          className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-serif">Appointments</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage and review all scheduled appointments.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <AdminSearch
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by patient, email, or doctor..."
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <AdminFilter
              label="Doctor"
              options={[{ label: "All Doctors", value: "all" }, ...doctors]}
              value={doctorFilter}
              onChange={handleFilterChange(setDoctorFilter)}
            />
            <AdminFilter
              label="Patient"
              options={[{ label: "All Patients", value: "all" }, ...patients]}
              value={patientFilter}
              onChange={handleFilterChange(setPatientFilter)}
            />
            <AdminFilter
              label="Type"
              options={[
                { label: "All Types", value: "all" },
                { label: "Online", value: "online" },
                { label: "In-person", value: "in-person" },
              ]}
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
            />
            <AdminFilter
              label="Status"
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Pending", value: "pending" },
                { label: "Confirmed", value: "confirmed" },
                { label: "Upcoming", value: "upcoming" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Missed", value: "missed" },
              ]}
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
            />
          </div>
        </div>

        {filteredAppointments.length > 0 ? (
          <>
            <AdminTable columns={columns} data={paginatedAppointments} keyExtractor={(a) => a.id} />
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <AdminEmptyState
            title="No appointments found"
            description="Adjust your search or filter to see results."
            action={
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDoctorFilter("all");
                  setPatientFilter("all");
                  setStatusFilter("all");
                  setTypeFilter("all");
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
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedAppointment.patient.name}</h3>
                {selectedAppointment.patientInfo?.email && (
                  <p className="text-sm text-slate-500">{selectedAppointment.patientInfo.email}</p>
                )}
                {selectedAppointment.patientInfo?.phone && (
                  <p className="text-sm text-slate-500">{selectedAppointment.patientInfo.phone}</p>
                )}
              </div>
              <div className="text-right">
                <AdminStatusBadge status={selectedAppointment.rescheduledFrom ? "rescheduled" : selectedAppointment.status} className="mb-1" />
                <p className="text-xs text-slate-500 font-mono">ID: {selectedAppointment.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-500 mb-1">Doctor</p>
                <p className="font-medium text-slate-900">{selectedAppointment.clinician}</p>
                <p className="text-slate-500 text-xs">{selectedAppointment.specialty}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-slate-500 mb-1">Schedule</p>
                <p className="font-medium text-slate-900">{new Date(selectedAppointment.startsAt).toLocaleDateString()}</p>
                <p className="text-slate-500 text-xs">{new Date(selectedAppointment.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.durationMinutes} min)</p>
              </div>
            </div>

            {selectedAppointment.rescheduledFrom && (
              <div className="bg-purple-50 text-purple-900 p-3 rounded-lg border border-purple-100 text-sm">
                <p className="font-semibold mb-1">Rescheduled Appointment</p>
                <p>Originally scheduled for: {new Date(selectedAppointment.rescheduledFrom).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            )}
            
            {selectedAppointment.status === "cancelled" && selectedAppointment.cancelledAt && (
              <div className="bg-error/10 text-error p-3 rounded-lg border border-error/20 text-sm">
                <p className="font-semibold mb-1">Cancelled Appointment</p>
                <p>Cancelled on: {new Date(selectedAppointment.cancelledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 border-b border-border pb-2">Consultation Details</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Consultation Type</p>
                  <p className="font-medium text-slate-900">{selectedAppointment.consultationType === "online" ? "Online" : "In-person"}</p>
                </div>
                {selectedAppointment.room && (
                  <div>
                    <p className="text-slate-500">Room / Link</p>
                    <p className="font-medium text-slate-900">{selectedAppointment.room}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Payment Status</p>
                  <p className="font-medium text-slate-900 capitalize">{selectedAppointment.paymentStatus || "Unknown"}</p>
                </div>
                {selectedAppointment.consultationFee !== undefined && (
                  <div>
                    <p className="text-slate-500">Fee</p>
                    <p className="font-medium text-slate-900">${selectedAppointment.consultationFee}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-slate-500">Reason for Visit</p>
                  <p className="font-medium text-slate-900">{selectedAppointment.reason}</p>
                </div>
              </div>
            </div>
            
            {selectedAppointment.medicalInfo && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 border-b border-border pb-2">Intake Medical Info</h4>
                <div className="text-sm space-y-2">
                  {selectedAppointment.medicalInfo.symptoms && (
                    <p><span className="text-slate-500">Symptoms:</span> {selectedAppointment.medicalInfo.symptoms}</p>
                  )}
                  {selectedAppointment.medicalInfo.allergies && (
                    <p><span className="text-slate-500">Allergies:</span> {selectedAppointment.medicalInfo.allergies}</p>
                  )}
                  {selectedAppointment.medicalInfo.medicalConditions && (
                    <p><span className="text-slate-500">Conditions:</span> {selectedAppointment.medicalInfo.medicalConditions}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
