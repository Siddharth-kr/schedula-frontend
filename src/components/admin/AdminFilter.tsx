import React from "react";

export interface FilterOption {
  label: string;
  value: string;
}

interface AdminFilterProps {
  label?: string;
  options: FilterOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function AdminFilter({ label, options, value, onChange, className = "" }: AdminFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm font-medium text-slate-500">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none block w-full pl-3 pr-8 py-2 text-sm text-slate-700 font-medium border border-border rounded-lg bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-colors cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
