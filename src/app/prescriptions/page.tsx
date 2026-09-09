"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Appointment } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { getPrescriptionsForPatient } from "@/lib/prescription-store";
import { UserPrescription } from "@/features/user-portal/components/UserPrescription";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useAppointmentStore } from "@/store/appointmentStore";

export default function PrescriptionsTimelinePage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientName, setPatientName] = useState<string | null>(null);

  const [viewingPrescription, setViewingPrescription] = useState<{apt: Appointment, p: Prescription} | null>(null);
  const [filter, setFilter] = useState<"all" | "prescriptions">("all");

  const { patient } = useAuthStore();
  const allAppointments = useAppointmentStore(state => state.appointments);

  useEffect(() => {
    if (!patient || patient.role !== "patient") {
      router.push("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPatientName(patient.name);

    const patientAppointments = allAppointments.filter(a => a.patient.name === patient.name);
    setAppointments(patientAppointments);

    const patientPrescriptions = getPrescriptionsForPatient(patient.name);
    setPrescriptions(patientPrescriptions);
    setIsLoading(false);
  }, [patient, allAppointments, router]);

  // Keep prescription sync via legacy events (prescription store not yet migrated)
  useEffect(() => {
    if (!patient) return;
    const syncPrescriptions = () => {
      setPrescriptions(getPrescriptionsForPatient(patient.name));
    };
    window.addEventListener("schedula_prescriptions_updated", syncPrescriptions);
    return () => {
      window.removeEventListener("schedula_prescriptions_updated", syncPrescriptions);
    };
  }, [patient]);

  const timelineItems = useMemo(() => {
    const items: Array<{
      type: "prescription" | "appointment";
      date: string;
      appointment: Appointment;
      prescription?: Prescription;
    }> = [];

    // Map prescriptions
    prescriptions.forEach(p => {
      const apt = appointments.find(a => a.id === p.appointmentId);
      if (apt) {
        items.push({
          type: "prescription",
          date: p.createdAt,
          appointment: apt,
          prescription: p
        });
      }
    });

    // Map appointments that don't have a prescription
    appointments.forEach(apt => {
      // Only include past/completed appointments in timeline, or all? Let's include completed/missed/cancelled
      if (["completed", "missed", "cancelled"].includes(apt.status)) {
        const hasPrescription = prescriptions.some(p => p.appointmentId === apt.id);
        if (!hasPrescription && filter === "all") {
          items.push({
            type: "appointment",
            date: apt.startsAt,
            appointment: apt
          });
        }
      }
    });

    // Sort descending by date
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, prescriptions, filter]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-1/4 animate-pulse rounded-lg bg-stone-200 mb-8" />
          <div className="space-y-6 border-l-2 border-stone-200 ml-4 pl-6">
             {[1,2,3].map(i => (
               <div key={i} className="h-32 w-full animate-pulse rounded-2xl bg-stone-100" />
             ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black font-serif text-text-primary tracking-tight">Health Timeline</h1>
            <p className="mt-2 text-text-secondary">Your medical history, prescriptions, and past visits.</p>
          </div>
          
          <div className="flex bg-white rounded-xl p-1 border border-border shadow-sm shrink-0 w-fit">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === "all" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >
              All Events
            </button>
            <button 
              onClick={() => setFilter("prescriptions")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === "prescriptions" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >
              Prescriptions Only
            </button>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-16 text-center shadow-sm">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-primary mb-6">
              <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold font-serif text-text-primary mb-2">No records found</h3>
            <p className="text-text-secondary max-w-md mx-auto mb-8">
              {filter === "prescriptions" 
                ? "You don't have any digital prescriptions yet. They will appear here after your doctor issues them."
                : "Your health timeline is currently empty. Book an appointment to get started."}
            </p>
            <Link href="/doctors" className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark">
              Find a Doctor
            </Link>
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-4 sm:ml-6 space-y-12 pb-12">
            {timelineItems.map((item) => {
              const dateObj = parseISO(item.date);
              const dateFormatted = format(dateObj, "MMM d, yyyy");
              const timeFormatted = format(dateObj, "h:mm a");

              if (item.type === "prescription" && item.prescription) {
                return (
                  <div key={`rx-${item.prescription.id}`} className="relative pl-8 sm:pl-12">
                    {/* Timeline Node */}
                    <div className="absolute -left-[17px] top-1 grid size-8 place-items-center rounded-full bg-primary text-white shadow-[0_0_0_4px_var(--color-background)]">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    <div className="group rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                              Prescription Issued
                            </span>
                            <span className="text-sm font-medium text-text-secondary">{dateFormatted} at {timeFormatted}</span>
                          </div>
                          <h3 className="text-xl font-bold font-serif text-text-primary mb-1">
                            {item.prescription.diagnosis || "Medical Prescription"}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Issued by <span className="font-semibold text-text-primary">Dr. {item.appointment.clinician}</span> ({item.appointment.specialty})
                          </p>
                        </div>
                        <Button 
                          onClick={() => setViewingPrescription({ apt: item.appointment, p: item.prescription! })}
                          className="shrink-0"
                        >
                          View Prescription
                        </Button>
                      </div>

                      {/* Medicines Preview */}
                      {item.prescription.medicines.length > 0 && (
                        <div className="mt-6 rounded-xl bg-stone-50 border border-border/50 p-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Prescribed Medications</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {item.prescription.medicines.slice(0, 4).map((med, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                  <svg className="size-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6 10a4 4 0 118 0 4 4 0 01-8 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-text-primary">{med.name}</p>
                                  <p className="text-xs font-medium text-text-secondary">{med.dosage} &bull; {med.frequency}</p>
                                </div>
                              </div>
                            ))}
                            {item.prescription.medicines.length > 4 && (
                              <div className="flex items-center text-sm font-bold text-primary pl-9">
                                + {item.prescription.medicines.length - 4} more medications
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Normal Appointment
              return (
                <div key={`apt-${item.appointment.id}`} className="relative pl-8 sm:pl-12">
                  <div className="absolute -left-[13px] top-2 grid size-6 place-items-center rounded-full bg-stone-200 text-stone-500 shadow-[0_0_0_4px_var(--color-background)]">
                    <div className="size-2 rounded-full bg-stone-400" />
                  </div>
                  
                  <div className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.appointment.status === 'completed' ? 'bg-green-100 text-green-700' : 
                        item.appointment.status === 'missed' ? 'bg-red-100 text-red-700' : 
                        item.appointment.status === 'cancelled' ? 'bg-stone-100 text-stone-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {item.appointment.status.charAt(0).toUpperCase() + item.appointment.status.slice(1)} Appointment
                      </span>
                      <span className="text-sm font-medium text-text-secondary">{dateFormatted} at {timeFormatted}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-1">
                      Consultation with Dr. {item.appointment.clinician}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {item.appointment.specialty} &bull; {item.appointment.durationMinutes} mins
                    </p>
                    {item.appointment.reason && (
                      <p className="mt-3 text-sm text-text-primary italic">
                        &quot;{item.appointment.reason}&quot;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
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
    </main>
  );
}
