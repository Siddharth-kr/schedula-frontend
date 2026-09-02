import Link from "next/link";
import type { Doctor } from "@/types/doctor";

type DoctorCardProps = {
  doctor: Doctor;
};

export function DoctorCard({ doctor }: DoctorCardProps) {
  const isAvailableToday = doctor.availableNextDays === 0;

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[var(--color-primary)]/10 hover:border-primary/30">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-dark font-serif text-3xl font-bold text-white shadow-md ring-1 ring-white/20">
            {doctor.name.replace("Dr. ", "").charAt(0)}
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-bold text-text-secondary ring-1 ring-inset ring-border">
              <svg className="size-3.5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {doctor.rating}
            </span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              {doctor.reviewCount} reviews
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight text-text-primary font-serif group-hover:text-primary transition-colors line-clamp-1">{doctor.name}</h3>
          <p className="mt-1 text-sm font-semibold text-primary">
            {doctor.specialty} {doctor.qualification && <span className="text-text-secondary font-normal text-xs ml-1">• {doctor.qualification}</span>}
          </p>
          <p className="mt-3 text-sm font-medium text-text-secondary line-clamp-2">
            {doctor.bio || `${doctor.experienceYears} years of medical experience serving patients with comprehensive care.`}
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-background/80 p-6 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Consultation</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">${doctor.consultationFee}</p>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider ${isAvailableToday ? "text-success" : "text-text-secondary"}`}>
            {isAvailableToday ? "Available Today" : `In ${doctor.availableNextDays} day(s)`}
          </span>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link 
            href={`/doctors/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View Profile
          </Link>
          <Link 
            href={`/doctors/${doctor.id}`}
            className="flex w-full items-center justify-center rounded-xl bg-white border border-border px-5 py-3 text-sm font-bold text-text-primary shadow-sm transition-all hover:border-primary hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </article>
  );
}
