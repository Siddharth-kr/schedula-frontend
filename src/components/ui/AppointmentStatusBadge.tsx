import type { AppointmentStatus } from "@/types/appointment";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  let colorClasses = "";
  switch (status) {
    case "confirmed":
    case "upcoming":
      colorClasses = "bg-success/10 text-success ring-[var(--success)]/20";
      break;
    case "pending":
      colorClasses = "bg-background text-text-secondary ring-border";
      break;
    case "completed":
      colorClasses = "bg-primary/10 text-primary-dark ring-primary/20";
      break;
    case "missed":
      colorClasses = "bg-stone-100 text-stone-600 ring-stone-500/20";
      break;
    case "cancelled":
    default:
      colorClasses = "bg-error/10 text-error ring-[var(--error)]/20";
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${colorClasses}`}>
      {status}
    </span>
  );
}
