"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Doctor } from "@/types/doctor";
import { createAppointment } from "@/features/appointments/api/create-appointment";
import { getAvailableSlotsForDoctor, markSlotBooked, freeSlot } from "@/lib/availability-store";
import type { AvailabilitySlot } from "@/types/availability";
import { toast } from "react-toastify";

export function BookingForm({ doctor }: { doctor: Doctor }) {
  const router = useRouter();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Steps: 1: Patient, 2: Medical, 3: Visit, 4: Appointment, 5: Review
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [patientInfo, setPatientInfo] = useState({
    fullName: "", dob: "", gender: "", phone: "", email: "",
    address: "", city: "", state: "", pincode: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: ""
  });

  const [medicalInfo, setMedicalInfo] = useState({
    allergies: "", hasAllergies: "No",
    medicalConditions: "", hasConditions: "No",
    medications: "", hasMedications: "No",
    surgeries: "", hasSurgeries: "No"
  });

  const [visitInfo, setVisitInfo] = useState({
    reason: "", reasonOther: "",
    symptoms: "", symptomsStarted: "", severity: "",
    consultedBefore: "No", previousDiagnosis: "", additionalReportInfo: ""
  });

  const [appointmentInfo, setAppointmentInfo] = useState({
    date: "", timeSlotId: "", type: "",
    additionalInfo: "",
    preferredCommunication: "Email",
    reminderAppointment: true, reminderConfirmation: true, reminderRescheduling: true
  });

  const [confirmCheckbox1, setConfirmCheckbox1] = useState(false);
  const [confirmCheckbox2, setConfirmCheckbox2] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("mock_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPatientInfo(prev => ({ ...prev, fullName: u.name, email: u.email }));
      } catch {}
    }

    const slots = getAvailableSlotsForDoctor(doctor.id);
    const validSlots = slots.filter(s => {
      const slotDate = new Date(`${s.date}T${s.startTime}`);
      return slotDate > new Date() && !s.isBooked && !s.isUnavailable;
    });
    setAvailableSlots(validSlots);
    setIsLoaded(true);
  }, [doctor.id]);

  const availableDates = useMemo(() => {
    const dates = new Set(availableSlots.map(s => s.date));
    return Array.from(dates).sort();
  }, [availableSlots]);

  const slotsForDate = useMemo(() => {
    if (!appointmentInfo.date) return [];
    return availableSlots.filter(s => s.date === appointmentInfo.date).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointmentInfo.date, availableSlots]);

  const selectedSlot = useMemo(() => {
    return availableSlots.find(s => s.id === appointmentInfo.timeSlotId);
  }, [appointmentInfo.timeSlotId, availableSlots]);

  // Validation
  const validateStep1 = () => {
    if (!patientInfo.fullName) return "Full Name is required.";
    if (!patientInfo.dob) return "Date of Birth is required.";
    if (new Date(patientInfo.dob) > new Date()) return "Date of Birth cannot be in the future.";
    if (!patientInfo.gender) return "Gender is required.";
    if (!patientInfo.phone || patientInfo.phone.length < 5) return "Valid phone number is required.";
    if (!patientInfo.email || !patientInfo.email.includes("@")) return "Valid email is required.";
    return null;
  };

  const validateStep2 = () => null; // all optional or have defaults

  const validateStep3 = () => {
    if (!visitInfo.reason) return "Reason for visit is required.";
    if (visitInfo.reason === "Other" && !visitInfo.reasonOther) return "Please specify the reason for visit.";
    if (!visitInfo.symptoms) return "Symptoms description is required.";
    return null;
  };

  const validateStep4 = () => {
    if (!appointmentInfo.type) return "Appointment Type is required.";
    if (!appointmentInfo.date) return "Appointment Date is required.";
    if (!appointmentInfo.timeSlotId) return "Appointment Time is required.";
    return null;
  };

  const handleNext = () => {
    setError(null);
    let err = null;
    if (currentStep === 1) err = validateStep1();
    if (currentStep === 2) err = validateStep2();
    if (currentStep === 3) err = validateStep3();
    if (currentStep === 4) err = validateStep4();

    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(c => c + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(c => c - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 5) return;
    setError(null);

    if (!confirmCheckbox1 || !confirmCheckbox2) {
      setError("Please accept the required consent checkboxes before confirming.");
      return;
    }

    if (!selectedSlot) {
      setError("This time slot is no longer available. Please select another available time.");
      return;
    }

    const currentSlots = getAvailableSlotsForDoctor(doctor.id);
    const stillAvailable = currentSlots.find(s => s.id === selectedSlot.id && !s.isBooked && !s.isUnavailable);
    
    if (!stillAvailable) {
      setError("This appointment slot is no longer available. Please select another available time.");
      setAvailableSlots(currentSlots.filter(s => new Date(`${s.date}T${s.startTime}`) > new Date() && !s.isBooked && !s.isUnavailable));
      setAppointmentInfo(prev => ({...prev, timeSlotId: ""}));
      setCurrentStep(4);
      return;
    }

    setIsLoading(true);
    try {
      markSlotBooked(selectedSlot.id);

      const finalReason = visitInfo.reason === "Other" ? visitInfo.reasonOther : visitInfo.reason;

      const payload = {
        patient: { name: patientInfo.fullName, age: new Date().getFullYear() - new Date(patientInfo.dob).getFullYear() },
        doctorId: doctor.id,
        clinician: doctor.name,
        specialty: doctor.specialty,
        startsAt: `${selectedSlot.date}T${selectedSlot.startTime}`,
        reason: finalReason,
        durationMinutes: 30,
        patientInfo,
        medicalInfo: {
          allergies: medicalInfo.hasAllergies === "Yes" ? medicalInfo.allergies : "No known allergies",
          medicalConditions: medicalInfo.hasConditions === "Yes" ? medicalInfo.medicalConditions : "None",
          medications: medicalInfo.hasMedications === "Yes" ? medicalInfo.medications : "None",
          surgeries: medicalInfo.hasSurgeries === "Yes" ? medicalInfo.surgeries : "None",
          symptoms: visitInfo.symptoms,
          symptomsStarted: visitInfo.symptomsStarted,
          severity: visitInfo.severity,
          consultedBefore: visitInfo.consultedBefore,
          previousDiagnosis: visitInfo.previousDiagnosis,
          additionalInfo: appointmentInfo.additionalInfo,
          additionalReportInfo: visitInfo.additionalReportInfo
        },
        appointmentType: appointmentInfo.type,
        preferredCommunication: appointmentInfo.preferredCommunication
      };

      const apt = await createAppointment(payload);
      router.push(`/confirmation/${apt.id}`);
    } catch (err: unknown) {
      freeSlot(selectedSlot.id);
      toast.error("Unable to book the appointment.");
      setError(err instanceof Error ? err.message : "Unable to book the appointment.");
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary"></div>
        <span className="ml-3 text-text-secondary font-medium">Loading available appointment times...</span>
      </div>
    );
  }

  const stepTitles = ["Patient", "Medical", "Visit", "Appointment", "Review"];

  // Helper for slots grouping
  const groupSlots = (slots: AvailabilitySlot[]) => {
    const groups: Record<string, AvailabilitySlot[]> = { Morning: [], Afternoon: [], Evening: [] };
    slots.forEach(slot => {
      const hour = parseInt(slot.startTime.split(':')[0], 10);
      const isPM = slot.startTime.includes('PM');
      const hour24 = (isPM && hour !== 12) ? hour + 12 : (!isPM && hour === 12) ? 0 : hour;
      
      if (hour24 < 12) groups.Morning.push(slot);
      else if (hour24 < 17) groups.Afternoon.push(slot);
      else groups.Evening.push(slot);
    });
    return groups;
  };
  
  const slotGroups = groupSlots(slotsForDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)] gap-8 w-full">
      {/* LEFT SIDEBAR */}
      <aside className="w-full">
        <div className="sticky top-24 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold font-serif text-text-primary mb-2">Book an Appointment</h3>
            <p className="text-sm text-text-secondary mb-6">Please provide some information to help your doctor prepare for your visit.</p>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-2xl uppercase ring-1 ring-primary/20 shrink-0">
                {doctor.name.split(" ").map(n => n[0]).join("").substring(0,2)}
              </div>
              <div>
                <h4 className="font-bold text-text-primary">Dr. {doctor.name}</h4>
                <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
              </div>
            </div>
            
            <div className="space-y-4 text-sm pb-5 border-b border-border">
              <div className="flex justify-between">
                <span className="text-text-secondary">Experience</span>
                <span className="font-semibold text-text-primary">{doctor.experienceYears || "10"} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Consultation Fee</span>
                <span className="font-bold text-text-primary">₹{doctor.consultationFee}</span>
              </div>
            </div>

            {(appointmentInfo.date || selectedSlot || appointmentInfo.type) && (
              <div className="space-y-4 text-sm pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Selected Appointment</h4>
                
                {appointmentInfo.date && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Date</span>
                    <span className="font-bold text-text-primary">
                      {new Date(appointmentInfo.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
                {selectedSlot && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Time</span>
                    <span className="font-bold text-text-primary">{selectedSlot.startTime}</span>
                  </div>
                )}
                {appointmentInfo.type && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Type</span>
                    <span className="font-bold text-text-primary">{appointmentInfo.type}</span>
                  </div>
                )}
                
                <div className="pt-2 flex gap-3 text-xs font-bold text-primary">
                  <button type="button" onClick={() => setCurrentStep(4)} className="hover:underline">Change Date & Time</button>
                </div>
              </div>
            )}
          </div>

          {/* Progress Indicator Sidebar */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Progress</h4>
            <div className="space-y-4">
              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isPast = currentStep > stepNum;
                return (
                  <div key={title} className={`flex items-center gap-3 ${isActive ? 'text-primary' : isPast ? 'text-text-primary' : 'text-text-secondary/50'}`}>
                    <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-primary text-white' : isPast ? 'bg-primary/20 text-primary' : 'bg-background border border-border text-text-secondary/50'}`}>
                      {isPast ? '✓' : `0${stepNum}`}
                    </div>
                    <span className={`text-sm font-bold ${isActive ? '' : 'font-medium'}`}>{title}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="rounded-2xl border border-border bg-stone-50 p-5 shadow-sm text-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none">🔒</span>
              <div>
                <h4 className="font-bold text-text-primary mb-1">Your information is secure</h4>
                <p className="text-text-secondary leading-relaxed">Your details are securely handled and shared only with the doctor for your appointment.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT: Form */}
      <main className="min-w-0 w-full">
        {/* Horizontal Progress (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 mb-8 bg-white p-4 rounded-2xl border border-border shadow-sm">
           {stepTitles.map((title, idx) => {
             const stepNum = idx + 1;
             const isActive = currentStep === stepNum;
             const isPast = currentStep > stepNum;
             return (
               <div key={title} className="flex items-center gap-2">
                 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${isActive ? 'bg-primary/10 text-primary' : isPast ? 'text-text-primary' : 'text-text-secondary/50'}`}>
                    <div className={`size-5 rounded-full flex items-center justify-center text-[10px] ${isActive ? 'bg-primary text-white' : isPast ? 'bg-text-primary text-white' : 'bg-background border border-border text-text-secondary/50'}`}>
                      {isPast ? '✓' : stepNum}
                    </div>
                    {title}
                 </div>
                 {idx < stepTitles.length - 1 && <span className="text-border mx-1">→</span>}
               </div>
             );
           })}
        </div>
      
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {error && (
            <div className="rounded-xl bg-error/10 p-4 text-sm font-medium text-error ring-1 ring-inset ring-[var(--error)]/20" role="alert">
              {error}
            </div>
          )}

          {/* STEP 1: Patient Information */}
          {currentStep === 1 && (
            <section className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-bold text-text-primary font-serif mb-2">1. Patient Information</h3>
              <p className="text-sm text-text-secondary mb-10">Tell us a little about yourself.</p>
              
              <div className="space-y-10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr] gap-6">
                    <Input label="Full Name *" placeholder="John Doe" value={patientInfo.fullName} onChange={e => setPatientInfo({...patientInfo, fullName: e.target.value})} />
                    <Input label="Date of Birth *" type="date" value={patientInfo.dob} onChange={e => setPatientInfo({...patientInfo, dob: e.target.value})} />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Gender *</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary transition-colors" value={patientInfo.gender} onChange={e => setPatientInfo({...patientInfo, gender: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Phone Number *" type="tel" placeholder="+1 234 567 890" value={patientInfo.phone} onChange={e => setPatientInfo({...patientInfo, phone: e.target.value})} />
                    <Input label="Email Address *" type="email" placeholder="john@example.com" value={patientInfo.email} onChange={e => setPatientInfo({...patientInfo, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Address <span className="text-text-secondary/50 normal-case font-medium tracking-normal">(Optional)</span></h4>
                  <div className="grid grid-cols-1 gap-6 mb-6">
                    <Input label="Address Line" placeholder="123 Main St" value={patientInfo.address} onChange={e => setPatientInfo({...patientInfo, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="City" placeholder="New York" value={patientInfo.city} onChange={e => setPatientInfo({...patientInfo, city: e.target.value})} />
                    <Input label="State" placeholder="NY" value={patientInfo.state} onChange={e => setPatientInfo({...patientInfo, state: e.target.value})} />
                    <Input label="Postal Code" placeholder="10001" value={patientInfo.pincode} onChange={e => setPatientInfo({...patientInfo, pincode: e.target.value})} />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Emergency Contact <span className="text-text-secondary/50 normal-case font-medium tracking-normal">(Optional)</span></h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Emergency Contact Name" placeholder="Jane Doe" value={patientInfo.emergencyContactName} onChange={e => setPatientInfo({...patientInfo, emergencyContactName: e.target.value})} />
                    <Input label="Relationship" placeholder="Spouse" value={patientInfo.emergencyContactRelation} onChange={e => setPatientInfo({...patientInfo, emergencyContactRelation: e.target.value})} />
                    <Input label="Emergency Contact Phone" type="tel" placeholder="+1 987 654 321" value={patientInfo.emergencyContactPhone} onChange={e => setPatientInfo({...patientInfo, emergencyContactPhone: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Medical Information */}
          {currentStep === 2 && (
            <section className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-bold text-text-primary font-serif mb-2">2. Medical Information</h3>
              <p className="text-sm text-text-secondary mb-10">This information helps your doctor better understand your health history.</p>
              
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Known Allergies</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">Do you have any known allergies?</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" value={medicalInfo.hasAllergies} onChange={e => setMedicalInfo({...medicalInfo, hasAllergies: e.target.value})}>
                          <option value="No">No known allergies</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      {medicalInfo.hasAllergies === "Yes" && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <Input label="Please list your allergies" placeholder="Penicillin, peanuts, pollen..." value={medicalInfo.allergies} onChange={e => setMedicalInfo({...medicalInfo, allergies: e.target.value})} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Medical Conditions</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">Do you currently have any medical conditions?</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" value={medicalInfo.hasConditions} onChange={e => setMedicalInfo({...medicalInfo, hasConditions: e.target.value})}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      {medicalInfo.hasConditions === "Yes" && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <Input label="Please list your medical conditions" placeholder="Diabetes, hypertension, asthma..." value={medicalInfo.medicalConditions} onChange={e => setMedicalInfo({...medicalInfo, medicalConditions: e.target.value})} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Current Medications</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">Are you currently taking any medications?</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" value={medicalInfo.hasMedications} onChange={e => setMedicalInfo({...medicalInfo, hasMedications: e.target.value})}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      {medicalInfo.hasMedications === "Yes" && (
                        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                          <label className="text-sm font-semibold text-text-secondary">Medications details</label>
                          <textarea className="w-full rounded-xl border border-border px-4 py-3 outline-none min-h-[120px] focus:border-primary" placeholder={`Medication Name:\nDosage:\nFrequency:`} value={medicalInfo.medications} onChange={e => setMedicalInfo({...medicalInfo, medications: e.target.value})}></textarea>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Previous Surgeries</h4>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">Have you had any previous surgeries?</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" value={medicalInfo.hasSurgeries} onChange={e => setMedicalInfo({...medicalInfo, hasSurgeries: e.target.value})}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      {medicalInfo.hasSurgeries === "Yes" && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                          <Input label="Please provide details" placeholder="Appendectomy (2015)..." value={medicalInfo.surgeries} onChange={e => setMedicalInfo({...medicalInfo, surgeries: e.target.value})} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Visit Information */}
          {currentStep === 3 && (
            <section className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-bold text-text-primary font-serif mb-10">3. Visit Information</h3>
              
              <div className="space-y-10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Reason for Visit</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Reason for Visit *</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary transition-colors" value={visitInfo.reason} onChange={e => setVisitInfo({...visitInfo, reason: e.target.value})}>
                        <option value="">Select...</option>
                        <option value="General Consultation">General Consultation</option>
                        <option value="New Symptoms">New Symptoms</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Routine Check-up">Routine Check-up</option>
                        <option value="Prescription Follow-up">Prescription Follow-up</option>
                        <option value="Second Opinion">Second Opinion</option>
                        <option value="Test/Report Review">Test/Report Review</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {visitInfo.reason === "Other" && (
                      <Input label="Please specify *" placeholder="Describe reason..." value={visitInfo.reasonOther} onChange={e => setVisitInfo({...visitInfo, reasonOther: e.target.value})} />
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Symptoms</h4>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Symptoms / Main Concern *</label>
                      <textarea className="w-full rounded-xl border border-border px-4 py-4 outline-none min-h-[140px] focus:border-primary" placeholder="Describe what you're experiencing, including when it started and anything that makes it better or worse." value={visitInfo.symptoms} onChange={e => setVisitInfo({...visitInfo, symptoms: e.target.value})}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">When did the symptoms start?</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-primary" value={visitInfo.symptomsStarted} onChange={e => setVisitInfo({...visitInfo, symptomsStarted: e.target.value})}>
                          <option value="">Select...</option>
                          <option value="Today">Today</option>
                          <option value="1–3 days ago">1–3 days ago</option>
                          <option value="4–7 days ago">4–7 days ago</option>
                          <option value="1–4 weeks ago">1–4 weeks ago</option>
                          <option value="More than a month ago">More than a month ago</option>
                          <option value="Not applicable">Not applicable</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">How would you describe the severity?</label>
                        <div className="flex flex-wrap gap-4 mt-2">
                          {["Mild", "Moderate", "Severe"].map(sev => (
                            <label key={sev} className="flex items-center gap-2 cursor-pointer bg-background border border-border px-4 py-2 rounded-xl hover:border-primary transition-colors">
                              <input type="radio" name="severity" value={sev} className="text-primary focus:ring-primary" checked={visitInfo.severity === sev} onChange={e => setVisitInfo({...visitInfo, severity: e.target.value})} />
                              <span className="text-sm font-medium">{sev}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Previous Consultation</h4>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Have you consulted a doctor about this problem before?</label>
                      <div className="flex gap-4 mt-1">
                        {["No", "Yes"].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer bg-background border border-border px-6 py-2.5 rounded-xl hover:border-primary transition-colors">
                            <input type="radio" name="consulted" value={opt} className="text-primary focus:ring-primary" checked={visitInfo.consultedBefore === opt} onChange={e => setVisitInfo({...visitInfo, consultedBefore: e.target.value})} />
                            <span className="text-sm font-medium">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {visitInfo.consultedBefore === "Yes" && (
                      <div className="flex flex-col gap-2 animate-in fade-in">
                        <label className="text-sm font-semibold text-text-secondary">Previous diagnosis or treatment</label>
                        <textarea className="w-full rounded-xl border border-border px-4 py-3 outline-none min-h-[100px] focus:border-primary" placeholder="What was discussed or prescribed?" value={visitInfo.previousDiagnosis} onChange={e => setVisitInfo({...visitInfo, previousDiagnosis: e.target.value})}></textarea>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Additional report information <span className="text-text-secondary/50 font-normal">(Optional)</span></label>
                      <Input label="" placeholder="E.g., I have blood test results from last week" value={visitInfo.additionalReportInfo} onChange={e => setVisitInfo({...visitInfo, additionalReportInfo: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: Appointment Details */}
          {currentStep === 4 && (
            <section className="rounded-3xl border border-border bg-white p-6 sm:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-bold text-text-primary font-serif mb-10">4. Appointment Details</h3>
              
              <div className="space-y-10">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Consultation Type</h4>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-secondary">Appointment Type *</label>
                    <div className="flex flex-wrap gap-4 mt-2">
                      {["In-Person Consultation", "Video Consultation"].map(opt => (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer bg-background border border-border px-6 py-4 rounded-2xl hover:border-primary transition-colors">
                          <input type="radio" name="appttype" value={opt} className="size-4 text-primary focus:ring-primary" checked={appointmentInfo.type === opt} onChange={e => setAppointmentInfo({...appointmentInfo, type: e.target.value})} />
                          <span className="text-sm font-bold text-text-primary">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Schedule</h4>
                  
                  {availableSlots.length === 0 ? (
                    <div className="rounded-2xl bg-error/10 p-8 text-center ring-1 ring-inset ring-error/20 max-w-lg">
                      <p className="text-base font-bold text-error">No appointment slots are available for this date.</p>
                      <p className="text-sm text-text-secondary mt-2">Please check back later or select another doctor.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 w-full md:w-1/2 lg:w-1/3 mb-8">
                        <label className="text-sm font-semibold text-text-secondary">Appointment Date *</label>
                        <select
                          value={appointmentInfo.date}
                          onChange={(e) => {
                             setAppointmentInfo({...appointmentInfo, date: e.target.value, timeSlotId: ""});
                          }}
                          className="w-full rounded-xl border border-border bg-white px-4 py-3.5 font-medium outline-none focus:border-primary shadow-sm"
                        >
                          <option value="" disabled>Select a date...</option>
                          {availableDates.map(d => (
                            <option key={d} value={d}>
                              {new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {appointmentInfo.date && (
                        <div className="space-y-6 animate-in fade-in">
                          {slotGroups.Morning.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2"><span className="text-lg">🌅</span> Morning</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                {slotGroups.Morning.map((slot) => {
                                  const isSelected = appointmentInfo.timeSlotId === slot.id;
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setAppointmentInfo({...appointmentInfo, timeSlotId: slot.id})}
                                      className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                                        isSelected
                                          ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/20 ring-offset-1"
                                          : "border-border bg-white text-text-primary hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {slot.startTime}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          
                          {slotGroups.Afternoon.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2"><span className="text-lg">☀️</span> Afternoon</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                {slotGroups.Afternoon.map((slot) => {
                                  const isSelected = appointmentInfo.timeSlotId === slot.id;
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setAppointmentInfo({...appointmentInfo, timeSlotId: slot.id})}
                                      className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                                        isSelected
                                          ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/20 ring-offset-1"
                                          : "border-border bg-white text-text-primary hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {slot.startTime}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {slotGroups.Evening.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2"><span className="text-lg">🌙</span> Evening</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                {slotGroups.Evening.map((slot) => {
                                  const isSelected = appointmentInfo.timeSlotId === slot.id;
                                  return (
                                    <button
                                      key={slot.id}
                                      type="button"
                                      onClick={() => setAppointmentInfo({...appointmentInfo, timeSlotId: slot.id})}
                                      className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                                        isSelected
                                          ? "border-primary bg-primary text-white shadow-md ring-2 ring-primary/20 ring-offset-1"
                                          : "border-border bg-white text-text-primary hover:border-primary hover:text-primary"
                                      }`}
                                    >
                                      {slot.startTime}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Additional Information</h4>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Is there anything else you&apos;d like the doctor to know before your appointment? <span className="font-normal text-text-secondary/50">(Optional)</span></label>
                      <textarea className="w-full rounded-xl border border-border px-4 py-4 outline-none min-h-[120px] focus:border-primary" placeholder="Examples: Symptoms become worse at night. I prefer discussing this privately." value={appointmentInfo.additionalInfo} onChange={e => setAppointmentInfo({...appointmentInfo, additionalInfo: e.target.value})}></textarea>
                    </div>
                  </div>

                  <div>
                     <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-5">Communication Preferences</h4>
                     <div className="space-y-6">
                       <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Preferred contact method</label>
                          <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            {["Phone", "Email", "In-app notifications"].map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer bg-background border border-border px-4 py-2.5 rounded-xl hover:border-primary transition-colors">
                                <input type="radio" name="contactpref" value={opt} className="text-primary focus:ring-primary" checked={appointmentInfo.preferredCommunication === opt} onChange={e => setAppointmentInfo({...appointmentInfo, preferredCommunication: e.target.value})} />
                                <span className="text-sm font-medium">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-text-secondary">Reminder preference</label>
                          <div className="flex flex-col gap-4 mt-2 bg-background border border-border rounded-xl p-4">
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="size-5 rounded border-border text-primary focus:ring-primary" checked={appointmentInfo.reminderAppointment} onChange={e => setAppointmentInfo({...appointmentInfo, reminderAppointment: e.target.checked})} />
                                <span className="text-sm font-medium">Appointment reminder</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="size-5 rounded border-border text-primary focus:ring-primary" checked={appointmentInfo.reminderConfirmation} onChange={e => setAppointmentInfo({...appointmentInfo, reminderConfirmation: e.target.checked})} />
                                <span className="text-sm font-medium">Confirmation notification</span>
                              </label>
                              <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="size-5 rounded border-border text-primary focus:ring-primary" checked={appointmentInfo.reminderRescheduling} onChange={e => setAppointmentInfo({...appointmentInfo, reminderRescheduling: e.target.checked})} />
                                <span className="text-sm font-medium">Rescheduling notification</span>
                              </label>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: Review & Confirm */}
          {currentStep === 5 && (
            <section className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-primary/5 p-6 sm:p-10 border-b border-border">
                <h3 className="text-2xl font-bold text-text-primary font-serif">Review Your Appointment</h3>
                <p className="text-sm text-text-secondary mt-1">Please ensure all details are correct before confirming.</p>
              </div>
              
              <div className="p-6 sm:p-10 space-y-10">
                 {/* Summary items */}
                 <div className="flex flex-col sm:flex-row gap-6 border-b border-border pb-8">
                    <div className="w-full">
                       <div className="flex justify-between items-center mb-6">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Patient Information</h4>
                         <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-1.5 rounded-full">Edit</button>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Name</p>
                           <p className="text-sm font-bold text-text-primary">{patientInfo.fullName}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">DOB</p>
                           <p className="text-sm font-bold text-text-primary">{patientInfo.dob}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Gender</p>
                           <p className="text-sm font-bold text-text-primary">{patientInfo.gender}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Contact</p>
                           <p className="text-sm font-bold text-text-primary">{patientInfo.phone}</p>
                           <p className="text-sm font-medium text-text-secondary mt-0.5">{patientInfo.email}</p>
                         </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-6 border-b border-border pb-8">
                    <div className="w-full">
                       <div className="flex justify-between items-center mb-6">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Medical Information</h4>
                         <button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-1.5 rounded-full">Edit</button>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Allergies</p>
                           <p className="text-sm font-bold text-text-primary">{medicalInfo.hasAllergies === "Yes" ? medicalInfo.allergies : "No known allergies"}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Medical Conditions</p>
                           <p className="text-sm font-bold text-text-primary">{medicalInfo.hasConditions === "Yes" ? medicalInfo.medicalConditions : "None"}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Current Medications</p>
                           <p className="text-sm font-bold text-text-primary whitespace-pre-line">{medicalInfo.hasMedications === "Yes" ? medicalInfo.medications : "None"}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Previous Surgeries</p>
                           <p className="text-sm font-bold text-text-primary">{medicalInfo.hasSurgeries === "Yes" ? medicalInfo.surgeries : "None"}</p>
                         </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-6 border-b border-border pb-8">
                    <div className="w-full">
                       <div className="flex justify-between items-center mb-6">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Visit Information</h4>
                         <button type="button" onClick={() => setCurrentStep(3)} className="text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-1.5 rounded-full">Edit</button>
                       </div>
                       <div className="space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                           <div>
                             <p className="text-xs text-text-secondary mb-1">Reason for Visit</p>
                             <p className="text-sm font-bold text-text-primary">{visitInfo.reason === "Other" ? visitInfo.reasonOther : visitInfo.reason}</p>
                           </div>
                           <div>
                             <p className="text-xs text-text-secondary mb-1">Symptom Duration</p>
                             <p className="text-sm font-bold text-text-primary">{visitInfo.symptomsStarted || "N/A"}</p>
                           </div>
                           <div>
                             <p className="text-xs text-text-secondary mb-1">Severity</p>
                             <p className="text-sm font-bold text-text-primary">{visitInfo.severity || "N/A"}</p>
                           </div>
                         </div>
                         <div className="bg-background rounded-xl p-4 border border-border">
                           <p className="text-xs text-text-secondary mb-2 uppercase font-bold tracking-wider">Symptoms / Main Concern</p>
                           <p className="text-sm font-medium text-text-primary whitespace-pre-line">{visitInfo.symptoms}</p>
                         </div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col sm:flex-row gap-6 border-b border-border pb-8">
                    <div className="w-full">
                       <div className="flex justify-between items-center mb-6">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Appointment Details</h4>
                         <button type="button" onClick={() => setCurrentStep(4)} className="text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-1.5 rounded-full">Edit</button>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Date</p>
                           <p className="text-sm font-bold text-text-primary">{appointmentInfo.date}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Time</p>
                           <p className="text-sm font-bold text-text-primary">{selectedSlot?.startTime}</p>
                         </div>
                         <div>
                           <p className="text-xs text-text-secondary mb-1">Type</p>
                           <p className="text-sm font-bold text-text-primary">{appointmentInfo.type}</p>
                         </div>
                       </div>
                       {appointmentInfo.additionalInfo && (
                         <div className="mt-6">
                           <p className="text-xs text-text-secondary mb-1">Additional Information</p>
                           <p className="text-sm font-bold text-text-primary">{appointmentInfo.additionalInfo}</p>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Consent Section */}
                 <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-4">Consent</h4>
                    <div className="bg-stone-50 rounded-2xl p-6 border border-border space-y-4">
                        <label className="flex items-start gap-4 cursor-pointer">
                          <input type="checkbox" className="mt-1 size-5 rounded border-border text-primary focus:ring-primary shrink-0" checked={confirmCheckbox1} onChange={e => setConfirmCheckbox1(e.target.checked)} />
                          <span className="text-sm font-bold text-text-primary leading-tight">I confirm that the information I provided is accurate.</span>
                        </label>
                        <label className="flex items-start gap-4 cursor-pointer">
                          <input type="checkbox" className="mt-1 size-5 rounded border-border text-primary focus:ring-primary shrink-0" checked={confirmCheckbox2} onChange={e => setConfirmCheckbox2(e.target.checked)} />
                          <span className="text-sm font-bold text-text-primary leading-tight">I understand that the information provided will be shared with the selected doctor for the purpose of my appointment.</span>
                        </label>
                    </div>
                 </div>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 mt-4">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1 || isLoading} className="w-full sm:w-40 py-4 text-base">
              Back
            </Button>
            
            {currentStep < 5 ? (
              <Button type="button" onClick={handleNext} className="w-full sm:w-40 py-4 text-base">
                Continue
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-6 w-full sm:w-auto">
                <span className="text-sm font-medium text-text-secondary hidden sm:inline-block">Appointment Fee: <span className="font-bold text-xl text-text-primary">₹{doctor.consultationFee}</span></span>
                <Button type="submit" className="w-full sm:w-64 py-4 text-base" disabled={!confirmCheckbox1 || !confirmCheckbox2 || isLoading} isLoading={isLoading}>
                  {isLoading ? 'Confirming...' : 'Confirm Appointment'}
                </Button>
              </div>
            )}
          </div>
          
        </form>
      </main>
    </div>
  );
}
