"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDoctorSession, setDoctorSession, updateDoctor } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-toastify";

export function DoctorProfileForm() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dob: "",
    specialty: "",
    qualification: "",
    experienceYears: "",
    consultationFee: "",
    email: "",
    phone: "",
    address: "",
  });

  const populateForm = (data: DoctorProfile) => {
    setFormData({
      name: data.name || "",
      gender: data.gender || "",
      dob: data.dob || "",
      specialty: data.specialty || "",
      qualification: data.qualification || "",
      experienceYears: data.experienceYears?.toString() || "",
      consultationFee: data.consultationFee?.toString() || "",
      email: data.email || "",
      phone: data.phone || "",
      address: data.address || "",
    });
  };

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    
    // Use async wrapper to satisfy Next.js setState in effect constraints
    async function loadSession(doc: DoctorProfile) {
      setDoctor(doc);
      populateForm(doc);
    }
    loadSession(session);
  }, [router]);

  const handleCancel = () => {
    if (doctor) populateForm(doctor);
    setIsEditing(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;
    setErrorMsg("");
    setSuccessMsg("");

    // Basic Validation
    if (!formData.name.trim()) return setErrorMsg("Name is required");
    if (!formData.specialty.trim()) return setErrorMsg("Specialty is required");
    if (!formData.phone.trim()) return setErrorMsg("Phone is required");
    if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      return setErrorMsg("Please enter valid years of experience");
    }
    if (!formData.consultationFee || isNaN(Number(formData.consultationFee)) || Number(formData.consultationFee) < 0) {
      return setErrorMsg("Please enter a valid consultation fee");
    }

    setIsSaving(true);
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, 600));

    try {
      const updates: Partial<DoctorProfile> = {
        name: formData.name,
        gender: formData.gender,
        dob: formData.dob,
        specialty: formData.specialty,
        qualification: formData.qualification,
        experienceYears: Number(formData.experienceYears),
        consultationFee: Number(formData.consultationFee),
        phone: formData.phone,
        address: formData.address,
        // Email intentionally excluded to prevent breaking auth flow inadvertently
      };

      const updatedDoctor = updateDoctor(doctor.id, updates);
      if (updatedDoctor) {
        setDoctor(updatedDoctor);
        setDoctorSession(updatedDoctor); // Update local session
        toast.success("Profile updated successfully.");
        setSuccessMsg("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update profile.");
        setErrorMsg("Failed to update profile. Doctor not found.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!doctor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--brand)]"></div>
          <p className="text-sm font-medium text-[var(--muted)]">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end border-b border-[var(--line)] pb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] font-serif">
            My Profile
          </h1>
          <p className="mt-2 text-base text-[var(--muted)]">
            Manage your personal and professional information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold text-[var(--ink)] shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]"
            onClick={() => router.push("/doctor/availability")}
          >
            Manage Availability
          </button>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mb-8 rounded-xl bg-amber-50 p-4 border border-amber-200 shadow-sm flex items-start gap-3">
          <svg className="size-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <div>
            <h3 className="text-sm font-bold text-amber-800">You are in edit mode</h3>
            <p className="text-sm text-amber-700 mt-1">Make your changes below and click Save Changes when finished.</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-8 rounded-xl bg-[var(--success)]/10 p-5 text-sm font-bold text-[var(--success)] ring-1 ring-inset ring-[var(--success)]/20 shadow-sm">
          {successMsg}
        </div>
      )}
      
      {errorMsg && (
        <div className="mb-8 rounded-xl bg-red-50 p-5 text-sm font-bold text-[var(--error)] ring-1 ring-inset ring-[var(--error)]/20 shadow-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Personal Information */}
        <section className={`rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-sm transition-all ${isEditing ? 'ring-2 ring-[var(--brand)]/20 shadow-md' : ''}`}>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 font-serif">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Full Name (with Title)"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              disabled={!isEditing || isSaving}
            />
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                disabled={!isEditing || isSaving}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-base font-medium shadow-sm outline-none transition-all disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange("dob", e.target.value)}
              disabled={!isEditing || isSaving}
            />
          </div>
        </section>

        {/* Professional Information */}
        <section className={`rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-sm transition-all ${isEditing ? 'ring-2 ring-[var(--brand)]/20 shadow-md' : ''}`}>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 font-serif">
            Professional Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Specialty"
              type="text"
              value={formData.specialty}
              onChange={(e) => handleChange("specialty", e.target.value)}
              disabled={!isEditing || isSaving}
            />
            <Input
              label="Qualification (e.g. MBBS, MD)"
              type="text"
              value={formData.qualification}
              onChange={(e) => handleChange("qualification", e.target.value)}
              disabled={!isEditing || isSaving}
            />
            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) => handleChange("experienceYears", e.target.value)}
              disabled={!isEditing || isSaving}
            />
            <Input
              label="Consultation Fee ($)"
              type="number"
              min="0"
              value={formData.consultationFee}
              onChange={(e) => handleChange("consultationFee", e.target.value)}
              disabled={!isEditing || isSaving}
            />
          </div>
        </section>

        {/* Contact Information */}
        <section className={`rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-8 shadow-sm transition-all ${isEditing ? 'ring-2 ring-[var(--brand)]/20 shadow-md' : ''}`}>
          <h2 className="text-xl font-bold text-[var(--ink)] mb-6 font-serif">
            Contact & Account Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!isEditing || isSaving}
            />
            <div>
              <Input
                label="Email Address (Login ID)"
                type="email"
                value={formData.email}
                onChange={() => {}} // Make email strictly readonly in UI
                disabled={true} 
              />
              <span className="text-xs font-semibold text-slate-400 mt-2 block">Email address cannot be changed.</span>
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Clinic / Office Address"
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={!isEditing || isSaving}
              />
            </div>
          </div>
        </section>

        {/* Form Actions */}
        {isEditing && (
          <div className="flex items-center justify-end gap-5 pt-4 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-3 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] hover:underline disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" isLoading={isSaving} className="shadow-lg shadow-[var(--brand)]/20">
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
