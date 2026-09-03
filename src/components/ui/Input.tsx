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
          <label htmlFor={inputId} className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-xl border bg-white px-4 py-2.5 text-base font-medium shadow-sm outline-none transition-all placeholder:text-text-secondary disabled:cursor-not-allowed disabled:bg-background disabled:text-text-secondary disabled:opacity-100 ${
            error
              ? "border-error focus:border-error focus:ring-2 focus:ring-[var(--error)]/20 text-error"
              : "border-border hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 text-text-primary"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-bold text-error mt-0.5">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
