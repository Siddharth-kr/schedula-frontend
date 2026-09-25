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
    <main className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1440px]">
        
        {/* PAGE HEADER */}
        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none rounded-r-2xl" />
          <div className="size-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-blue-100 shrink-0 relative z-10">
            <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif mb-1">Health Journey</h1>
            <p className="text-slate-500 text-sm">Your complete history of appointments, prescriptions, and healthcare activity.</p>
          </div>
        </div>

        {/* SUMMARY STATISTICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Visits</span>
            </div>
            <span className="text-3xl font-black text-slate-900 ml-11">{totalVisits}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            </div>
            <span className="text-3xl font-black text-slate-900 ml-11">{completedVisits}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions</span>
            </div>
            <span className="text-3xl font-black text-slate-900 ml-11">{totalPrescriptions}</span>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming</span>
            </div>
            <span className="text-3xl font-black text-slate-900 ml-11">{upcomingAppointments.length}</span>
          </div>
        </div>

        {/* HEALTH INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Health Insights
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 font-medium">
              {completedVisits > 0 && <li>&bull; You have <span className="font-bold text-slate-900">{completedVisits}</span> completed appointments in your history.</li>}
              {totalPrescriptions > 0 && <li>&bull; You have <span className="font-bold text-slate-900">{totalPrescriptions}</span> prescriptions in your health history.</li>}
              {nextAppointment && <li>&bull; You have an upcoming appointment on <span className="font-bold text-slate-900">{format(parseISO(nextAppointment.startsAt), "MMM d, yyyy")}</span> with <span className="font-bold text-slate-900">{formatClinicianName(nextAppointment.clinician)}</span>.</li>}
              {completedVisits === 0 && totalPrescriptions === 0 && <li>&bull; Your health journey is just beginning. Book your first appointment!</li>}
            </ul>
          </div>
          {nextAppointment ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400" />
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Next Appointment
              </h3>
              <p className="font-bold text-slate-900 mb-0.5 text-lg">{formatClinicianName(nextAppointment.clinician)}</p>
              <p className="text-sm text-slate-500 mb-4">{format(parseISO(nextAppointment.startsAt), "MMM d, yyyy")} at {format(parseISO(nextAppointment.startsAt), "h:mm a")}</p>
              <Link href={`/confirmation/${nextAppointment.id}`} className="mt-auto block w-full text-center py-2.5 bg-slate-50 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 hover:text-primary transition-colors border border-slate-200">
                View Details
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
              <div className="size-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-3">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-slate-500 text-sm font-medium mb-4">No upcoming appointments.</span>
              <Link href="/doctors" className="px-6 py-2.5 bg-[#FF5A5F] text-white text-sm font-bold rounded-xl hover:bg-[#e0484d] transition-colors shadow-sm">
                Book Now
              </Link>
            </div>
          )}
        </div>

        {/* CONTROLS: SEARCH & FILTERS */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
          <div className="relative w-full xl:max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search your health history..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-shadow text-sm font-medium placeholder:text-slate-400 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar w-full xl:w-auto">
            {(['all', 'appointments', 'prescriptions', 'completed', 'cancelled'] as const).map(f => {
              const isActive = filter === f;
              let label = f.charAt(0).toUpperCase() + f.slice(1);
              if (f === 'all') label = 'All Records';
              
              return (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
                    isActive 
                      ? 'bg-[#0F2747] border-[#0F2747] text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TIMELINE */}
        {timelineItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm flex flex-col items-center">
            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
              <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">No matching records found</h3>
            <p className="text-slate-500 mb-8 max-w-md text-sm">
              {searchQuery ? "Try adjusting your search terms or clearing the search." : filter !== "all" ? `You don't have any ${filter} records yet.` : "Your health history is empty."}
            </p>
            {searchQuery ? (
              <button onClick={() => setSearchQuery("")} className="px-6 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors text-sm">Clear Search</button>
            ) : (
              <Link href="/doctors" className="inline-flex rounded-xl bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-primary-dark shadow-sm text-sm">Find a Doctor</Link>
            )}
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-6 pb-12">
            {timelineItems.map((item) => {
              const dateObj = parseISO(item.date);
              const dateFormatted = format(dateObj, "MMM d, yyyy");
              const timeFormatted = format(dateObj, "h:mm a");

              if (item.type === "prescription" && item.prescription) {
                return (
                  <div key={item.id} className="relative pl-8 sm:pl-10">
                    {/* Timeline Marker */}
                    <div className="absolute -left-[17px] top-4 grid size-8 place-items-center rounded-full bg-indigo-50 text-indigo-600 shadow-[0_0_0_4px_#F8FAFC] border border-indigo-200">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    
                    {/* Prescription Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
                      
                      {/* Top Row: Status & Date & Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 uppercase tracking-wider border border-indigo-100">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Prescription Issued
                          </span>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {dateFormatted}
                          </div>
                        </div>
                        <button 
                          onClick={() => setViewingPrescription({ apt: item.appointment, p: item.prescription! })}
                          className="flex items-center justify-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50/50 hover:bg-indigo-100 px-4 py-2 rounded-xl border border-indigo-100 w-full sm:w-auto"
                        >
                          View Prescription
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>

                      {/* Main Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                          {item.prescription.diagnosis || "Medical Prescription"}
                        </h3>
                        <p className="text-sm text-slate-500 mb-2">
                          Issued by <span className="font-bold text-slate-700">{formatClinicianName(item.appointment.clinician)}</span>
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600">
                          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          Linked to appointment on {format(parseISO(item.appointment.startsAt), "MMM d, yyyy")}
                        </div>
                      </div>

                      {/* Medicines */}
                      {item.prescription.medicines.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.prescription.medicines.slice(0, 3).map((med, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold text-slate-700 border border-slate-200 shadow-sm">
                              <svg className="size-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6 10a4 4 0 118 0 4 4 0 01-8 0z" /></svg>
                              {med.name}
                            </span>
                          ))}
                          {item.prescription.medicines.length > 3 && (
                            <span className="inline-flex items-center rounded-lg bg-slate-50 px-3 py-1.5 text-[13px] font-bold text-slate-500 border border-slate-200">
                              +{item.prescription.medicines.length - 3} more
                            </span>
                          )}
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
                  {/* Timeline Marker */}
                  <div className={`absolute -left-[13px] top-5 grid size-6 place-items-center rounded-full shadow-[0_0_0_4px_#F8FAFC] ${
                    item.appointment.status === "completed" || item.appointment.status === "confirmed" ? "bg-emerald-50 border border-emerald-200" : 
                    item.appointment.status === "cancelled" ? "bg-red-50 border border-red-200" : 
                    item.appointment.status === "missed" ? "bg-slate-100 border border-slate-200" :
                    "bg-amber-50 border border-amber-200"
                  }`}>
                    <div className={`size-2.5 rounded-full ${
                      item.appointment.status === "completed" || item.appointment.status === "confirmed" ? "bg-emerald-500" : 
                      item.appointment.status === "cancelled" ? "bg-red-500" : 
                      item.appointment.status === "missed" ? "bg-slate-400" :
                      "bg-amber-500"
                    }`} />
                  </div>
                  
                  {/* Appointment Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
                    
                    {/* Status colored left border */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      item.appointment.status === "completed" || item.appointment.status === "confirmed" ? "bg-emerald-500" :
                      item.appointment.status === "cancelled" ? "bg-red-500" :
                      item.appointment.status === "missed" ? "bg-slate-400" :
                      "bg-amber-400"
                    }`} />

                    {/* Top Row: Status & Date & Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100 pl-2">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${
                          item.appointment.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                          item.appointment.status === "missed" ? "bg-slate-50 text-slate-600 border-slate-200" : 
                          item.appointment.status === "cancelled" ? "bg-red-50 text-red-600 border-red-100" :
                          "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {item.appointment.status} Appointment
                        </span>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {dateFormatted}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hidden sm:flex">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {timeFormatted}
                        </div>
                      </div>
                      <Link href={`/confirmation/${item.appointment.id}`} className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-700 hover:text-primary transition-colors bg-white hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                        View Details
                        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </div>

                    {/* Main Info */}
                    <div className="pl-2">
                      <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                        {formatClinicianName(item.appointment.clinician)}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 mb-3">
                        {item.appointment.specialty} &bull; {item.appointment.durationMinutes} mins
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        {item.appointment.reason && (
                          <div className="text-[13px] font-medium text-slate-700 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                            &quot;{item.appointment.reason}&quot;
                          </div>
                        )}
                        
                        {hasPrescription && (
                          <div className="flex items-center gap-1.5 text-[13px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg">
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Prescription in records
                          </div>
                        )}
                      </div>
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
