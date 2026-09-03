import type { AppointmentStatus } from "@/types/appointment";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  let colorClasses = "";
  let icon = null;
  
  switch (status) {
    case "pending":
      colorClasses = "bg-amber-50 text-amber-700 ring-amber-600/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-amber-500" />;
      break;
    case "confirmed":
      colorClasses = "bg-blue-50 text-blue-700 ring-blue-600/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-blue-500" />;
      break;
    case "upcoming":
      colorClasses = "bg-teal-50 text-teal-700 ring-teal-600/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-teal-500" />;
      break;
    case "completed":
      colorClasses = "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-emerald-500" />;
      break;
    case "missed":
      colorClasses = "bg-stone-100 text-stone-600 ring-stone-500/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-stone-400" />;
      break;
    case "cancelled":
    default:
      colorClasses = "bg-red-50 text-red-700 ring-red-600/20";
      icon = <circle cx="4" cy="4" r="3" className="fill-red-500" />;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colorClasses}`}>
      <svg className="size-2" viewBox="0 0 8 8" aria-hidden="true">
        {icon}
      </svg>
      <span className="capitalize">{status}</span>
    </span>
  );
}
