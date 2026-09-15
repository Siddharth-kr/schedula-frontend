"use client";
import { useAppSelector } from "@/store/hooks";

import { useState, useEffect } from "react";
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

  const { doctor } = useAppSelector(state => state.auth);

  // Redirect if already authenticated as doctor
  useEffect(() => {
    if (doctor) {
      router.push("/doctor/dashboard");
    }
  }, [doctor, router]);

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
    <div className="flex w-full flex-col gap-6">
      
      {/* Role Switcher */}
      <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner border border-stone-200/60 mb-2">
        <Link href="/login" className="flex-1 text-center py-2 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
          Patient
        </Link>
        <div className="flex-1 text-center py-2 text-sm font-bold bg-white text-primary rounded-lg shadow-sm">
          Doctor
        </div>
      </div>

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
          <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base">
            Sign in as Doctor
          </Button>
        </div>
        
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have a doctor account?{" "}
            <Link 
              href="/doctor/register"
              className="font-semibold text-primary hover:underline transition-all"
            >
              Register here
            </Link>
          </p>

          <div className="border-t border-border pt-5">
            <p className="text-center text-sm text-text-secondary">
              Are you a patient?{" "}
              <Link 
                href="/login"
                className="font-semibold text-primary hover:underline transition-all"
              >
                Sign in to Patient Portal
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 mt-2">
          Tip: You can use pre-seeded accounts like <strong>anika@schedula.com</strong> / <strong>doctor123</strong>
        </p>
      </form>
    </div>
  );
}
