"use client";

import { useState, useMemo, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateReview } from "@/store/slices/appointmentSlice";
import { AdminTable, AdminTableColumn } from "./AdminTable";
import { AdminSearch } from "./AdminSearch";
import { AdminFilter } from "./AdminFilter";
import { AdminPagination } from "./AdminPagination";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminModal } from "./AdminModal";
import { AdminPageSkeleton } from "./AdminSkeleton";
import { AdminEmptyState } from "./AdminEmptyState";
import { usePermissions } from "@/lib/permissions";
import { toast } from "react-toastify";
import type { Appointment } from "@/types/appointment";

export function AdminReviewsClient() {
  const dispatch = useAppDispatch();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { hasPermission } = usePermissions();
  const canApprove = hasPermission('Reviews', 'approve');
  
  const appointments = useAppSelector((state) => state.appointments.appointments);

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedReview, setSelectedReview] = useState<Appointment | null>(null);
  const [reviewToRemove, setReviewToRemove] = useState<Appointment | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const allReviewsList = useMemo(() => {
    return appointments.filter(a => a.review);
  }, [appointments]);

  // Unique filters from data
  const doctorOptions = useMemo(() => {
    const docs = Array.from(new Set(allReviewsList.map(p => p.clinician)));
    return [{ label: "All Doctors", value: "all" }, ...docs.map(d => ({ label: d, value: d }))];
  }, [allReviewsList]);

  // KPIs
  const kpis = useMemo(() => {
    const totalReviews = allReviewsList.length;
    let sumRating = 0;
    let nonRemovedCount = 0;
    let reportedReviews = 0;
    let removedReviews = 0;

    allReviewsList.forEach(apt => {
      const rev = apt.review!;
      if (rev.isHidden) {
        removedReviews++;
      } else {
        sumRating += rev.rating;
        nonRemovedCount++;
        if (rev.isReported) reportedReviews++;
      }
    });

    const averageRating = nonRemovedCount > 0 ? (sumRating / nonRemovedCount).toFixed(1) : "0.0";

    return { totalReviews, averageRating, reportedReviews, removedReviews };
  }, [allReviewsList]);

  const filteredReviews = useMemo(() => {
    return allReviewsList.filter((apt) => {
      const review = apt.review!;
      const matchesSearch = 
        apt.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clinician.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.text && review.text.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRating = ratingFilter === "all" || Math.floor(review.rating).toString() === ratingFilter;
      const matchesDoctor = doctorFilter === "all" || apt.clinician === doctorFilter;
      
      const isRemoved = !!review.isHidden;
      const isReported = !!review.isReported && !isRemoved;
      const isPublished = !isReported && !isRemoved;
      
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "removed" ? isRemoved :
        statusFilter === "reported" ? isReported :
        statusFilter === "published" ? isPublished : true;

      const dateStr = review.createdAt || apt.startsAt;
      const aptDate = new Date(dateStr).toISOString().split('T')[0];
      const matchesDate = dateFilter === "" || aptDate === dateFilter;
      
      return matchesSearch && matchesRating && matchesDoctor && matchesStatus && matchesDate;
    }).sort((a, b) => {
      const dateA = a.review?.createdAt ? new Date(a.review.createdAt).getTime() : new Date(a.startsAt).getTime();
      const dateB = b.review?.createdAt ? new Date(b.review.createdAt).getTime() : new Date(b.startsAt).getTime();
      return dateB - dateA;
    });
  }, [allReviewsList, searchTerm, ratingFilter, doctorFilter, statusFilter, dateFilter]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedReviews = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return filteredReviews.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReviews, validCurrentPage, itemsPerPage]);

  const handleReset = () => {
    setSearchTerm("");
    setRatingFilter("all");
    setDoctorFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentPage(1);
  };

  const confirmRemoveReview = () => {
    if (reviewToRemove) {
      dispatch(updateReview({ id: reviewToRemove.id, updates: { isHidden: true } }));
      
      import('@/store/slices/auditSlice').then(({ addAuditLog }) => {
        dispatch(addAuditLog({
          admin: "Schedula Admin",
          action: "Review removed",
          entity: `Review by ${reviewToRemove.patient.name}`,
          details: `Removed reported review for doctor ${reviewToRemove.clinician}.`
        }));
      });
      
      toast.success("Review removed successfully");
      setReviewToRemove(null);
    }
  };

  const getReportStatus = (apt: Appointment) => {
    if (apt.review?.isHidden) return "Removed";
    if (apt.review?.isReported) return "Reported";
    return "Published";
  };

  const columns: AdminTableColumn<Appointment>[] = useMemo(() => [
    {
      key: "patient",
      title: "Patient",
      render: (apt) => {
        const email = apt.patientInfo?.email || `${apt.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
        const initial = apt.patient.name.charAt(0).toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
              {initial}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-slate-900">{apt.patient.name}</span>
              <span className="text-xs text-slate-500">{email}</span>
            </div>
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
      key: "rating",
      title: "Rating",
      render: (apt) => {
        const rating = apt.review?.rating || 0;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-sm tracking-widest">
              {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
            </span>
            <span className="font-medium text-slate-700">{rating.toFixed(1)}</span>
          </div>
        );
      },
    },
    {
      key: "review",
      title: "Review",
      render: (apt) => (
        <p className="text-slate-600 text-sm max-w-[200px] lg:max-w-xs truncate" title={apt.review?.text || "No text provided"}>
          {apt.review?.text || "No text provided"}
        </p>
      ),
    },
    {
      key: "date",
      title: "Date",
      render: (apt) => {
        const dateStr = apt.review?.createdAt || apt.startsAt;
        return (
          <span className="text-sm text-slate-700">
            {new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "reportStatus",
      title: "Report Status",
      render: (apt) => {
        const status = getReportStatus(apt);
        return (
          <div className="flex items-center gap-1.5">
            {status === "Reported" && <span title="Reported" className="text-red-500 text-xs">🚩</span>}
            <AdminStatusBadge status={status} />
          </div>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (apt) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedReview(apt)}
            className="text-xs font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          >
            View Details
          </button>
          
          {/* Three dot action menu mockup to visually replace raw buttons if removed */}
          <div className="relative group">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors border border-transparent">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
              {getReportStatus(apt) === "Reported" && canApprove && (
                <button
                  onClick={() => setReviewToRemove(apt)}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remove Review
                </button>
              )}
            </div>
          </div>
        </div>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Management</h1>
          <p className="text-slate-500 mt-1">Monitor patient feedback and manage reported reviews.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Reviews
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.totalReviews}</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Average Rating</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-slate-900">{kpis.averageRating}</p>
              <span className="text-emerald-500 text-sm">★</span>
            </div>
          </div>
        </div>

        {/* Reported */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Reported Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.reportedReviews}</p>
          </div>
        </div>

        {/* Removed */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Removed Reviews</p>
            <p className="text-2xl font-bold text-slate-900">{kpis.removedReviews}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <AdminSearch 
              placeholder="Search by patient, doctor or review content..." 
              value={searchTerm} 
              onChange={setSearchTerm} 
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:w-auto shrink-0">
            <AdminFilter
              options={doctorOptions}
              value={doctorFilter}
              onChange={setDoctorFilter}
            />
            <AdminFilter
              options={[
                { label: "All Ratings", value: "all" },
                { label: "5 Stars", value: "5" },
                { label: "4 Stars", value: "4" },
                { label: "3 Stars", value: "3" },
                { label: "2 Stars", value: "2" },
                { label: "1 Star", value: "1" },
              ]}
              value={ratingFilter}
              onChange={setRatingFilter}
            />
            <AdminFilter
              options={[
                { label: "All Statuses", value: "all" },
                { label: "Published", value: "published" },
                { label: "Reported", value: "reported" },
                { label: "Removed", value: "removed" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
            />
            <div className="w-full relative">
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>
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
          {filteredReviews.length > 0 ? (
            <>
              <AdminTable data={paginatedReviews} columns={columns} keyExtractor={(apt) => apt.id} />
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                <div>
                  Showing {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredReviews.length)} to {Math.min(validCurrentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
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
              title="No reviews found"
              description="Try adjusting your search or filters to find what you're looking for."
              icon={
                <svg className="size-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
          )}
        </div>
      </div>

      {/* Review Details Modal */}
      <AdminModal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">Rating</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-xl tracking-widest">
                    {"★".repeat(Math.floor(selectedReview.review?.rating || 0))}
                    {"☆".repeat(5 - Math.floor(selectedReview.review?.rating || 0))}
                  </span>
                  <span className="font-bold text-slate-900 text-lg ml-1">
                    {(selectedReview.review?.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <AdminStatusBadge status={getReportStatus(selectedReview)} />
                {selectedReview.review?.isReported && !selectedReview.review?.isHidden && (
                  <span className="text-red-500 text-xs flex items-center gap-1">
                    🚩 Reported
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">Review Content</p>
              <p className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                &quot;{selectedReview.review?.text || "No text provided"}&quot;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-slate-500 mb-1">Patient</p>
                <p className="font-medium text-slate-900">{selectedReview.patient.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedReview.patientInfo?.email || `${selectedReview.patient.name.toLowerCase().replace(/\s+/g, '.')}@example.com`}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Doctor</p>
                <p className="font-medium text-slate-900">{selectedReview.clinician}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedReview.specialty || "General Medicine"}</p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Date</p>
                <p className="font-medium text-slate-900">
                  {new Date(selectedReview.review?.createdAt || selectedReview.startsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Appointment ID</p>
                <p className="font-medium text-slate-900 font-mono text-xs">{selectedReview.id}</p>
              </div>
            </div>

            {selectedReview.review?.isReported && (
              <div className="mt-4 bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-700/80 mb-1 text-xs font-semibold uppercase tracking-wider">Report Reason</p>
                <p className="font-medium text-red-900 text-sm">
                  {selectedReview.review.reportReason || "Violation of community guidelines"}
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-5 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
              >
                Close
              </button>
              {getReportStatus(selectedReview) === "Reported" && canApprove && (
                <button
                  onClick={() => {
                    setSelectedReview(null);
                    setReviewToRemove(selectedReview);
                  }}
                  className="px-5 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm"
                >
                  Remove Review
                </button>
              )}
            </div>
          </div>
        )}
      </AdminModal>

      {/* Remove Confirmation Modal */}
      <AdminModal
        isOpen={!!reviewToRemove}
        onClose={() => setReviewToRemove(null)}
        title="Remove Review?"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Are you sure you want to remove this review? It will no longer be visible to users on the platform.
          </p>
          
          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => setReviewToRemove(null)}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveReview}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Remove Review
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
