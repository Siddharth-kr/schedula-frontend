"use client";

import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface Props {
  date: Date;
  onChange: (newDate: Date) => void;
}

export function MiniCalendar({ date, onChange }: Props) {
  
  const days = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [date]);

  const nextMonth = () => onChange(addMonths(date, 1));
  const prevMonth = () => onChange(subMonths(date, 1));

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-semibold text-[var(--ink)]">
          {format(date, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 text-[var(--muted)]">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 text-[var(--muted)]">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-[var(--muted)]">
            {d}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 text-center">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, date);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, date);
          
          return (
            <button
              key={i}
              onClick={() => onChange(day)}
              className={`
                flex size-7 items-center justify-center rounded-full text-xs mx-auto
                ${isSelected ? "bg-[var(--brand)] text-white font-bold" : "hover:bg-slate-100"}
                ${!isCurrentMonth && !isSelected ? "text-slate-300" : ""}
                ${isToday && !isSelected ? "text-[var(--brand)] font-bold bg-blue-50" : ""}
                ${isCurrentMonth && !isSelected && !isToday ? "text-[var(--ink)]" : ""}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
