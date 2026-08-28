import { LoginForm } from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Schedula",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[var(--canvas)]">
      <div className="w-full max-w-md space-y-10 rounded-2xl bg-white px-8 py-10 shadow-xl shadow-stone-200/40 ring-1 ring-[var(--line)]">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-deep)] font-serif text-2xl font-bold text-white shadow-sm ring-1 ring-[var(--brand-deep)]/20">
            S
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-[var(--ink)]">
            Welcome to Schedula
          </h1>
          <p className="mt-2.5 text-sm text-[var(--muted)]">
            Sign in to manage your appointments
          </p>
        </div>
        
        <LoginForm />
      </div>
    </main>
  );
}
