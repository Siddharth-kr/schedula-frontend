"use client";
import { useEffect, useMemo, useState } from "react";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

type Filter = "all" | AppointmentStatus;
type ApiResponse = { data: Appointment[] };

const styles: Record<AppointmentStatus, string> = { 
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200", 
  pending: "bg-amber-50 text-amber-800 ring-amber-200", 
  cancelled: "bg-stone-50 text-stone-600 ring-stone-200" 
};

const time = (value: string) => new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default function Home() {
  const [items, setItems] = useState<Appointment[]>([]); 
  const [filter, setFilter] = useState<Filter>("all"); 
  const [selectedId, setSelectedId] = useState<string>(); 
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => { 
    fetch("/api/appointments")
      .then((response) => response.ok ? response.json() as Promise<ApiResponse> : Promise.reject())
      .then(({ data }) => { 
        setItems(data); 
        setSelectedId(data[0]?.id); 
        setStatus("ready"); 
      })
      .catch(() => setStatus("error")); 
  }, []);

  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.status === filter), [items, filter]);
  const selected = items.find((item) => item.id === selectedId); 
  const counts = items.reduce<Record<Filter, number>>((total, item) => ({ 
    ...total, 
    all: total.all + 1, 
    [item.status]: total[item.status] + 1 
  }), { all: 0, confirmed: 0, pending: 0, cancelled: 0 });

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="dashboard-title" className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">Operations Dashboard</h1>
            <p className="mt-2 max-w-xl text-base text-[var(--muted)]">Manage your clinic schedule and appointments in one clear view.</p>
          </div>
          <button className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--brand-deep)] hover:shadow active:scale-[0.98]" type="button">
            New appointment
          </button>
        </header>

        <section className="py-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--brand)]">Friday, 28 August</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--ink)]">Today&apos;s appointments</h2>
            </div>
            <p className="text-sm font-medium text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink)]">{counts.confirmed} confirmed</span> out of {counts.all} total visits
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-sm" aria-labelledby="schedule-title">
            <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50/50">
              <h2 id="schedule-title" className="font-semibold text-[var(--ink)]">Schedule</h2>
              <div className="flex gap-1 rounded-lg bg-stone-100 p-1 ring-1 ring-stone-200" role="group" aria-label="Filter appointments">
                {(["all", "confirmed", "pending"] as Filter[]).map((item) => (
                  <button 
                    key={item} 
                    type="button" 
                    onClick={() => setFilter(item)} 
                    className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-all ${
                      filter === item 
                        ? "bg-white text-[var(--ink)] shadow ring-1 ring-stone-200/50" 
                        : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-stone-200/50"
                    }`}
                  >
                    {item} <span className="ml-1 text-xs opacity-70">{counts[item]}</span>
                  </button>
                ))}
              </div>
            </div>

            {status === "loading" && (
              <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading appointments">
                {[1, 2, 3].map((item) => <div className="h-20 animate-pulse rounded-lg bg-stone-100" key={item} />)}
              </div>
            )}

            {status === "error" && (
              <div className="p-10 text-center" role="alert">
                <p className="font-medium text-red-800">We couldn&apos;t load appointments.</p>
                <button className="mt-3 text-sm font-semibold text-[var(--brand)] hover:underline" onClick={() => window.location.reload()} type="button">
                  Try again
                </button>
              </div>
            )}

            {status === "ready" && (
              <ul className="divide-y divide-[var(--line)]" role="list">
                {visible.map((item) => (
                  <li key={item.id}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedId(item.id)} 
                      aria-pressed={selectedId === item.id} 
                      className={`grid w-full grid-cols-[5rem_minmax(0,1fr)] gap-4 px-5 py-4 text-left transition-colors hover:bg-stone-50 ${
                        selectedId === item.id ? "bg-emerald-50/30 ring-1 ring-inset ring-[var(--brand)]/20" : ""
                      }`}
                    >
                      <time className="pt-1 text-sm font-semibold text-[var(--muted)]">{time(item.startsAt)}</time>
                      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-[var(--ink)]">
                            {item.patient.name} <span className="font-normal text-[var(--muted)] ml-1">· {item.durationMinutes} min</span>
                          </p>
                          <p className="mt-1 truncate text-sm text-[var(--muted)]">
                            {item.reason} · {item.clinician}
                          </p>
                        </div>
                        <span className={`mt-2 w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset sm:mt-0 ${styles[item.status]}`}>
                          {item.status}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {status === "ready" && visible.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-base font-medium text-[var(--ink)]">No appointments match this filter.</p>
                <button type="button" onClick={() => setFilter("all")} className="mt-2 text-sm font-semibold text-[var(--brand)] hover:underline">
                  Show all appointments
                </button>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-xl border border-[var(--line)] bg-white p-6 shadow-sm sticky top-24" aria-live="polite">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-4">Appointment details</h3>
            {selected ? (
              <div className="mt-6">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 text-sm font-bold text-[var(--brand-deep)]">
                    {selected.patient.initials}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--ink)]">{selected.patient.name}</h2>
                    <p className="text-sm font-medium text-[var(--muted)]">{selected.patient.age} years old</p>
                  </div>
                </div>
                <dl className="mt-8 space-y-6 text-sm">
                  <div>
                    <dt className="text-[var(--muted)] font-medium">Visit Reason</dt>
                    <dd className="mt-1.5 font-semibold text-[var(--ink)]">{selected.reason}</dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-[var(--muted)] font-medium">Time</dt>
                      <dd className="mt-1.5 font-semibold text-[var(--ink)]">{time(selected.startsAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[var(--muted)] font-medium">Room</dt>
                      <dd className="mt-1.5 font-semibold text-[var(--ink)]">{selected.room}</dd>
                    </div>
                  </div>
                  <div className="rounded-lg bg-stone-50 p-4 ring-1 ring-stone-200/60">
                    <dt className="text-[var(--muted)] font-medium text-xs uppercase tracking-wider mb-2">Care Team</dt>
                    <dd className="font-semibold text-[var(--ink)]">{selected.clinician}</dd>
                    <dd className="text-xs font-medium text-[var(--muted)] mt-0.5">{selected.specialty}</dd>
                  </div>
                </dl>
                <button type="button" className="mt-8 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] active:scale-[0.98]">
                  Open patient record
                </button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-[var(--muted)] text-center py-8">Select an appointment to view details.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}