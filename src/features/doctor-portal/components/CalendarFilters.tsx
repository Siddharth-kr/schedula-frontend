"use client";

import type { CalendarFilters as FilterType } from "./DashboardCalendar";

interface Props {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
}

export function CalendarFilters({ filters, onChange }: Props) {
  
  const toggle = (key: keyof FilterType) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-3 px-2">
        My Calendars
      </h3>
      <div className="space-y-1">
        
        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.appointments} 
              onChange={() => toggle("appointments")} 
              className="peer size-4 appearance-none rounded border-2 border-blue-500 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--ink)] select-none">Appointments</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.available} 
              onChange={() => toggle("available")} 
              className="peer size-4 appearance-none rounded border-2 border-emerald-500 checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--ink)] select-none">Available Slots</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.unavailable} 
              onChange={() => toggle("unavailable")} 
              className="peer size-4 appearance-none rounded border-2 border-slate-400 checked:bg-slate-400 checked:border-slate-400 transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--ink)] select-none">Unavailable</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.cancelled} 
              onChange={() => toggle("cancelled")} 
              className="peer size-4 appearance-none rounded border-2 border-red-500 checked:bg-red-500 checked:border-red-500 transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-[var(--ink)] select-none">Cancelled / Missed</span>
        </label>

      </div>
    </div>
  );
}
