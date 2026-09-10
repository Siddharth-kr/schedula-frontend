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
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3 px-2">
        My Calendars
      </h3>
      <div className="space-y-1">
        
        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.appointments} 
              onChange={() => toggle("appointments")} 
              className="peer size-4 appearance-none rounded border-2 border-primary checked:bg-primary checked:border-primary transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-text-primary select-none">Appointments</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.available} 
              onChange={() => toggle("available")} 
              className="peer size-4 appearance-none rounded border-2 border-success checked:bg-success checked:border-success transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-text-primary select-none">Available Slots</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.unavailable} 
              onChange={() => toggle("unavailable")} 
              className="peer size-4 appearance-none rounded border-2 border-text-secondary checked:bg-text-secondary checked:border-text-secondary transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-text-primary select-none">Unavailable</span>
        </label>

        <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer transition-colors">
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              checked={filters.cancelled} 
              onChange={() => toggle("cancelled")} 
              className="peer size-4 appearance-none rounded border-2 border-error checked:bg-error checked:border-error transition-colors cursor-pointer"
            />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
              <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-text-primary select-none">Cancelled / Missed</span>
        </label>

      </div>
    </div>
  );
}
