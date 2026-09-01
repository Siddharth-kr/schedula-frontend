"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginWithEmail } from "../api/login";

export function LoginForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Basic validation state
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      // Navigate to doctors page after successful login
      router.push("/doctors");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}
      
      <Input
        label="Email address"
        type="email"
        placeholder="patient@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        autoComplete="email"
        disabled={isLoading}
      />
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder=""
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 text-xs font-bold text-[var(--brand)] hover:text-[var(--brand-deep)] ${passwordError ? 'top-8' : 'top-9'}`}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <div className="mt-2">
        <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
          Sign in
        </Button>
      </div>
      
      <p className="text-center text-sm text-[var(--muted)]">
        Don&apos;t have an account?{" "}
        <Link 
          href="/register"
          className="font-semibold text-[var(--brand)] hover:underline transition-all"
        >
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs text-[var(--muted)] mt-2">
        Tip: Use password <strong>password123</strong>
      </p>
    </form>
  );
}
