import { DoctorLoginForm } from "@/features/doctor-auth/components/DoctorLoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Login | Schedula",
};

export default function DoctorLoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Left pane: Healthcare Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 xl:p-20 text-white">
        <div>
          <div className="grid size-12 place-items-center rounded-xl bg-white/10 font-serif text-2xl font-bold shadow-sm ring-1 ring-white/20">
            D
          </div>
        </div>
        <div>
          <h1 className="font-serif text-5xl xl:text-6xl font-bold leading-tight tracking-tight mb-6 text-[var(--color-background)]">
            Provider Portal
          </h1>
          <p className="text-lg text-emerald-50 max-w-md">
            Manage your practice, configure your availability, and connect with your patients effortlessly.
          </p>
        </div>
        <div className="text-sm font-medium text-emerald-100/60">
          © {new Date().getFullYear()} Schedula for Providers.
        </div>
      </div>

      {/* Right pane: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 xl:p-20">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
          
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-serif text-2xl font-bold text-white shadow-sm ring-1 ring-white/20 mb-8">
              D
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary font-serif">
              Doctor Login
            </h2>
            <p className="mt-2.5 text-base text-text-secondary">
              Sign in to manage your practice
            </p>
          </div>
          
          <DoctorLoginForm />
        </div>
      </div>
    </main>
  );
}
