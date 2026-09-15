"use client";
import { useAppSelector } from "@/store/hooks";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Appointment } from "@/types/appointment";
import type { Prescription } from "@/types/prescription";
import { getPrescriptionsForPatient } from "@/lib/prescription-store";
import { UserPrescription } from "@/features/user-portal/components/UserPrescription";
import { format, parseISO } from "date-fns";

type FilterType = "all" | "appointments" | "prescriptions" | "completed" | "cancelled";

export default function HealthJourneyPage() {
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [viewingPrescription, setViewingPrescription] = useState<{apt: Appointment, p: Prescription} | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { patient } = useAppSelector(state => state.auth);
  const allAppointments = useAppSelector(state => state.appointments.appointments);

  useEffect(() => {
    if (!patient || patient.role !== "patient") {
      router.push("/login");
      return;
    }

    const patientAppointments = allAppointments.filter(a => a.patient.name === patient.name);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAppointments(patientAppointments);

    const patientPrescriptions = getPrescriptionsForPatient(patient.name);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrescriptions(patientPrescriptions);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, [patient, allAppointments, router]);

  useEffect(() => {
    if (!patient) return;
    const syncPrescriptions = () => {
      setPrescriptions(getPrescriptionsForPatient(patient.name));
    };
    window.addEventListener("schedula_prescriptions_updated", syncPrescriptions);
    return () => window.removeEventListener("schedula_prescriptions_updated", syncPrescriptions);
  }, [patient]);

  // Derived Metrics
  const totalVisits = appointments.length;
  const completedVisits = appointments.filter(a => a.status === "completed").length;
  const totalPrescriptions = prescriptions.length;
  const upcomingAppointments = appointments.filter(a => new Date(a.startsAt) > new Date() && ["pending", "confirmed"].includes(a.status));
  const nextAppointment = upcomingAppointments.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

  const timelineItems = useMemo(() => {
    let items: Array<{
      id: string;
      type: "prescription" | "appointment";
      date: string;
      appointment: Appointment;
      prescription?: Prescription;
    }> = [];

    // Map appointments
    appointments.forEach(apt => {
      items.push({
        id: `apt-${apt.id}`,
        type: "appointment",
        date: apt.startsAt,
        appointment: apt
      });
    });

    // Map prescriptions
    prescriptions.forEach(p => {
      const apt = appointments.find(a => a.id === p.appointmentId);
      if (apt) {
        items.push({
          id: `rx-${p.id}`,
          type: "prescription",
          date: p.createdAt,
          appointment: apt,
          prescription: p
        });
      }
    });

    // Filtering
    if (filter === "appointments") {
      items = items.filter(i => i.type === "appointment");
    } else if (filter === "prescriptions") {
      items = items.filter(i => i.type === "prescription");
    } else if (filter === "completed") {
      items = items.filter(i => i.type === "appointment" && i.appointment.status === "completed");
    } else if (filter === "cancelled") {
      items = items.filter(i => i.type === "appointment" && i.appointment.status === "cancelled");
    }

    // Search
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      items = items.filter(i => {
        if (i.appointment.clinician.toLowerCase().includes(query)) return true;
        if (i.appointment.specialty?.toLowerCase().includes(query)) return true;
        if (i.appointment.reason?.toLowerCase().includes(query)) return true;
        if (i.prescription?.diagnosis?.toLowerCase().includes(query)) return true;
        if (i.prescription?.medicines.some(m => m.name.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, prescriptions, filter, searchQuery]);

  const formatClinicianName = (name: string) => {
    return name;
  };

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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-text-primary tracking-tight">Health Journey</h1>
          <p className="mt-2 text-text-secondary">Your complete history of appointments, prescriptions, and healthcare activity.</p>
        </div>

        {/* Health Summary & Insights */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">Total Visits</span>
            <span className="text-3xl font-black text-primary">{totalVisits}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">Completed</span>
            <span className="text-3xl font-black text-success">{completedVisits}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">Prescriptions</span>
            <span className="text-3xl font-black text-indigo-600">{totalPrescriptions}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-center">
            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-1">Upcoming</span>
            <span className="text-3xl font-black text-amber-600">{upcomingAppointments.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-primary/5 rounded-2xl p-5 border border-primary/20">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Health Insights</h3>
            <ul className="space-y-1.5 text-sm text-text-secondary font-medium">
              {completedVisits > 0 && <li>&bull; You have {completedVisits} completed appointments in your history.</li>}
              {totalPrescriptions > 0 && <li>&bull; You have {totalPrescriptions} prescriptions in your health history.</li>}
              {nextAppointment && <li>&bull; You have an upcoming appointment on {format(parseISO(nextAppointment.startsAt), "MMM d, yyyy")} with {formatClinicianName(nextAppointment.clinician)}.</li>}
              {completedVisits === 0 && totalPrescriptions === 0 && <li>&bull; Your health journey is just beginning. Book your first appointment!</li>}
            </ul>
          </div>
          {nextAppointment ? (
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Next Appointment
              </h3>
              <p className="font-bold text-text-primary mb-0.5">{formatClinicianName(nextAppointment.clinician)}</p>
              <p className="text-sm text-text-secondary mb-3">{format(parseISO(nextAppointment.startsAt), "MMM d")} at {format(parseISO(nextAppointment.startsAt), "h:mm a")}</p>
              <Link href={`/confirmation/${nextAppointment.id}`} className="mt-auto block w-full text-center py-2 bg-background0 text-text-primary text-sm font-bold rounded-lg hover:bg-stone-200 transition-colors">
                View Details
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-text-secondary text-sm font-medium mb-3">No upcoming appointments.</span>
              <Link href="/doctors" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors">
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* Controls: Search & Filters */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search your health history..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-text-primary"
              >
                &times;
              </button>
            )}
          </div>
          
          <div className="flex bg-white rounded-xl p-1 border border-border shadow-sm shrink-0 overflow-x-auto">
            {(["all", "appointments", "prescriptions", "completed", "cancelled"] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 whitespace-nowrap rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {timelineItems.length === 0 ? (
          <div className="rounded-3xl border border-border bg-white p-12 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-stone-100 text-stone-400 mb-4">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-text-primary mb-2">No matching records found</h3>
            <p className="text-text-secondary mb-6">
              {searchQuery ? "Try adjusting your search terms or clearing the search." : filter !== "all" ? `You don't have any ${filter} records yet.` : "Your health history is empty."}
            </p>
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="px-5 py-2.5 rounded-xl border border-border bg-white font-bold text-text-primary hover:bg-stone-50">Clear Search</button>
            ) : (
              <Link href="/doctors" className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary-dark">Find a Doctor</Link>
            )}
          </div>
        ) : (
          <div className="relative border-l-2 border-stone-200 ml-4 sm:ml-6 space-y-8 pb-12">
            {timelineItems.map((item) => {
              const dateObj = parseISO(item.date);
              const dateFormatted = format(dateObj, "MMM d, yyyy");
              const timeFormatted = format(dateObj, "h:mm a");

              if (item.type === "prescription" && item.prescription) {
                return (
                  <div key={item.id} className="relative pl-8 sm:pl-10">
                    <div className="absolute -left-[17px] top-1 grid size-8 place-items-center rounded-full bg-indigo-600 text-white shadow-[0_0_0_4px_var(--color-background)]">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    <div className="group rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                              Prescription Issued
                            </span>
                            <span className="text-sm font-medium text-text-secondary">{dateFormatted}</span>
                          </div>
                          <h3 className="text-xl font-bold font-serif text-text-primary mb-1">
                            {item.prescription.diagnosis || "Medical Prescription"}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Issued by <span className="font-semibold text-text-primary">{formatClinicianName(item.appointment.clinician)}</span>
                          </p>
                          <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Linked to appointment on {format(parseISO(item.appointment.startsAt), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Button 
                          onClick={() => setViewingPrescription({ apt: item.appointment, p: item.prescription! })}
                          className="shrink-0 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                        >
                          View Prescription
                        </Button>
                      </div>

                      {item.prescription.medicines.length > 0 && (
                        <div className="mt-4 rounded-xl bg-stone-50 border border-stone-200 p-3">
                          <div className="flex flex-wrap gap-2">
                            {item.prescription.medicines.slice(0, 3).map((med, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-text-primary border border-stone-200 shadow-sm">
                                <svg className="size-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6 10a4 4 0 118 0 4 4 0 01-8 0z" /></svg>
                                {med.name}
                              </span>
                            ))}
                            {item.prescription.medicines.length > 3 && (
                              <span className="inline-flex items-center rounded-lg bg-stone-100 px-3 py-1.5 text-sm font-bold text-stone-600 border border-stone-200">
                                +{item.prescription.medicines.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Normal Appointment
              const hasPrescription = prescriptions.some(p => p.appointmentId === item.appointment.id);
              
              return (
                <div key={item.id} className="relative pl-8 sm:pl-10">
                  <div className={`absolute -left-[13px] top-2 grid size-6 place-items-center rounded-full shadow-[0_0_0_4px_var(--color-background)] ${
                    item.appointment.status === 'completed' ? 'bg-success/20 text-success' : 
                    item.appointment.status === 'cancelled' ? 'bg-error/20 text-error' : 
                    'bg-primary/20 text-primary'
                  }`}>
                    <div className={`size-2 rounded-full ${
                      item.appointment.status === 'completed' ? 'bg-success' : 
                      item.appointment.status === 'cancelled' ? 'bg-error' : 
                      'bg-primary'
                    }`} />
                  </div>
                  
                  <div className="rounded-2xl border border-border bg-white p-5 shadow-sm transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.appointment.status === 'completed' ? 'bg-success/10 text-success' : 
                          item.appointment.status === 'missed' ? 'bg-amber-100 text-amber-700' : 
                          item.appointment.status === 'cancelled' ? 'bg-error/10 text-error' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {item.appointment.status.charAt(0).toUpperCase() + item.appointment.status.slice(1)} Appointment
                        </span>
                        <span className="text-sm font-medium text-text-secondary">{dateFormatted} at {timeFormatted}</span>
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-1">
                        {formatClinicianName(item.appointment.clinician)}
                      </h3>
                      <p className="text-sm text-text-secondary mb-2">
                        {item.appointment.specialty} &bull; {item.appointment.durationMinutes} mins
                      </p>
                      {item.appointment.reason && (
                        <p className="text-sm text-text-primary bg-stone-50 rounded-lg p-2.5 border border-stone-100 inline-block">
                          &quot;{item.appointment.reason}&quot;
                        </p>
                      )}
                      
                      {hasPrescription && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 w-fit px-2.5 py-1 rounded-md">
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Prescription in records
                        </div>
                      )}
                    </div>
                    
                    <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                      <Link href={`/confirmation/${item.appointment.id}`} className="block w-full text-center px-4 py-2 bg-background0 text-text-primary text-sm font-bold rounded-lg hover:bg-stone-200 transition-colors border border-border">
                        View Details
                      </Link>
                    </div>
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
