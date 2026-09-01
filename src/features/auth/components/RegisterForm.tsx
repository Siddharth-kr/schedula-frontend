"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signupWithEmail } from "../api/signup";

export function RegisterForm() {
  const router = useRouter();
  
  // Section 1: Personal Info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  
  // Section 2: Contact Info
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  
  // Section 3: Optional Healthcare
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // Section 4: Security
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password Strength Logic
  const reqLength = password.length >= 8;
  const reqUpper = /[A-Z]/.test(password);
  const reqLower = /[a-z]/.test(password);
  const reqNumber = /[0-9]/.test(password);

  const strengthScore = [reqLength, reqUpper, reqLower, reqNumber].filter(Boolean).length;
  
  const strengthLabel = 
    password.length === 0 ? "" :
    strengthScore <= 2 ? "Weak" :
    strengthScore === 3 ? "Medium" : "Strong";

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!dob) newErrors.dob = "Date of birth is required";
    if (!gender) newErrors.gender = "Gender is required";

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
      newErrors.phone = "Phone number must contain a valid number";
    }

    if (!address.trim()) newErrors.address = "Address is required";
    if (!city.trim()) newErrors.city = "City is required";
    if (!state.trim()) newErrors.state = "State is required";
    if (!zip.trim()) newErrors.zip = "Postal code is required";

    if (!password) {
      newErrors.password = "Password is required";
    } else if (strengthScore < 4) {
      newErrors.password = "Password must meet all requirements";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!agreed) {
      newErrors.agreed = "You must agree to the Terms of Service and Privacy Policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await signupWithEmail(fullName, email, password);
      
      // Navigate to login page after successful signup
      router.push("/login");
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-10">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200" role="alert">
          {error}
        </div>
      )}
      
      {/* SECTION 1: Personal Info */}
      <section className="space-y-6">
        <div className="border-b border-[var(--line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--ink)] font-serif">1. Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="First Name" type="text" placeholder="Alex" value={firstName} onChange={(e) => setFirstName(e.target.value)} error={errors.firstName} disabled={isLoading} />
          <Input label="Last Name" type="text" placeholder="Patient" value={lastName} onChange={(e) => setLastName(e.target.value)} error={errors.lastName} disabled={isLoading} />
          <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} error={errors.dob} disabled={isLoading} />
          
          <div className="flex flex-col gap-2 w-full">
            <label className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Gender</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)} 
              disabled={isLoading}
              className={`w-full rounded-xl border bg-white px-4 py-3.5 text-base font-medium shadow-sm outline-none transition-all disabled:opacity-50 ${
                errors.gender ? "border-[var(--error)] text-[var(--error)]" : "border-[var(--line)] text-[var(--ink)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              }`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && <span className="text-xs font-bold text-[var(--error)] mt-0.5">{errors.gender}</span>}
          </div>
        </div>
      </section>

      {/* SECTION 2: Contact Info */}
      <section className="space-y-6">
        <div className="border-b border-[var(--line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--ink)] font-serif">2. Contact Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Email Address" type="email" placeholder="alex@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} disabled={isLoading} />
          <Input label="Phone Number" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} disabled={isLoading} />
          <div className="sm:col-span-2">
            <Input label="Address" type="text" placeholder="123 Health St" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} disabled={isLoading} />
          </div>
          <Input label="City" type="text" placeholder="San Francisco" value={city} onChange={(e) => setCity(e.target.value)} error={errors.city} disabled={isLoading} />
          <div className="grid grid-cols-2 gap-5">
            <Input label="State" type="text" placeholder="CA" value={state} onChange={(e) => setState(e.target.value)} error={errors.state} disabled={isLoading} />
            <Input label="Postal Code" type="text" placeholder="94105" value={zip} onChange={(e) => setZip(e.target.value)} error={errors.zip} disabled={isLoading} />
          </div>
        </div>
      </section>

      {/* SECTION 3: Optional Healthcare */}
      <section className="space-y-6 rounded-2xl bg-stone-50 p-6 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] pb-3 flex justify-between items-end">
          <h3 className="text-lg font-bold text-[var(--ink)] font-serif">Healthcare Profile</h3>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Optional</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input label="Emergency Contact Name" type="text" placeholder="Jane Doe" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} disabled={isLoading} />
          <Input label="Emergency Contact Phone" type="tel" placeholder="(555) 987-6543" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} disabled={isLoading} />
          <Input label="Blood Group" type="text" placeholder="e.g. O+" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} disabled={isLoading} />
        </div>
      </section>

      {/* SECTION 4: Security */}
      <section className="space-y-6">
        <div className="border-b border-[var(--line)] pb-3">
          <h3 className="text-lg font-bold text-[var(--ink)] font-serif">3. Account Security</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative">
            <Input label="Password" type={showPassword ? "text" : "password"} placeholder="????????" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} disabled={isLoading} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 text-xs font-bold text-[var(--brand)] hover:text-[var(--brand-deep)] ${errors.password ? 'top-8' : 'top-9'}`}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <Input label="Confirm Password" type={showConfirmPassword ? "text" : "password"} placeholder="????????" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} disabled={isLoading} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={`absolute right-3 text-xs font-bold text-[var(--brand)] hover:text-[var(--brand-deep)] ${errors.confirmPassword ? 'top-8' : 'top-9'}`}>
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        
        {/* Password Strength */}
        {password && (
          <div className="bg-stone-50 rounded-xl p-4 border border-[var(--line)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Password Strength</span>
              <span className={`text-xs font-bold ${
                strengthScore <= 2 ? "text-[var(--error)]" :
                strengthScore === 3 ? "text-amber-500" : "text-[var(--success)]"
              }`}>{strengthLabel}</span>
            </div>
            <div className="flex gap-2 h-1.5 mb-4">
              <div className={`flex-1 rounded-full ${strengthScore >= 1 ? (strengthScore <= 2 ? "bg-[var(--error)]" : strengthScore === 3 ? "bg-amber-500" : "bg-[var(--success)]") : "bg-stone-200"}`}></div>
              <div className={`flex-1 rounded-full ${strengthScore >= 2 ? (strengthScore <= 2 ? "bg-[var(--error)]" : strengthScore === 3 ? "bg-amber-500" : "bg-[var(--success)]") : "bg-stone-200"}`}></div>
              <div className={`flex-1 rounded-full ${strengthScore >= 3 ? (strengthScore === 3 ? "bg-amber-500" : "bg-[var(--success)]") : "bg-stone-200"}`}></div>
              <div className={`flex-1 rounded-full ${strengthScore >= 4 ? "bg-[var(--success)]" : "bg-stone-200"}`}></div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-[var(--muted)]">
              <li className={`flex items-center gap-2 ${reqLength ? "text-[var(--success)]" : ""}`}>
                {reqLength ? <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> : <span className="size-4 rounded-full border border-current"></span>}
                At least 8 characters
              </li>
              <li className={`flex items-center gap-2 ${reqUpper ? "text-[var(--success)]" : ""}`}>
                {reqUpper ? <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> : <span className="size-4 rounded-full border border-current"></span>}
                One uppercase letter
              </li>
              <li className={`flex items-center gap-2 ${reqLower ? "text-[var(--success)]" : ""}`}>
                {reqLower ? <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> : <span className="size-4 rounded-full border border-current"></span>}
                One lowercase letter
              </li>
              <li className={`flex items-center gap-2 ${reqNumber ? "text-[var(--success)]" : ""}`}>
                {reqNumber ? <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> : <span className="size-4 rounded-full border border-current"></span>}
                One number
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* SECTION 5: Submit */}
      <section className="space-y-6 pt-4">
        <div>
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="flex h-6 items-center">
              <input 
                type="checkbox" 
                className={`size-5 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)] ${errors.agreed ? 'border-[var(--error)] ring-1 ring-[var(--error)]' : ''}`}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={isLoading}
              />
            </div>
            <span className={`text-sm ${errors.agreed ? 'text-[var(--error)] font-medium' : 'text-[var(--muted)]'}`}>
              I agree to the <Link href="#" className="font-semibold text-[var(--brand)] hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-[var(--brand)] hover:underline">Privacy Policy</Link>.
            </span>
          </label>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full py-4 text-base">
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
        
        <p className="text-center text-sm text-[var(--muted)] mt-2">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--brand)] hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </section>
    </form>
  );
}
