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

export function AdminPaymentsClient() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const appointments = useAppSelector((state) => state.appointments.appointments);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [patientFilter, setPatientFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedPayment, setSelectedPayment] = useState<Appointment | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Filter payments
  const paymentsList = useMemo(() => {
    // A payment exists if there is a consultation fee or a payment status
    return appointments.filter(a => a.consultationFee || a.paymentStatus);
  }, [appointments]);

  // Unique filters from data
  const doctorOptions = useMemo(() => {
    const docs = Array.from(new Set(paymentsList.map(p => p.clinician)));
    return [{ label: "All Doctors", value: "all" }, ...docs.map(d => ({ label: d, value: d }))];
  }, [paymentsList]);

  const patientOptions = useMemo(() => {
    const pats = Array.from(new Set(paymentsList.map(p => p.patient.name)));
    return [{ label: "All Patients", value: "all" }, ...pats.map(p => ({ label: p, value: p }))];
  }, [paymentsList]);

  // KPIs
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    paymentsList.forEach(p => {
      if (p.paymentStatus === "paid") {
        paidCount++;
        totalRevenue += (p.consultationFee || 0);
      } else if (p.paymentStatus === "pending") {
        pendingCount++;
      } else if (p.paymentStatus === "failed") {
        failedCount++;
      }
    });

    return { totalRevenue, paidCount, pendingCount, failedCount };
  }, [paymentsList]);

  // Apply search and filter
  const filteredPayments = useMemo(() => {
    return paymentsList.filter((apt) => {
      const txnId = apt.paymentId || `TXN-${apt.id}`;
      const matchesSearch = 
        apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clinician.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txnId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || apt.paymentStatus === statusFilter;
      const matchesDoctor = doctorFilter === "all" || apt.clinician === doctorFilter;
      const matchesPatient = patientFilter === "all" || apt.patient.name === patientFilter;
      const matchesDate = dateFilter === "" || new Date(apt.startsAt).toISOString().split('T')[0] === dateFilter;
      
      return matchesSearch && matchesStatus && matchesDoctor && matchesPatient && matchesDate;
    }).sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  }, [paymentsList, searchTerm, statusFilter, doctorFilter, patientFilter, dateFilter]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  
  // Safe pagination
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedPayments = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPayments, validCurrentPage, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDoctorFilter("all");
    setPatientFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  };

  const columns: AdminTableColumn<Appointment>[] = useMemo(() => [
    {
      key: "txnId",
      title: "Transaction ID",
      render: (apt) => (
        <span className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors">
          {apt.paymentId || `TXN-${apt.id.slice(0, 10).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: "patient",
      title: "Patient",
      render: (apt) => {
        const email = apt.patientInfo?.email || `${apt.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{apt.patient.name}</span>
            <span className="text-xs text-slate-500">{email}</span>
          </div>
        );
      }
    },
    {
      key: "doctor",
      title: "Doctor",
      render: (apt) => {
        const initial = apt.clinician.replace('Dr. ', '').charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
              {initial}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{apt.clinician}</span>
              <span className="text-xs text-slate-500">{apt.specialty || "General Medicine"}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: "appointment",
      title: "Appointment",
      render: (apt) => {
        const type = apt.consultationType || apt.appointmentType || "in-person";
        const isOnline = type.toLowerCase() === "online" || type.toLowerCase() === "video";
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-sm text-slate-700">
              {new Date(apt.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} <span className="text-slate-400">•</span> {new Date(apt.startsAt).toLocaleTimeString("en-US", { hour: '2-digit', minute:'2-digit' })}
            </span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
              {isOnline ? 'Online' : 'In-person'}
            </span>
          </div>
        );
      }
    },
    {
      key: "amount",
      title: "Amount",
      render: (apt) => <span className="font-bold text-slate-900">${apt.consultationFee || 0}</span>,
    },
    {
      key: "method",
      title: "Payment Method",
      render: (apt) => {
        // Mocking payment method deterministically based on ID to avoid real sensitive data but look realistic
        const lastChar = apt.id.charAt(apt.id.length - 1);
        let method = "Card";
        let detail = "•••• 4242";
        let icon = (
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );

        if (['1','2','3'].includes(lastChar)) {
          method = "UPI"; detail = "GPay";
          icon = (
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          );
        } else if (['4','5'].includes(lastChar)) {
          method = "Wallet"; detail = "Schedula Wallet";
          icon = (
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
        } else if (['6','7'].includes(lastChar)) {
          method = "Card"; detail = "•••• 3187";
        } else if (['8','9','0'].includes(lastChar)) {
          method = "Net Banking"; detail = "HDFC";
          icon = (
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          );
        }

        return (
          <div className="flex items-center gap-2">
            {icon}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-800">{method}</span>
              <span className="text-[11px] text-slate-500">{detail}</span>
            </div>
          </div>
        );
      }
    },
    {
      key: "date",
      title: "Date & Time",
      render: (apt) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">
            {new Date(apt.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(apt.startsAt).toLocaleTimeString("en-US", { hour: '2-digit', minute:'2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (apt) => {
        const status = apt.paymentStatus || "pending";
        return <AdminStatusBadge status={status} />;
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (apt) => (
        <button
          onClick={() => setSelectedPayment(apt)}
          className="text-xs font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          View Details
        </button>
      ),
    },
  ], []);

  if (!isClient || isLoading) {
    return <AdminPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments Management</h1>
          <p className="text-slate-500 mt-1">View and manage platform payments, refunds, and transaction history.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Payments
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900">${kpis.totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Paid */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Completed Payments</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.paidCount}</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pending Payments</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.pendingCount}</p>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Failed Payments</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.failedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <AdminSearch 
              placeholder="Search by Transaction ID, Patient or Doctor name..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:w-auto shrink-0">
            <div className="w-full relative">
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <AdminFilter
              options={doctorOptions}
              value={doctorFilter}
              onChange={setDoctorFilter}
            />
            <AdminFilter
              options={patientOptions}
              value={patientFilter}
              onChange={setPatientFilter}
            />
            <AdminFilter
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Paid", value: "paid" },
                { label: "Pending", value: "pending" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <button 
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shrink-0 whitespace-nowrap shadow-sm"
          >
            Reset
          </button>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          {filteredPayments.length > 0 ? (
            <>
              <AdminTable data={paginatedPayments} columns={columns} keyExtractor={(apt) => apt.id} />
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                <div>
                  Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredPayments.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                </div>
                <AdminPagination
                  currentPage={validCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          ) : (
            <AdminEmptyState
              title="No payments found"
              description="Try adjusting your search or filters to find what you're looking for."
              icon={
                <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
          )}
        </div>
      </div>

      <AdminModal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Amount</p>
                <p className="text-3xl font-bold text-slate-900">${selectedPayment.consultationFee || 0}</p>
              </div>
              <div>
                <AdminStatusBadge 
                  status={selectedPayment.paymentStatus || "pending"} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Transaction ID</p>
                <p className="font-medium text-slate-900 font-mono text-xs">{selectedPayment.paymentId || `TXN-${selectedPayment.id}`}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Payment Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedPayment.startsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Patient</p>
                <p className="font-medium text-slate-900">{selectedPayment.patient.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPayment.patientInfo?.email || `${selectedPayment.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Doctor</p>
                <p className="font-medium text-slate-900">{selectedPayment.clinician}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPayment.specialty || "General Medicine"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Appointment Type</p>
                <p className="font-medium text-slate-900 capitalize">{selectedPayment.consultationType || selectedPayment.appointmentType || "In-person"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Payment Method</p>
                <p className="font-medium text-slate-900">Credit Card (•••• 4242)</p>
              </div>
            </div>

            {selectedPayment.paymentStatus === "refunded" && (
              <div className="mt-6 bg-purple-50 p-5 rounded-2xl border border-purple-100">
                <h4 className="text-purple-900 font-semibold mb-4 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Refund Information
                </h4>
                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-purple-700/80 mb-1">Refund Status</p>
                    <p className="font-medium text-purple-900">Processed</p>
                  </div>
                  <div>
                    <p className="text-purple-700/80 mb-1">Refund Amount</p>
                    <p className="font-medium text-purple-900">${selectedPayment.consultationFee || 0}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-purple-700/80 mb-1">Reason</p>
                    <p className="font-medium text-purple-900">Appointment cancelled by patient</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
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
