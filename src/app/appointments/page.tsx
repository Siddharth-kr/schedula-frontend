"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { getAppointmentsForPatient, addReview } from "@/lib/appointment-store";
import { getPrescriptionByAppointmentId } from "@/lib/prescription-store";
import { UserPrescription } from "@/features/user-portal/components/UserPrescription";
import { toast } from "react-toastify";

type FilterStatus = "all" | AppointmentStatus;

export default function PatientAppointmentsPage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Record<string, Prescription>>({});
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState<string | null>(null);

  const [viewingPrescription, setViewingPrescription] = useState<{apt: Appointment, p: Prescription} | null>(null);
  const [reviewingApt, setReviewingApt] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const loadData = () => {
    try {
      const stored = localStorage.getItem("mock_user");
      if (!stored) {
        router.push("/login");
        return;
      }
      const user = JSON.parse(stored);
      if (user.role !== "patient") {
        router.push("/login");
        return;
      }
      setPatientName(user.name);

      const patientAppointments = getAppointmentsForPatient(user.name);
      patientAppointments.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      setAppointments(patientAppointments);

      const pMap: Record<string, Prescription> = {};
      for (const apt of patientAppointments) {
        if (apt.status === "completed") {
          const p = getPrescriptionByAppointmentId(apt.id);
          if (p) pMap[apt.id] = p;
        }
      }
      setPrescriptions(pMap);
    } catch {
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_appointments" || e.key === "schedula_prescriptions") loadData();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_appointments_updated", loadData);
    window.addEventListener("schedula_prescriptions_updated", loadData);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_appointments_updated", loadData);
      window.removeEventListener("schedula_prescriptions_updated", loadData);
    };
  }, [router]);

  const filteredAppointments = useMemo(() => {
    if (filter === "all") return appointments;
    return appointments.filter(a => a.status === filter);
  }, [appointments, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "long", day: "numeric" }).format(date);
  };

  const formatTime = (startString: string, durationMin: number) => {
    const start = new Date(startString);
    const end = new Date(start.getTime() + durationMin * 60000);
    const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewingApt) {
      addReview(reviewingApt.id, { rating, text: reviewText });
      toast.success("Review submitted successfully");
      setReviewingApt(null);
      loadData();
    }
  };

  if (!patientName) return null;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 pb-4 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-serif mb-2">My Appointments</h1>
            <p className="text-text-secondary">View and manage your upcoming and previous appointments.</p>
          </div>
          <Link href="/doctors" className="shrink-0">
            <Button type="button" variant="accent">Book an Appointment</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-text-secondary space-y-4">
            <p className="font-medium">Loading your appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl bg-white border border-border p-8 text-center flex flex-col items-center shadow-sm">
            <h3 className="text-xl font-bold text-text-primary font-serif mb-2">No appointments yet</h3>
            <p className="text-text-secondary mb-8 max-w-md">You haven&apos;t booked any appointments yet.</p>
            <Link href="/doctors">
              <Button type="button" className="px-8">Find a Doctor</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
              {(["all", "upcoming", "completed", "cancelled", "missed"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === status 
                      ? "bg-primary-dark text-white shadow-sm" 
                      : "bg-white border border-border text-text-secondary hover:border-primary hover:text-text-primary"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-text-secondary">No appointments found for the selected filter.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredAppointments.map((apt) => (
                  <div key={apt.id} className="flex flex-col bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between p-6 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                          Dr. {apt.clinician}
                        </h3>
                        <p className="text-sm font-medium text-text-secondary mb-3">{apt.specialty}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-text-primary">
                          <span className="font-medium">{formatDate(apt.startsAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <span>{formatTime(apt.startsAt, apt.durationMinutes)}</span>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end sm:text-right gap-4 border-t border-border sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                        {apt.status === "completed" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Completed</span>}
                        {apt.status === "confirmed" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success">Confirmed</span>}
                        {apt.status === "pending" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-background0/10 text-text-secondary">Pending</span>}
                        {apt.status === "cancelled" && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-error/10 text-error">Cancelled</span>}
                        
                        <Link href={`/confirmation/${apt.id}`}>
                          <button className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-all">
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>

                    {apt.status === "completed" && (
                      <div className="bg-background border-t border-border px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-2">
                          {prescriptions[apt.id] ? (
                            <>
                              <span className="text-sm font-bold text-emerald-600">Prescription Available</span>
                              <button onClick={() => setViewingPrescription({apt, p: prescriptions[apt.id]})} className="text-sm font-semibold text-primary hover:underline border-l pl-2 ml-2 border-border">
                                View Prescription
                              </button>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-text-secondary">Prescription Not Available</span>
                          )}
                        </div>
                        <div className="flex gap-3 items-center">
                          {!apt.review ? (
                            <button onClick={() => setReviewingApt(apt)} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors">
                              Review
                            </button>
                          ) : (
                            <span className="text-sm text-text-secondary">★ {apt.review.rating}/5</span>
                          )}
                          <Link href={`/booking/${apt.doctorId}`}>
                            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark transition-colors">
                              Rebook
                            </button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {viewingPrescription && (
        <UserPrescription 
          prescription={viewingPrescription.p} 
          appointment={viewingPrescription.apt} 
          onClose={() => setViewingPrescription(null)} 
        />
      )}

      {reviewingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">How was your appointment?</h2>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Rating</label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))} className="w-full rounded-lg border border-border px-3 py-2 outline-none">
                  <option value={5}>★★★★★ (5)</option>
                  <option value={4}>★★★★☆ (4)</option>
                  <option value={3}>★★★☆☆ (3)</option>
                  <option value={2}>★★☆☆☆ (2)</option>
                  <option value={1}>★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Review (Optional)</label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} className="w-full rounded-lg border border-border px-3 py-2 outline-none" placeholder="Write your review..."></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReviewingApt(null)} className="px-4 py-2 text-sm font-medium text-text-secondary">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
