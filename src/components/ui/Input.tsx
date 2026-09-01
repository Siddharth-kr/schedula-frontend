import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-base font-medium shadow-sm outline-none transition-all placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-100 ${
            error
              ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]/20 text-[var(--error)]"
              : "border-[var(--line)] hover:border-slate-300 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 text-[var(--ink)]"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-bold text-[var(--error)] mt-0.5">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
