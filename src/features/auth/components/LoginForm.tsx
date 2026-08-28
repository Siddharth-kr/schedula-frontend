"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { loginWithEmail } from "../api/login";
import { signupWithEmail } from "../api/signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Basic validation state
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validate = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");

    if (mode === "signup" && !name.trim()) {
      setNameError("Name is required");
      isValid = false;
    }

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
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
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
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(name, email, password);
      }
      // Navigate to doctors page after successful login/signup
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
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}
      
      {mode === "signup" && (
        <Input
          label="Full Name"
          type="text"
          placeholder="Alex Patient"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          autoComplete="name"
          disabled={isLoading}
        />
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
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        disabled={isLoading}
      />
      <div className="mt-2">
        <Button type="submit" isLoading={isLoading}>
          {mode === "login" ? "Sign in" : "Create account"}
        </Button>
      </div>
      
      <p className="text-center text-sm text-[var(--muted)]">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button 
          type="button" 
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="font-semibold text-[var(--brand)] hover:underline"
        >
          {mode === "login" ? "Sign up" : "Sign in"}
        </button>
      </p>

      {mode === "login" && (
        <p className="text-center text-xs text-[var(--muted)]">
          Tip: Use password <strong>password123</strong>
        </p>
      )}
    </form>
  );
}
