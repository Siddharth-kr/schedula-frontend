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
        <h3 className="text-sm font-semibold text-text-primary">
          {format(date, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-background text-text-secondary">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-background text-text-secondary">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-text-secondary">
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
                ${isSelected ? "bg-primary text-white font-bold" : "hover:bg-background"}
                ${!isCurrentMonth && !isSelected ? "text-slate-300" : ""}
                ${isToday && !isSelected ? "text-primary font-bold bg-primary/10" : ""}
                ${isCurrentMonth && !isSelected && !isToday ? "text-text-primary" : ""}
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
