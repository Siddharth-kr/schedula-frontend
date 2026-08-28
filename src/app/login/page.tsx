import { LoginForm } from "@/features/auth/components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Schedula",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[var(--canvas)]">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-[var(--line)]">
        <div className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl bg-[var(--brand)] font-serif text-2xl text-white">
            S
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[var(--ink)]">
            Welcome to Schedula
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Please sign in or create an account
          </p>
        </div>
        
        <LoginForm />
      </div>
    </main>
  );
}
