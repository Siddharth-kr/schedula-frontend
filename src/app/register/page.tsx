import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Schedula",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] bg-[var(--canvas)]">
      {/* Left pane: Healthcare Visual */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/3 bg-[var(--ink)] flex-col justify-between p-12 xl:p-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/20 to-[var(--ink)] opacity-50"></div>
        <div className="relative z-10">
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-deep)] font-serif text-2xl font-bold shadow-sm ring-1 ring-white/20 mb-16">
            S
          </div>
          <h1 className="font-serif text-4xl xl:text-5xl font-bold leading-tight tracking-tight mb-6 text-[var(--canvas)]">
            Your healthcare, organized.
          </h1>
          <p className="text-base xl:text-lg text-stone-300 max-w-sm mb-12">
            Book appointments, manage your visits, and stay connected with your healthcare providers  all in one place.
          </p>
          
          <ul className="space-y-6 text-stone-300">
            <li className="flex items-center gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[var(--brand)]/20 text-[var(--brand)]">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="font-medium text-[var(--canvas)]">Easy appointment booking</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[var(--brand)]/20 text-[var(--brand)]">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="font-medium text-[var(--canvas)]">Trusted healthcare professionals</span>
            </li>
            <li className="flex items-center gap-4">
              <div className="grid size-8 place-items-center rounded-full bg-[var(--brand)]/20 text-[var(--brand)]">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="font-medium text-[var(--canvas)]">Simple appointment management</span>
            </li>
          </ul>
        </div>
        
        <div className="relative z-10 text-sm font-medium text-stone-400 mt-12">
          &copy; {new Date().getFullYear()} Schedula. All rights reserved.
        </div>
      </div>

      {/* Right pane: Form */}
      <div className="flex w-full lg:w-7/12 xl:w-2/3 items-center justify-center p-6 sm:p-10 xl:p-16 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-deep)] font-serif text-2xl font-bold text-white shadow-sm ring-1 ring-white/20 mb-8">
              S
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--ink)] font-serif">
              Create an account
            </h2>
            <p className="mt-2.5 text-base text-[var(--muted)]">
              Join Schedula to start managing your healthcare.
            </p>
          </div>
          
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
