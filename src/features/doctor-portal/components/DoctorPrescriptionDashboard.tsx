"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getDoctorSession } from "@/lib/availability-store";
import { getPrescriptionsForDoctor } from "@/lib/prescription-store";
import { getAppointmentsForDoctor } from "@/lib/appointment-store";
import type { Prescription } from "@/types/prescription";
import { format, parseISO } from "date-fns";

export function DoctorPrescriptionDashboard() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    const myPrescriptions = getPrescriptionsForDoctor(session.id);
    
    // Sort by most recent first
    myPrescriptions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setPrescriptions(myPrescriptions);
    setIsLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_prescriptions") loadData();
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("schedula_prescriptions_updated", loadData);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("schedula_prescriptions_updated", loadData);
    };
  }, [router]);

  const filtered = prescriptions.filter(p => 
    p.patientId.toLowerCase().includes(search.toLowerCase()) || 
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[var(--ink)]">Prescriptions</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Manage digital prescriptions for your patients.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search by patient or diagnosis..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] pl-9 pr-4 py-2.5 text-sm focus:border-[var(--brand)] outline-none bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[var(--line)]">
        {isLoading ? (
          <div className="p-10 text-center text-[var(--muted)] text-sm">Loading prescriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-slate-100 text-[var(--muted)] mb-4">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-[var(--ink)]">No prescriptions yet</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Create a prescription from a completed appointment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-[var(--line)]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[var(--muted)]">Patient</th>
                  <th className="px-6 py-4 font-semibold text-[var(--muted)]">Diagnosis</th>
                  <th className="px-6 py-4 font-semibold text-[var(--muted)]">Last Updated</th>
                  <th className="px-6 py-4 font-semibold text-[var(--muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-[var(--ink)]">{p.patientId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[var(--ink)]">{p.diagnosis}</p>
                      <p className="text-xs text-[var(--muted)] mt-1">{p.medicines.length} medicine(s)</p>
                    </td>
                    <td className="px-6 py-4 text-[var(--muted)]">
                      {format(parseISO(p.updatedAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/doctor/appointments/${p.appointmentId}`} className="text-[var(--brand)] font-bold hover:underline">
                        View / Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
