import { LoginForm } from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Schedula",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] bg-background">
      {/* Left pane: Healthcare Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark flex-col justify-between p-12 xl:p-20 text-white">
        <div>
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-serif text-2xl font-bold shadow-sm ring-1 ring-white/20">
            S
          </div>
        </div>
        <div>
          <h1 className="font-serif text-5xl xl:text-6xl font-bold leading-tight tracking-tight mb-6 text-[var(--color-background)]">
            Healthcare<br />without the hassle.
          </h1>
          <p className="text-lg text-stone-300 max-w-md">
            Book appointments, manage your schedule, and connect with top medical professionals in seconds.
          </p>
        </div>
        <div className="text-sm font-medium text-stone-400">
          © {new Date().getFullYear()} Schedula. All rights reserved.
        </div>
      </div>

      {/* Right pane: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 xl:p-20">
        <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left">
            <div className="lg:hidden mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary-dark font-serif text-2xl font-bold text-white shadow-sm ring-1 ring-white/20 mb-8">
              S
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-primary font-serif">
              Welcome back
            </h2>
            <p className="mt-2.5 text-base text-text-secondary">
              Sign in to manage your appointments
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
