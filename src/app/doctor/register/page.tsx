import { DoctorRegisterForm } from "@/features/doctor-auth/components/DoctorRegisterForm";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Doctor Registration | Schedula",
};

export default function DoctorRegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-3xl space-y-10 rounded-2xl bg-white px-6 sm:px-12 py-10 sm:py-14 shadow-lg ring-1 ring-border animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center relative">
          <Link href="/doctor/login" className="absolute left-0 top-0 text-sm font-medium text-text-secondary hover:text-primary">
            &larr; Back to Login
          </Link>
          <div className="mx-auto mt-6 sm:mt-0 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-serif text-2xl font-bold text-white shadow-sm ring-1 ring-[var(--color-primary-dark)]/20">
            D
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-text-primary font-serif">
            Join Schedula for Providers
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Create your account to start managing your practice and accepting appointments.
          </p>
        </div>
        
        <DoctorRegisterForm />
      </div>
    </main>
  );
}
