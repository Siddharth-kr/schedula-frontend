"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getDoctorSession, setDoctorSession, updateDoctor, getAvailableSlotsForDoctor } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-toastify";

export function DoctorProfileForm() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [activeTab, setActiveTab] = useState("overview");

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
    bio: "",
  });

  // Derived Availability
  const [todayAvailable, setTodayAvailable] = useState(false);
  const [nextAvailableStr, setNextAvailableStr] = useState("Checking...");

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
      bio: data.bio || "",
    });
  };

  useEffect(() => {
    const session = getDoctorSession();
    if (!session) {
      router.push("/doctor/login");
      return;
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDoctor(session);
    populateForm(session);

    try {
      const slots = getAvailableSlotsForDoctor(session.id);
      const today = new Date().toISOString().split("T")[0];
      const activeSlots = slots.filter(s => !s.isBooked).sort((a, b) => a.date.localeCompare(b.date));
      if (activeSlots.length > 0) {
        if (activeSlots[0].date === today) {
          setTodayAvailable(true);
          setNextAvailableStr(`Today · ${activeSlots[0].startTime}`);
        } else {
          setTodayAvailable(false);
          setNextAvailableStr(`${activeSlots[0].date} · ${activeSlots[0].startTime}`);
        }
      } else {
        setNextAvailableStr("No upcoming slots");
      }
    } catch (e) {
      setNextAvailableStr("Check calendar");
    }
  }, [router]);

  const profileCompletion = useMemo(() => {
    const fields = [
      formData.name, formData.gender, formData.dob, 
      formData.specialty, formData.qualification, formData.experienceYears,
      formData.consultationFee, formData.email, formData.phone, 
      formData.address, formData.bio
    ];
    const filled = fields.filter(f => f && String(f).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [formData]);

  const handleCancel = () => {
    if (doctor) populateForm(doctor);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.specialty.trim()) return toast.error("Specialty is required");
    if (!formData.phone.trim()) return toast.error("Phone is required");
    if (!formData.experienceYears || isNaN(Number(formData.experienceYears)) || Number(formData.experienceYears) < 0) {
      return toast.error("Please enter valid years of experience");
    }
    if (!formData.consultationFee || isNaN(Number(formData.consultationFee)) || Number(formData.consultationFee) < 0) {
      return toast.error("Please enter a valid consultation fee");
    }

    setIsSaving(true);
    
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
        bio: formData.bio,
      };

      const updatedDoctor = updateDoctor(doctor.id, updates);
      if (updatedDoctor) {
        setDoctorSession(updatedDoctor);
        setDoctor(updatedDoctor);
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!doctor) {
    return <div className="p-12 text-center text-text-secondary">Loading your workspace...</div>;
  }

  const initials = doctor.name.replace("Dr. ", "").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F7F9FC]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm mb-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          <div className="relative">
            <div className="size-24 sm:size-28 shrink-0 rounded-full bg-primary text-3xl font-bold text-white shadow-md ring-4 ring-white flex items-center justify-center font-serif">
              {initials}
            </div>
            {doctor.rating > 4.5 && (
              <div className="absolute -bottom-2 -right-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                <svg className="size-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Verified
              </div>
            )}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-serif mb-2">{formData.name || doctor.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-text-secondary mb-3">
              <span className="flex items-center gap-1.5 text-primary bg-primary/5 px-2.5 py-1 rounded-md">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {formData.specialty || doctor.specialty}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="relative flex size-2.5">
                  {todayAvailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>}
                  <span className={`relative inline-flex rounded-full size-2.5 ${todayAvailable ? 'bg-success' : 'bg-text-secondary/50'}`}></span>
                </span>
                {todayAvailable ? <span className="text-success font-bold">Available Today</span> : "Next Available: " + nextAvailableStr}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-text-secondary">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-text-primary leading-none">{formData.experienceYears || doctor.experienceYears} Years</p>
                  <p className="text-xs text-text-secondary mt-0.5">Experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-text-secondary">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2" /></svg>
                </div>
                <div>
                  <p className="font-bold text-text-primary leading-none truncate max-w-[120px]">{formData.qualification || doctor.qualification || "Licensed"}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Qualification</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-text-secondary">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-bold text-text-primary leading-none">${formData.consultationFee || doctor.consultationFee}</p>
                  <p className="text-xs text-text-secondary mt-0.5">Consultation Fee</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-row lg:flex-col items-center gap-3 w-full lg:w-auto relative z-10">
          <Button 
            onClick={() => router.push("/doctor/availability")}
            className="w-full lg:w-48 bg-[#16324F] hover:bg-[#16324F]/90 text-white shadow-md border-transparent"
          >
            Manage Availability
          </Button>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full lg:w-48 px-4 py-2.5 rounded-xl border border-border bg-white text-sm font-bold text-text-primary shadow-sm hover:border-primary hover:text-primary transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-[280px] xl:w-[320px] shrink-0 space-y-6">
          <div className="bg-white rounded-3xl border border-border shadow-sm p-4 hidden lg:block">
            <nav className="space-y-1">
              {[
                { id: "overview", label: "Profile Overview", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { id: "personal", label: "Personal Information", icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" },
                { id: "professional", label: "Professional Details", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
                { id: "clinic", label: "Clinic Information", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { id: "contact", label: "Contact & Account", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === item.id || (activeTab === "overview" && item.id === "overview")
                      ? "bg-primary/5 text-primary"
                      : "text-text-secondary hover:bg-stone-50 hover:text-text-primary"
                  }`}
                >
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-sm p-6 hidden lg:block">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <svg className="size-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Profile Completion
            </h3>
            <div className="flex items-center justify-between text-sm font-bold text-text-primary mb-2">
              <span>{profileCompletion}%</span>
            </div>
            <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${profileCompletion === 100 ? 'bg-success' : 'bg-primary'}`}
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
            {profileCompletion < 100 && (
              <p className="text-xs text-text-secondary">Add missing professional details to help patients better understand your practice.</p>
            )}
            {profileCompletion === 100 && (
              <p className="text-xs text-success font-medium">Your profile is completely verified and ready for patients.</p>
            )}
          </div>
          
          <div className="bg-white rounded-3xl border border-border shadow-sm p-6">
            <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
              <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Availability Summary
            </h3>
            <div className="flex items-center gap-3 bg-background border border-border rounded-xl p-4 mb-4">
              <span className="relative flex size-3 shrink-0">
                {todayAvailable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>}
                <span className={`relative inline-flex rounded-full size-3 ${todayAvailable ? 'bg-success' : 'bg-text-secondary/50'}`}></span>
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary">{todayAvailable ? "Available Today" : "Not Available Today"}</p>
                <p className="text-xs text-text-secondary font-medium">Next: {nextAvailableStr}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/doctor/availability")}
              className="w-full py-2.5 rounded-xl border border-border bg-white text-xs font-bold text-text-primary shadow-sm hover:border-primary hover:text-primary transition-colors"
            >
              Manage Calendar &rarr;
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0">
          
          {isEditing && (
            <div className="mb-6 rounded-2xl bg-amber-50 p-5 border border-amber-200 shadow-sm flex items-start justify-between sticky top-20 z-30 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <svg className="size-5 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Edit Mode Active</h3>
                  <p className="text-sm text-amber-700 mt-1">Make your changes across all sections below.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <Button onClick={handleSave} isLoading={isSaving} className="shadow-md">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            {/* PERSONAL INFO */}
            <div id="personal" className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-border bg-stone-50/50 flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Personal Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {!isEditing ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Full Name</span>
                      <span className="text-base font-medium text-text-primary">{formData.name || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Gender</span>
                      <span className="text-base font-medium text-text-primary">{formData.gender || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Date of Birth</span>
                      <span className="text-base font-medium text-text-primary">{formData.dob ? new Date(formData.dob).toLocaleDateString() : "-"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Input label="Full Name" type="text" value={formData.name} onChange={e => handleChange("name", e.target.value)} disabled={isSaving} />
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-sm font-semibold text-text-primary">Gender</label>
                      <select value={formData.gender} onChange={e => handleChange("gender", e.target.value)} disabled={isSaving} className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => handleChange("dob", e.target.value)} disabled={isSaving} />
                  </>
                )}
              </div>
            </div>

            {/* PROFESSIONAL INFO */}
            <div id="professional" className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-border bg-stone-50/50 flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Professional Details
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {!isEditing ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Specialty</span>
                      <span className="text-base font-medium text-primary">{formData.specialty || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Qualification</span>
                      <span className="text-base font-medium text-text-primary">{formData.qualification || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Experience</span>
                      <span className="text-base font-medium text-text-primary">{formData.experienceYears} Years</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Consultation Fee</span>
                      <span className="text-base font-medium text-text-primary">${formData.consultationFee}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Input label="Specialty" type="text" value={formData.specialty} onChange={e => handleChange("specialty", e.target.value)} disabled={isSaving} />
                    <Input label="Qualification (e.g. MBBS, MD)" type="text" value={formData.qualification} onChange={e => handleChange("qualification", e.target.value)} disabled={isSaving} />
                    <Input label="Experience (Years)" type="number" min="0" value={formData.experienceYears} onChange={e => handleChange("experienceYears", e.target.value)} disabled={isSaving} />
                    <Input label="Consultation Fee ($)" type="number" min="0" value={formData.consultationFee} onChange={e => handleChange("consultationFee", e.target.value)} disabled={isSaving} />
                  </>
                )}
              </div>
            </div>

            {/* BIO / ABOUT */}
            <div id="bio" className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-border bg-stone-50/50 flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Professional Bio
                </h3>
              </div>
              <div className="p-6">
                {!isEditing ? (
                  <p className="text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {formData.bio || "No professional bio provided yet. Edit your profile to add one."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-semibold text-text-primary">About Me</label>
                    <textarea 
                      value={formData.bio} 
                      onChange={e => handleChange("bio", e.target.value)} 
                      disabled={isSaving}
                      rows={5}
                      placeholder="Write a brief professional biography..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm font-medium shadow-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white resize-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* CLINIC / CONTACT */}
            <div id="contact" className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-5 border-b border-border bg-stone-50/50 flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  Clinic & Contact Information
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {!isEditing ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Phone Number</span>
                      <span className="text-base font-medium text-text-primary">{formData.phone || "-"}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Email Address</span>
                      <span className="text-base font-medium text-text-primary">{formData.email}</span>
                      <span className="text-[10px] text-text-secondary font-medium">Login Identifier (Non-editable)</span>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Clinic / Office Address</span>
                      <span className="text-base font-medium text-text-primary">{formData.address || "-"}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Input label="Phone Number" type="tel" value={formData.phone} onChange={e => handleChange("phone", e.target.value)} disabled={isSaving} />
                    <div className="opacity-70">
                      <Input label="Email Address (Login ID)" type="email" value={formData.email} onChange={() => {}} disabled={true} />
                      <span className="text-xs font-semibold text-text-secondary mt-1 block">Email address cannot be changed.</span>
                    </div>
                    <div className="md:col-span-2">
                      <Input label="Clinic / Office Address" type="text" value={formData.address} onChange={e => handleChange("address", e.target.value)} disabled={isSaving} />
                    </div>
                  </>
                )}
              </div>
            </div>
            
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
