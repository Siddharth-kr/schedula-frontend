"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { doctorLogin } from "../api/doctor-login";
import { toast } from "react-toastify";

export function DoctorLoginForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validate = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
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
      const doctor = await doctorLogin(email, password);
      toast.success(`Welcome, ${doctor.name}.`);
      router.push("/doctor/dashboard");
    } catch (err: unknown) {
      toast.error("Invalid email or password.");
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
        <div className="rounded-md bg-error/10 p-3 text-sm text-error ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}

      <Input
        label="Email address"
        type="email"
        placeholder="doctor@schedula.com"
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`absolute right-3 text-xs font-medium text-text-secondary hover:text-text-primary ${passwordError ? 'top-8' : 'top-9'}`}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <div className="mt-2">
        <Button type="submit" isLoading={isLoading}>
          Sign in as Doctor
        </Button>
      </div>
      
      <div className="mt-4 flex flex-col items-center gap-4 border-t border-border pt-6">
        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have a doctor account?{" "}
          <Link 
            href="/doctor/register"
            className="font-semibold text-primary hover:underline"
          >
            Register here
          </Link>
        </p>

        <Link 
          href="/"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          &larr; Back to Patient Portal
        </Link>
        
        <p className="text-center text-xs text-stone-400">
          Tip: You can use pre-seeded accounts like <strong>anika@schedula.com</strong> / <strong>doctor123</strong>
        </p>
      </div>
    </form>
  );
}
