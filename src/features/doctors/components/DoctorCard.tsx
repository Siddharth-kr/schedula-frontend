import Link from "next/link";
import type { Doctor } from "@/types/doctor";

type DoctorCardProps = {
  doctor: Doctor;
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  const isAvailableToday = doctor.availableNextDays === 0;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-[var(--line)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex gap-4">
        {/* Mock Avatar */}
        <div className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-xl font-bold text-white">
          {doctor.name.charAt(4)}
        </div>
        
        <div className="flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-[var(--ink)]">{doctor.name}</h3>
          <p className="text-sm font-medium text-[var(--brand)]">{doctor.specialty}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
            <span>{doctor.experienceYears} years exp.</span>
            <span>&bull;</span>
            <span className="flex items-center gap-0.5">
              <svg className="size-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {doctor.rating} ({doctor.reviewCount})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:mt-0 sm:items-end sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
        <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end sm:justify-start">
          <p className="text-sm font-medium text-[var(--muted)]">Consultation Fee</p>
          <p className="text-lg font-semibold text-[var(--ink)]">${doctor.consultationFee}</p>
        </div>
        
        <div className="flex w-full items-center justify-between sm:w-auto sm:flex-col sm:items-end sm:justify-start">
          <span className={`text-xs font-medium ${isAvailableToday ? "text-emerald-600" : "text-amber-600"}`}>
            {isAvailableToday ? "Available Today" : `Available in ${doctor.availableNextDays} day(s)`}
          </span>
          <Link 
            href={`/booking/${doctor.id}`}
            className="mt-2 block rounded-lg bg-[var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </article>
  );
}
