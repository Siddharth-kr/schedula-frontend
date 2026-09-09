"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserProfile, updateUserProfile } from "@/lib/user-profile-store";
import { getAppointmentsForPatient } from "@/lib/appointment-store";
import { getPrescriptionsForPatient } from "@/lib/prescription-store";
import type { UserProfile } from "@/types/user-profile";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function UserProfileForm() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  
  // Stats
  const [totalPrescriptions, setTotalPrescriptions] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);

  const [profile, setProfile] = useState<Partial<UserProfile>>({
    fullName: "", dob: "", gender: "", phone: "", email: "", address: "", city: "", state: "", pincode: "",
    maritalStatus: "", nationality: "", preferredLanguage: "",
    height: "", weight: "", bloodGroup: "", bodyType: "", activityLevel: "",
    dietType: "", exerciseFrequency: "", sleepDuration: "", smokingStatus: "", alcoholConsumption: "", occupation: "",
    medicalConditions: [], allergies: [], currentMedications: [], previousSurgeries: [], medicalHistoryNotes: "",
    insuranceProvider: "", policyNumber: "", insuranceMemberId: "", insurancePlanType: "", insuranceCoverageStart: "", insuranceCoverageEnd: "", insuranceContact: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "", emergencyContactEmail: "", emergencyContactAddress: ""
  });

  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");

  const [newSurgName, setNewSurgName] = useState("");
  const [newSurgYear, setNewSurgYear] = useState("");
  const [newSurgNotes, setNewSurgNotes] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("mock_user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserId(user.name);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserEmail(user.email || "");
    
    // Stats
    const apts = getAppointmentsForPatient(user.name);
    setCompletedAppointments(apts.filter(a => a.status === "completed").length);
    setTotalPrescriptions(getPrescriptionsForPatient(user.name).length);

    // Profile Data
    const existing = getUserProfile(user.name);
    if (existing) {
      setProfile({
        ...existing,
        medicalConditions: existing.medicalConditions || [],
        allergies: existing.allergies || [],
        currentMedications: existing.currentMedications || [],
        previousSurgeries: existing.previousSurgeries || []
      });
    } else {
      setProfile(p => ({ ...p, fullName: user.name, email: user.email }));
    }
    
    setIsLoading(false);
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayAdd = (key: 'medicalConditions' | 'allergies', value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    setProfile(prev => ({ ...prev, [key]: [...(prev[key] || []), value.trim()] }));
    setter("");
  };

  const handleArrayRemove = (key: 'medicalConditions' | 'allergies', index: number) => {
    setProfile(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const med = { name: newMedName.trim(), dosage: newMedDosage.trim(), frequency: newMedFreq.trim() };
    setProfile(prev => ({
      ...prev,
      currentMedications: [...(prev.currentMedications as unknown[] || []), med] as { name: string; dosage: string; frequency: string }[]
    }));
    setNewMedName(""); setNewMedDosage(""); setNewMedFreq("");
  };

  const handleRemoveMedication = (index: number) => {
    setProfile(prev => {
      const arr = [...(prev.currentMedications as unknown[] || [])];
      arr.splice(index, 1);
      return { ...prev, currentMedications: arr as { name: string; dosage: string; frequency: string }[] };
    });
  };

  const handleAddSurgery = () => {
    if (!newSurgName.trim()) return;
    const surg = { surgery: newSurgName.trim(), year: newSurgYear.trim(), notes: newSurgNotes.trim() };
    setProfile(prev => ({
      ...prev,
      previousSurgeries: [...(prev.previousSurgeries || []), surg]
    }));
    setNewSurgName(""); setNewSurgYear(""); setNewSurgNotes("");
  };

  const handleRemoveSurgery = (index: number) => {
    setProfile(prev => {
      const arr = [...(prev.previousSurgeries || [])];
      arr.splice(index, 1);
      return { ...prev, previousSurgeries: arr };
    });
  };

  const getBMI = () => {
    if (!profile.height || !profile.weight) return "--";
    const h = parseFloat(profile.height) / 100;
    const w = parseFloat(profile.weight);
    if (isNaN(h) || isNaN(w) || h === 0) return "--";
    return (w / (h * h)).toFixed(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsSaving(true);
    
    // Simulate network delay
    setTimeout(() => {
      updateUserProfile({ ...(profile as UserProfile), id: userId });
      setIsSaving(false);
      toast.success("Profile updated successfully.");
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: '👤' },
    { id: 'medical', label: 'Medical Information', icon: '❤️' },
    { id: 'insurance', label: 'Insurance & Documents', icon: '🛡️' },
    { id: 'emergency', label: 'Emergency Contact', icon: '📞' },
    { id: 'account', label: 'Account & Security', icon: '🔒' }
  ];

  return (
    <div className="min-h-screen w-full bg-background pb-12 pt-8">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] gap-8 w-full items-start">
          
          {/* LEFT SIDEBAR */}
          <aside className="w-full flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h1 className="text-xl font-bold font-serif text-text-primary mb-1">My Profile</h1>
              <p className="text-xs text-text-secondary mb-6">Manage your personal and medical information.</p>
              
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="size-24 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-3xl uppercase ring-1 ring-primary/20 mb-4">
                  {profile.fullName?.substring(0, 2) || "PA"}
                </div>
                <h2 className="text-lg font-bold text-text-primary">{profile.fullName}</h2>
                <p className="text-sm text-text-secondary mb-3">{profile.email || userEmail}</p>
                <span className="inline-block bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Patient</span>
              </div>

              <div className="py-6 space-y-5 border-b border-border">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Total Prescriptions</p>
                  <p className="text-2xl font-black text-text-primary">{totalPrescriptions}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Completed Appointments</p>
                  <p className="text-2xl font-black text-text-primary">{completedAppointments}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Test Reports</p>
                  <p className="text-2xl font-black text-text-primary">0</p>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Quick Links</h3>
                <nav className="flex flex-col gap-1">
                  <Link href="/appointments" className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 text-sm font-medium text-text-primary transition-colors">
                    <span className="flex items-center gap-2"><span>📅</span> My Appointments</span>
                    <span className="text-text-secondary">→</span>
                  </Link>
                  <Link href="/prescriptions" className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 text-sm font-medium text-text-primary transition-colors">
                    <span className="flex items-center gap-2"><span>💊</span> My Prescriptions</span>
                    <span className="text-text-secondary">→</span>
                  </Link>
                  <button type="button" className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 text-sm font-medium text-text-primary transition-colors cursor-not-allowed opacity-60">
                    <span className="flex items-center gap-2"><span>🧪</span> Test Reports</span>
                    <span className="text-text-secondary">→</span>
                  </button>
                  <button type="button" className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 text-sm font-medium text-text-primary transition-colors cursor-not-allowed opacity-60">
                    <span className="flex items-center gap-2"><span>💳</span> Payment History</span>
                    <span className="text-text-secondary">→</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('account')} className="flex items-center justify-between px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 text-sm font-medium text-text-primary transition-colors">
                    <span className="flex items-center gap-2"><span>⚙️</span> Settings & Privacy</span>
                    <span className="text-text-secondary">→</span>
                  </button>
                </nav>
              </div>
            </div>

            <div className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-5 shadow-sm text-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none">🛡️</span>
                <div>
                  <h4 className="font-bold text-[#065F46] mb-1">Your information is secure</h4>
                  <p className="text-[#047857] text-xs leading-relaxed">Your health information is protected and shared only with authorized healthcare professionals.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm text-sm text-center">
              <h4 className="font-bold text-text-primary mb-1 text-base">Need Help?</h4>
              <p className="text-text-secondary text-xs leading-relaxed mb-4">Need assistance with your profile or appointments?</p>
              <Button type="button" variant="outline" className="w-full text-xs py-2">Chat with us</Button>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="min-w-0 w-full flex flex-col gap-6">
            
            <header className="mb-2">
              <h2 className="text-3xl font-bold font-serif text-text-primary mb-2">My Profile</h2>
              <p className="text-text-secondary text-sm">Manage your personal, medical and account information.</p>
            </header>

            {/* TABS */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-xl text-sm font-bold transition-all shrink-0 ${activeTab === tab.id ? 'bg-primary text-white shadow-md' : 'bg-white text-text-secondary border border-border hover:border-primary hover:text-primary'}`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* TAB: PERSONAL */}
              {activeTab === 'personal' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6">
                  {/* Personal Info */}
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Personal Information</h3>
                      <p className="text-sm text-text-secondary mt-1">Update your basic personal details.</p>
                    </div>
                    <div className="p-6 sm:p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr] gap-6">
                        <Input label="Full Name *" name="fullName" value={profile.fullName} onChange={handleChange} required />
                        <Input label="Email *" name="email" type="email" value={profile.email} onChange={handleChange} required />
                        <Input label="Phone Number *" name="phone" type="tel" value={profile.phone} onChange={handleChange} required pattern="[0-9+\s\-]{7,15}" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="Date of Birth *" name="dob" type="date" value={profile.dob} onChange={handleChange} required max={new Date().toISOString().split("T")[0]} />
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Gender *</label>
                          <select name="gender" value={profile.gender} onChange={handleChange} required className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Blood Group</label>
                          <select name="bloodGroup" value={profile.bloodGroup} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Unknown</option>
                            <option value="A+">A+</option><option value="A-">A-</option>
                            <option value="B+">B+</option><option value="B-">B-</option>
                            <option value="O+">O+</option><option value="O-">O-</option>
                            <option value="AB+">AB+</option><option value="AB-">AB-</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Marital Status</label>
                          <select name="maritalStatus" value={profile.maritalStatus} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                        <Input label="Nationality" name="nationality" value={profile.nationality || ""} onChange={handleChange} />
                        <Input label="Preferred Language" name="preferredLanguage" value={profile.preferredLanguage || ""} onChange={handleChange} />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Address</h3>
                    </div>
                    <div className="p-6 sm:p-10 space-y-6">
                      <Input label="Address Line" name="address" value={profile.address} onChange={handleChange} className="max-w-full" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="City" name="city" value={profile.city} onChange={handleChange} />
                        <Input label="State" name="state" value={profile.state} onChange={handleChange} />
                        <Input label="Pincode" name="pincode" value={profile.pincode} onChange={handleChange} />
                      </div>
                    </div>
                  </div>

                  {/* Physical Details */}
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Physical Details</h3>
                      <p className="text-sm text-text-secondary mt-1">Optional information that can help healthcare professionals understand your health profile.</p>
                    </div>
                    <div className="p-6 sm:p-10 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Input label="Height (cm)" name="height" type="number" min="0" value={profile.height} onChange={handleChange} />
                        <Input label="Weight (kg)" name="weight" type="number" min="0" value={profile.weight} onChange={handleChange} />
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">BMI</label>
                          <div className="w-full rounded-xl border border-transparent bg-stone-50 px-4 py-3 font-bold text-text-primary">{getBMI()}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Blood Group</label>
                          <div className="w-full rounded-xl border border-transparent bg-stone-50 px-4 py-3 font-bold text-text-primary">{profile.bloodGroup || "Unknown"}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Body Type" name="bodyType" placeholder="e.g. Athletic, Average..." value={profile.bodyType || ""} onChange={handleChange} />
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Activity Level</label>
                          <select name="activityLevel" value={profile.activityLevel || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Sedentary">Sedentary</option>
                            <option value="Lightly Active">Lightly Active</option>
                            <option value="Moderately Active">Moderately Active</option>
                            <option value="Very Active">Very Active</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Information */}
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Lifestyle Information</h3>
                    </div>
                    <div className="p-6 sm:p-10 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Diet Type</label>
                          <select name="dietType" value={profile.dietType || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Vegetarian">Vegetarian</option>
                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                            <option value="Vegan">Vegan</option>
                            <option value="Eggetarian">Eggetarian</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Exercise Frequency</label>
                          <select name="exerciseFrequency" value={profile.exerciseFrequency || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Never">Never</option>
                            <option value="1–2 times/week">1–2 times/week</option>
                            <option value="3–4 times/week">3–4 times/week</option>
                            <option value="5+ times/week">5+ times/week</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Sleep Duration</label>
                          <select name="sleepDuration" value={profile.sleepDuration || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Less than 5 hours">Less than 5 hours</option>
                            <option value="5–6 hours">5–6 hours</option>
                            <option value="6–7 hours">6–7 hours</option>
                            <option value="7–8 hours">7–8 hours</option>
                            <option value="More than 8 hours">More than 8 hours</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Smoking</label>
                          <select name="smokingStatus" value={profile.smokingStatus || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Never">Never</option>
                            <option value="Former smoker">Former smoker</option>
                            <option value="Occasionally">Occasionally</option>
                            <option value="Regularly">Regularly</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Alcohol</label>
                          <select name="alcoholConsumption" value={profile.alcoholConsumption || ""} onChange={handleChange} className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Never">Never</option>
                            <option value="Occasionally">Occasionally</option>
                            <option value="Regularly">Regularly</option>
                          </select>
                        </div>
                        <Input label="Occupation / Work Type" name="occupation" value={profile.occupation || ""} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MEDICAL */}
              {activeTab === 'medical' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6">
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Medical Information</h3>
                      <p className="text-sm text-text-secondary mt-1">Keep your health history up to date.</p>
                    </div>
                    <div className="p-6 sm:p-10 space-y-10">
                      
                      {/* Conditions */}
                      <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-3">MEDICAL CONDITIONS</label>
                        {(!profile.medicalConditions || profile.medicalConditions.length === 0) && (
                          <p className="text-sm text-text-secondary/60 mb-3 italic">No medical conditions added yet.</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.medicalConditions?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary border border-primary/20">
                              {item} 
                              <button type="button" onClick={() => handleArrayRemove('medicalConditions', idx)} className="hover:text-error text-primary ml-1 text-lg leading-none">&times;</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-3 max-w-md">
                          <input type="text" value={newCondition} onChange={e => setNewCondition(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('medicalConditions', newCondition, setNewCondition))} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="e.g. Diabetes" />
                          <Button type="button" variant="outline" onClick={() => handleArrayAdd('medicalConditions', newCondition, setNewCondition)}>Add</Button>
                        </div>
                      </div>

                      {/* Allergies */}
                      <div className="pt-6 border-t border-border">
                        <label className="block text-sm font-semibold text-text-secondary mb-3">ALLERGIES</label>
                        {(!profile.allergies || profile.allergies.length === 0) && (
                          <p className="text-sm text-text-secondary/60 mb-3 italic">No allergies added.</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {profile.allergies?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-error/10 px-4 py-1.5 text-sm font-bold text-error border border-error/20">
                              {item} 
                              <button type="button" onClick={() => handleArrayRemove('allergies', idx)} className="hover:text-error text-error ml-1 text-lg leading-none">&times;</button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-3 max-w-md">
                          <input type="text" value={newAllergy} onChange={e => setNewAllergy(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleArrayAdd('allergies', newAllergy, setNewAllergy))} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="e.g. Penicillin" />
                          <Button type="button" variant="outline" onClick={() => handleArrayAdd('allergies', newAllergy, setNewAllergy)}>Add</Button>
                        </div>
                      </div>

                      {/* Medications */}
                      <div className="pt-6 border-t border-border">
                        <label className="block text-sm font-semibold text-text-secondary mb-3">CURRENT MEDICATIONS</label>
                        {(!profile.currentMedications || profile.currentMedications.length === 0) && (
                          <p className="text-sm text-text-secondary/60 mb-4 italic">No current medications added.</p>
                        )}
                        <div className="space-y-3 mb-6">
                          {profile.currentMedications?.map((item: { name: string; dosage: string; frequency: string } | string, idx) => {
                            // Support legacy string arrays
                            if (typeof item === 'string') {
                               return (
                                <div key={idx} className="flex justify-between items-center bg-stone-50 border border-border rounded-xl p-4">
                                  <span className="font-bold text-text-primary text-sm">{item}</span>
                                  <button type="button" onClick={() => handleRemoveMedication(idx)} className="text-error text-xs font-bold hover:underline">Remove</button>
                                </div>
                               );
                            }
                            return (
                              <div key={idx} className="flex justify-between items-center bg-stone-50 border border-border rounded-xl p-4">
                                <div>
                                  <p className="font-bold text-text-primary text-sm mb-1">{item.name}</p>
                                  <p className="text-xs text-text-secondary font-medium">Dosage: {item.dosage} • Frequency: {item.frequency}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveMedication(idx)} className="text-error text-xs font-bold hover:underline">Remove</button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="bg-stone-50/50 rounded-2xl border border-border p-5">
                          <p className="text-xs font-bold text-text-secondary uppercase mb-4">Add Medication</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <input type="text" value={newMedName} onChange={e => setNewMedName(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Medication Name" />
                            <input type="text" value={newMedDosage} onChange={e => setNewMedDosage(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Dosage (e.g. 500mg)" />
                            <input type="text" value={newMedFreq} onChange={e => setNewMedFreq(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Frequency (e.g. Twice daily)" />
                          </div>
                          <Button type="button" variant="outline" onClick={handleAddMedication}>+ Add Medication</Button>
                        </div>
                      </div>

                      {/* Surgeries */}
                      <div className="pt-6 border-t border-border">
                        <label className="block text-sm font-semibold text-text-secondary mb-3">PREVIOUS SURGERIES</label>
                        {(!profile.previousSurgeries || profile.previousSurgeries.length === 0) && (
                          <p className="text-sm text-text-secondary/60 mb-4 italic">No surgeries added.</p>
                        )}
                        <div className="space-y-3 mb-6">
                          {profile.previousSurgeries?.map((item: { surgery: string; year: string; notes: string }, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-stone-50 border border-border rounded-xl p-4">
                              <div>
                                <p className="font-bold text-text-primary text-sm mb-1">{item.surgery} <span className="text-text-secondary font-medium text-xs ml-2">({item.year})</span></p>
                                {item.notes && <p className="text-xs text-text-secondary font-medium">{item.notes}</p>}
                              </div>
                              <button type="button" onClick={() => handleRemoveSurgery(idx)} className="text-error text-xs font-bold hover:underline">Remove</button>
                            </div>
                          ))}
                        </div>
                        <div className="bg-stone-50/50 rounded-2xl border border-border p-5">
                          <p className="text-xs font-bold text-text-secondary uppercase mb-4">Add Surgery</p>
                          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-4 mb-4">
                            <input type="text" value={newSurgName} onChange={e => setNewSurgName(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Surgery" />
                            <input type="text" value={newSurgYear} onChange={e => setNewSurgYear(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Year" />
                            <input type="text" value={newSurgNotes} onChange={e => setNewSurgNotes(e.target.value)} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:border-primary outline-none" placeholder="Notes (Optional)" />
                          </div>
                          <Button type="button" variant="outline" onClick={handleAddSurgery}>+ Add Surgery</Button>
                        </div>
                      </div>

                      {/* History */}
                      <div className="pt-6 border-t border-border">
                        <label className="block text-sm font-semibold text-text-secondary mb-3">MEDICAL HISTORY / ADDITIONAL NOTES</label>
                        <textarea name="medicalHistoryNotes" value={profile.medicalHistoryNotes || ""} onChange={handleChange} className="w-full rounded-xl border border-border px-4 py-4 outline-none min-h-[140px] focus:border-primary text-sm" placeholder="Add any relevant medical history, previous diagnoses, or information you would like your healthcare provider to know."></textarea>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INSURANCE */}
              {activeTab === 'insurance' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6">
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Insurance & Documents</h3>
                      <p className="text-sm text-text-secondary mt-1">Manage your health insurance details.</p>
                    </div>
                    <div className="p-6 sm:p-10 space-y-8">
                      {(!profile.insuranceProvider && !profile.policyNumber) && (
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-primary text-sm font-medium mb-4">
                          No insurance information added.
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Insurance Provider" name="insuranceProvider" value={profile.insuranceProvider} onChange={handleChange} />
                        <Input label="Policy Number" name="policyNumber" value={profile.policyNumber} onChange={handleChange} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Member ID" name="insuranceMemberId" value={profile.insuranceMemberId || ""} onChange={handleChange} />
                        <Input label="Plan Type (e.g. HMO, PPO)" name="insurancePlanType" value={profile.insurancePlanType || ""} onChange={handleChange} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input label="Coverage Start Date" name="insuranceCoverageStart" type="date" value={profile.insuranceCoverageStart || ""} onChange={handleChange} />
                        <Input label="Coverage End Date" name="insuranceCoverageEnd" type="date" value={profile.insuranceCoverageEnd || ""} onChange={handleChange} />
                        <Input label="Insurance Contact Number" name="insuranceContact" type="tel" value={profile.insuranceContact || ""} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: EMERGENCY */}
              {activeTab === 'emergency' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6">
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Emergency Contact</h3>
                      <p className="text-sm text-text-secondary mt-1">Who should we contact in case of an emergency?</p>
                    </div>
                    <div className="p-6 sm:p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.5fr] gap-6">
                        <Input label="Contact Name *" name="emergencyContactName" value={profile.emergencyContactName} onChange={handleChange} required />
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Relationship *</label>
                          <select name="emergencyContactRelation" value={profile.emergencyContactRelation} onChange={handleChange} required className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary">
                            <option value="">Select...</option>
                            <option value="Parent">Parent</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Friend">Friend</option>
                            <option value="Guardian">Guardian</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <Input label="Phone Number *" name="emergencyContactPhone" type="tel" value={profile.emergencyContactPhone} onChange={handleChange} required pattern="[0-9+\s\-]{7,15}" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Email (Optional)" name="emergencyContactEmail" type="email" value={profile.emergencyContactEmail || ""} onChange={handleChange} />
                        <Input label="Address (Optional)" name="emergencyContactAddress" value={profile.emergencyContactAddress || ""} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ACCOUNT */}
              {activeTab === 'account' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6">
                  <div className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-border bg-stone-50/50 px-6 sm:px-10 py-6">
                      <h3 className="text-xl font-bold text-text-primary">Account & Security</h3>
                    </div>
                    <div className="p-6 sm:p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-stone-50 rounded-xl p-5 border border-border">
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Email Address</p>
                          <p className="text-base font-bold text-text-primary">{profile.email || userEmail}</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-5 border border-border">
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Phone Number</p>
                          <p className="text-base font-bold text-text-primary">{profile.phone || "Not set"}</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-5 border border-border">
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Account Created</p>
                          <p className="text-base font-bold text-text-primary">January 2026</p>
                        </div>
                        <div className="bg-stone-50 rounded-xl p-5 border border-border">
                          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Last Profile Update</p>
                          <p className="text-base font-bold text-text-primary">Today</p>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-border">
                        <h4 className="text-sm font-bold text-text-primary mb-4">Security Actions</h4>
                        <Button type="button" variant="outline">Change Password</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* STICKY SAVE BAR */}
              <div className="sticky bottom-4 mt-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg flex justify-end items-center">
                <Button type="submit" className="w-full sm:w-auto px-10 py-4 text-base" disabled={isSaving} isLoading={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>

            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
