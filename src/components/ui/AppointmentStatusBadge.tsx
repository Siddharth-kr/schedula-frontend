import type { AppointmentStatus } from "@/types/appointment";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  let colorClasses = "";
  switch (status) {
    case "confirmed":
    case "upcoming":
      colorClasses = "bg-[var(--success)]/10 text-[var(--success)] ring-[var(--success)]/20";
      break;
    case "pending":
      colorClasses = "bg-amber-50 text-amber-700 ring-amber-600/20";
      break;
    case "completed":
      colorClasses = "bg-[var(--brand)]/10 text-[var(--brand-deep)] ring-[var(--brand)]/20";
      break;
    case "missed":
      colorClasses = "bg-stone-100 text-stone-600 ring-stone-500/20";
      break;
    case "cancelled":
    default:
      colorClasses = "bg-red-50 text-[var(--error)] ring-[var(--error)]/20";
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${colorClasses}`}>
      {status}
    </span>
  );
}
