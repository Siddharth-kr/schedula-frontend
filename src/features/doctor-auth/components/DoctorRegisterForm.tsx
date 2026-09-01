"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { doctorRegister } from "../api/doctor-register";
import { toast } from "react-toastify";

export function DoctorRegisterForm() {
  const router = useRouter();
  
  // Personal Details
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  
  // Professional Details
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  
  // Contact & Account Details
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Full name is required";
    if (!bio.trim()) newErrors.bio = "Brief bio is required";
    if (!specialty.trim()) newErrors.specialty = "Specialty is required";
    
    if (!experienceYears) newErrors.experienceYears = "Experience is required";
    else if (isNaN(Number(experienceYears)) || Number(experienceYears) < 0) {
      newErrors.experienceYears = "Enter a valid number of years";
    }

    if (!consultationFee) newErrors.consultationFee = "Consultation fee is required";
    else if (isNaN(Number(consultationFee)) || Number(consultationFee) < 0) {
      newErrors.consultationFee = "Enter a valid fee amount";
    }

    if (!phone.trim()) newErrors.phone = "Phone number is required";
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      // Scroll to top to show first error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsLoading(true);
    try {
      await doctorRegister({
        name,
        bio,
        specialty,
        experienceYears: Number(experienceYears),
        consultationFee: Number(consultationFee),
        phone,
        email,
        password,
      });
      toast.success("Doctor account created successfully.");
      // Redirect to login page after successful registration
      router.push("/doctor/login");
    } catch (err: unknown) {
      toast.error("Failed to create doctor account.");
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-10">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20" role="alert">
          {error}
        </div>
      )}

      {/* 1. Personal Details */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--ink)] border-b border-[var(--line)] pb-3 font-serif">1. Personal Details</h2>
        <Input
          label="Full Name (with Title)"
          type="text"
          placeholder="e.g. Dr. Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          disabled={isLoading}
        />
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="bio" className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Brief Bio</label>
          <textarea
            id="bio"
            rows={3}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-base font-medium shadow-sm outline-none transition-all placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50 ${
              errors.bio
                ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-[var(--error)]/20"
                : "border-[var(--line)] hover:border-slate-300 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
            }`}
            placeholder="A short description about your practice and approach..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={isLoading}
          />
          {errors.bio && <span className="text-xs font-bold text-[var(--error)]">{errors.bio}</span>}
        </div>
      </section>

      {/* 2. Professional Details */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--ink)] border-b border-[var(--line)] pb-3 font-serif">2. Professional Details</h2>
        <Input
          label="Specialty"
          type="text"
          placeholder="e.g. Cardiology, General Medicine"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          error={errors.specialty}
          disabled={isLoading}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Years of Experience"
            type="number"
            min="0"
            placeholder="e.g. 10"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            error={errors.experienceYears}
            disabled={isLoading}
          />
          <Input
            label="Consultation Fee ($)"
            type="number"
            min="0"
            placeholder="e.g. 150"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
            error={errors.consultationFee}
            disabled={isLoading}
          />
        </div>
      </section>

      {/* 3. Contact & Account Details */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[var(--ink)] border-b border-[var(--line)] pb-3 font-serif">3. Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. +1 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            disabled={isLoading}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="doctor@schedula.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--ink)] ${errors.password ? 'top-[42px]' : 'top-[42px]'}`}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            disabled={isLoading}
          />
        </div>
      </section>

      <div className="mt-6 border-t border-[var(--line)] pt-8 flex flex-col items-center gap-5">
        <Button type="submit" isLoading={isLoading} className="w-full h-12 text-base font-bold shadow-lg shadow-[var(--brand)]/20">
          Create Doctor Account
        </Button>

        <p className="text-center text-sm font-semibold text-[var(--muted)]">
          Already have an account?{" "}
          <Link 
            href="/doctor/login"
            className="text-[var(--brand)] hover:text-[var(--brand-deep)] hover:underline"
          >
            Sign in
          </Link>
        </p>

        <Link 
          href="/"
          className="text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          &larr; Back to Patient Portal
        </Link>
      </div>
    </form>
  );
}
