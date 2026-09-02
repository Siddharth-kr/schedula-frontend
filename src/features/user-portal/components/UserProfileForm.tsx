"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, updateUserProfile } from "@/lib/user-profile-store";
import { getAppointmentsForPatient } from "@/lib/appointment-store";
import { getPrescriptionsForPatient } from "@/lib/prescription-store";
import type { UserProfile } from "@/types/user-profile";
import { toast } from "react-toastify";

export function UserProfileForm() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stats
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);

  const [profile, setProfile] = useState<Partial<UserProfile>>({
    fullName: "", dob: "", gender: "", phone: "", email: "", address: "", city: "", state: "", pincode: "",
    height: "", weight: "", bloodGroup: "",
    medicalConditions: [], allergies: [], currentMedications: [],
    insuranceProvider: "", policyNumber: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: ""
  });

  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newMedication, setNewMedication] = useState("");

  const loadData = () => {
    const userStr = localStorage.getItem("mock_user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setUserId(user.name);

    // Load stats
    const apts = getAppointmentsForPatient(user.name);
    setCompletedAppointments(apts.filter(a => a.status === "completed").length);
    const prescs = getPrescriptionsForPatient(user.name);
    setTotalPrescriptions(prescs.length);

    // Load profile
    const existing = getUserProfile(user.name);
    if (existing) {
      setProfile(existing);
    } else {
      setProfile(prev => ({ ...prev, fullName: user.name, email: user.email }));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    Promise.resolve().then(loadData);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "schedula_user_profiles" || e.key === "schedula_appointments" || e.key === "schedula_prescriptions") loadData();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleArrayAdd = (field: keyof UserProfile, value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: [...current, value.trim()] });
    setter("");
  };

  const handleArrayRemove = (field: keyof UserProfile, index: number) => {
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: current.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    updateUserProfile({ ...profile, id: userId } as UserProfile);
    toast.success("Profile updated successfully");
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-text-primary">My Profile</h1>
        <p className="mt-2 text-sm text-text-secondary">Manage your personal and medical information.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Prescriptions</p>
          <p className="mt-2 text-3xl font-bold text-primary-dark">{totalPrescriptions}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Completed Appointments</p>
          <p className="mt-2 text-3xl font-bold text-primary-dark">{completedAppointments}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Test Reports</p>
          <p className="mt-2 text-3xl font-bold text-primary-dark">0</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Information */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4">
            <h2 className="font-bold text-text-primary">Personal Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Full Name <span className="text-error">*</span></label>
              <input type="text" name="fullName" value={profile.fullName || ""} onChange={handleChange} required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email <span className="text-error">*</span></label>
              <input type="email" name="email" value={profile.email || ""} onChange={handleChange} required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none bg-background" readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Phone <span className="text-error">*</span></label>
              <input type="tel" name="phone" value={profile.phone || ""} onChange={handleChange} required pattern="[0-9+\s\-]{7,15}" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Date of Birth</label>
              <input type="date" name="dob" value={profile.dob || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Gender</label>
              <select name="gender" value={profile.gender || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Address</label>
                <input type="text" name="address" value={profile.address || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">City</label>
                <input type="text" name="city" value={profile.city || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">State</label>
                <input type="text" name="state" value={profile.state || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Pincode</label>
                <input type="text" name="pincode" value={profile.pincode || ""} onChange={handleChange} pattern="[0-9]{4,6}" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Physical Details */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4">
            <h2 className="font-bold text-text-primary">Physical Details</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Height (cm)</label>
              <input type="number" min="0" step="0.1" name="height" value={profile.height || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Weight (kg)</label>
              <input type="number" min="0" step="0.1" name="weight" value={profile.weight || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Blood Group</label>
              <select name="bloodGroup" value={profile.bloodGroup || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none">
                <option value="">Select...</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="border-b border-border bg-background/50 px-6 py-4">
            <h2 className="font-bold text-text-primary">Medical Information</h2>
          </div>
          <div className="p-6 space-y-6">
            
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Medical Conditions</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.medicalConditions?.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/30">
                    {item} <button type="button" onClick={() => handleArrayRemove('medicalConditions', idx)} className="hover:text-error text-primary font-bold ml-1">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input type="text" value={newCondition} onChange={e => setNewCondition(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('medicalConditions', newCondition, setNewCondition))} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Diabetes" />
                <button type="button" onClick={() => handleArrayAdd('medicalConditions', newCondition, setNewCondition)} className="rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary hover:bg-slate-200">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Allergies</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.allergies?.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-error/10 px-3 py-1 text-xs font-medium text-error border border-error/30">
                    {item} <button type="button" onClick={() => handleArrayRemove('allergies', idx)} className="hover:text-error text-error font-bold ml-1">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input type="text" value={newAllergy} onChange={e => setNewAllergy(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('allergies', newAllergy, setNewAllergy))} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Penicillin" />
                <button type="button" onClick={() => handleArrayAdd('allergies', newAllergy, setNewAllergy)} className="rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary hover:bg-slate-200">Add</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">Current Medications</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.currentMedications?.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success border border-success/30">
                    {item} <button type="button" onClick={() => handleArrayRemove('currentMedications', idx)} className="hover:text-error text-success font-bold ml-1">&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 max-w-sm">
                <input type="text" value={newMedication} onChange={e => setNewMedication(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('currentMedications', newMedication, setNewMedication))} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Metformin" />
                <button type="button" onClick={() => handleArrayAdd('currentMedications', newMedication, setNewMedication)} className="rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary hover:bg-slate-200">Add</button>
              </div>
            </div>

          </div>
        </div>

        {/* Insurance & Emergency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border bg-background/50 px-6 py-4">
              <h2 className="font-bold text-text-primary">Insurance</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Insurance Provider</label>
                <input type="text" name="insuranceProvider" value={profile.insuranceProvider || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Policy Number</label>
                <input type="text" name="policyNumber" value={profile.policyNumber || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
            <div className="border-b border-border bg-background/50 px-6 py-4">
              <h2 className="font-bold text-text-primary">Emergency Contact</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Name</label>
                <input type="text" name="emergencyContactName" value={profile.emergencyContactName || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Relationship</label>
                  <input type="text" name="emergencyContactRelation" value={profile.emergencyContactRelation || ""} onChange={handleChange} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Phone <span className="text-error">*</span></label>
                  <input type="tel" name="emergencyContactPhone" value={profile.emergencyContactPhone || ""} onChange={handleChange} pattern="[0-9+\s\-]{7,15}" className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primary-dark shadow-sm transition-colors">
            Save Profile
          </button>
        </div>

      </form>
    </div>
  );
}
