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

  // Steps
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [patientInfo, setPatientInfo] = useState({
    fullName: "", dob: "", gender: "", phone: "", email: "",
    address: "", city: "", state: "", pincode: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: ""
  });

  const [medicalInfo, setMedicalInfo] = useState({
    reason: "", symptoms: "", symptomsStarted: "", severity: "Mild",
    medicalConditions: "", surgeries: "", allergies: "", medications: "",
    consultedBefore: "No", previousDiagnosis: "", additionalInfo: ""
  });

  const [appointmentInfo, setAppointmentInfo] = useState({
    date: "", timeSlotId: "", type: "Video Consultation", reason: "General Consultation", reasonOther: "",
    preferredCommunication: "Email", extraNotes: ""
  });

  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  useEffect(() => {
    // Load pre-filled data if available
    const userStr = localStorage.getItem("mock_user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPatientInfo(prev => ({ ...prev, fullName: u.name, email: u.email }));
      } catch {}
    }

    // Load doctor's availability
    const slots = getAvailableSlotsForDoctor(doctor.id);
    const validSlots = slots.filter(s => {
      // Only include slots that are not in the past
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

  // Validation functions
  const validateStep1 = () => {
    if (!patientInfo.fullName) return "Full Name is required.";
    if (!patientInfo.dob) return "Date of Birth is required.";
    if (new Date(patientInfo.dob) > new Date()) return "Date of Birth cannot be in the future.";
    if (!patientInfo.phone || patientInfo.phone.length < 5) return "Valid phone number is required.";
    if (!patientInfo.email || !patientInfo.email.includes("@")) return "Valid email is required.";
    return null;
  };

  const validateStep2 = () => {
    if (!medicalInfo.reason) return "Reason for visit is required.";
    if (!medicalInfo.symptoms) return "Symptoms / Description is required.";
    return null;
  };

  const validateStep3 = () => {
    if (!appointmentInfo.date) return "Please select an appointment date.";
    if (!appointmentInfo.timeSlotId) return "Please select an appointment time.";
    if (!appointmentInfo.type) return "Please select an appointment type.";
    return null;
  };

  const handleNext = () => {
    setError(null);
    let err = null;
    if (currentStep === 1) err = validateStep1();
    if (currentStep === 2) err = validateStep2();
    if (currentStep === 3) err = validateStep3();

    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (currentStep < 4) {
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
    if (currentStep !== 4) return;
    setError(null);

    if (!confirmCheckbox) {
      setError("Please confirm that the information is accurate.");
      return;
    }

    if (!selectedSlot) {
      setError("This time slot is no longer available. Please select another available time.");
      return;
    }

    // Refresh availability store to ensure it hasn't been booked just now
    const currentSlots = getAvailableSlotsForDoctor(doctor.id);
    const stillAvailable = currentSlots.find(s => s.id === selectedSlot.id && !s.isBooked && !s.isUnavailable);
    
    if (!stillAvailable) {
      setError("This time slot is no longer available. Please select another available time.");
      setAvailableSlots(currentSlots.filter(s => new Date(`${s.date}T${s.startTime}`) > new Date() && !s.isBooked && !s.isUnavailable));
      setAppointmentInfo(prev => ({...prev, timeSlotId: ""}));
      setCurrentStep(3); // go back to select time
      return;
    }

    setIsLoading(true);
    try {
      // Mark slot as booked
      markSlotBooked(selectedSlot.id);

      // Create appointment
      const payload = {
        patient: { name: patientInfo.fullName, age: new Date().getFullYear() - new Date(patientInfo.dob).getFullYear() },
        doctorId: doctor.id,
        clinician: doctor.name,
        specialty: doctor.specialty,
        startsAt: `${selectedSlot.date}T${selectedSlot.startTime}`,
        reason: appointmentInfo.reason === "Other" ? appointmentInfo.reasonOther : appointmentInfo.reason,
        durationMinutes: 30, // Default duration
        patientInfo,
        medicalInfo,
        appointmentType: appointmentInfo.type,
        preferredCommunication: appointmentInfo.preferredCommunication,
        extraNotes: appointmentInfo.extraNotes
      };

      const apt = await createAppointment(payload);
      
      toast.success("Appointment Confirmed!");
      router.push(`/confirmation/${apt.id}`);

    } catch (err: unknown) {
      // Rollback slot
      freeSlot(selectedSlot.id);
      toast.error("Unable to book the appointment.");
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-[var(--color-text-secondary)] border-t-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl mx-auto">
      {/* Left Column: Summary */}
      <div className="w-full lg:w-1/3">
        <div className="sticky top-24 rounded-3xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold font-serif text-text-primary mb-6">Booking Details</h3>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="size-14 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xl uppercase ring-1 ring-primary/20 shrink-0">
              {doctor.name.split(" ").map(n => n[0]).join("").substring(0,2)}
            </div>
            <div>
              <h4 className="font-bold text-text-primary">Dr. {doctor.name}</h4>
              <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
            </div>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Consultation Fee</span>
              <span className="font-bold text-text-primary">${doctor.consultationFee}</span>
            </div>
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
          </div>
          
          {currentStep > 1 && (
             <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-bold text-text-secondary uppercase">Progress</span>
                   <span className="text-sm font-bold text-primary">Step {currentStep} of 4</span>
                </div>
                <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                   <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(currentStep / 4) * 100}%` }}></div>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-2/3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="rounded-xl bg-error/10 p-4 text-sm font-medium text-error ring-1 ring-inset ring-[var(--error)]/20" role="alert">
              {error}
            </div>
          )}

          {/* STEP 1: Patient Information */}
          {currentStep === 1 && (
            <section className="rounded-3xl border border-border bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="mb-6 text-xl font-bold text-text-primary font-serif">1. Patient Information</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Personal Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Full Name *" placeholder="John Doe" value={patientInfo.fullName} onChange={e => setPatientInfo({...patientInfo, fullName: e.target.value})} />
                    <Input label="Date of Birth *" type="date" value={patientInfo.dob} onChange={e => setPatientInfo({...patientInfo, dob: e.target.value})} />
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Gender</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={patientInfo.gender} onChange={e => setPatientInfo({...patientInfo, gender: e.target.value})}>
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
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Phone Number *" type="tel" placeholder="+1 234 567 890" value={patientInfo.phone} onChange={e => setPatientInfo({...patientInfo, phone: e.target.value})} />
                    <Input label="Email Address *" type="email" placeholder="john@example.com" value={patientInfo.email} onChange={e => setPatientInfo({...patientInfo, email: e.target.value})} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Address (Optional)</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="Address" placeholder="123 Main St" value={patientInfo.address} onChange={e => setPatientInfo({...patientInfo, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <Input label="City" placeholder="New York" value={patientInfo.city} onChange={e => setPatientInfo({...patientInfo, city: e.target.value})} />
                    <Input label="State" placeholder="NY" value={patientInfo.state} onChange={e => setPatientInfo({...patientInfo, state: e.target.value})} />
                    <Input label="Postal Code" placeholder="10001" value={patientInfo.pincode} onChange={e => setPatientInfo({...patientInfo, pincode: e.target.value})} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Emergency Contact (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Name" placeholder="Jane Doe" value={patientInfo.emergencyContactName} onChange={e => setPatientInfo({...patientInfo, emergencyContactName: e.target.value})} />
                    <Input label="Relationship" placeholder="Spouse" value={patientInfo.emergencyContactRelation} onChange={e => setPatientInfo({...patientInfo, emergencyContactRelation: e.target.value})} />
                    <Input label="Phone" type="tel" placeholder="+1 987 654 321" value={patientInfo.emergencyContactPhone} onChange={e => setPatientInfo({...patientInfo, emergencyContactPhone: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Medical Information */}
          {currentStep === 2 && (
            <section className="rounded-3xl border border-border bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="mb-6 text-xl font-bold text-text-primary font-serif">2. Medical Information</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Current Health Information</h4>
                  <div className="space-y-4">
                    <Input label="Reason for Visit *" placeholder="E.g., Annual Checkup, Back Pain" value={medicalInfo.reason} onChange={e => setMedicalInfo({...medicalInfo, reason: e.target.value})} />
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Symptoms / Description *</label>
                      <textarea className="w-full rounded-xl border border-border px-4 py-3 outline-none min-h-[100px]" placeholder="Please describe your symptoms..." value={medicalInfo.symptoms} onChange={e => setMedicalInfo({...medicalInfo, symptoms: e.target.value})}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="When did the symptoms start?" placeholder="E.g., 2 days ago" value={medicalInfo.symptomsStarted} onChange={e => setMedicalInfo({...medicalInfo, symptomsStarted: e.target.value})} />
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-text-secondary">Severity</label>
                        <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={medicalInfo.severity} onChange={e => setMedicalInfo({...medicalInfo, severity: e.target.value})}>
                          <option value="Mild">Mild</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Severe">Severe</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Medical History (Optional)</h4>
                  <div className="space-y-4">
                    <Input label="Existing Medical Conditions" placeholder="E.g., Diabetes, Hypertension" value={medicalInfo.medicalConditions} onChange={e => setMedicalInfo({...medicalInfo, medicalConditions: e.target.value})} />
                    <Input label="Allergies" placeholder="E.g., Penicillin, Peanuts" value={medicalInfo.allergies} onChange={e => setMedicalInfo({...medicalInfo, allergies: e.target.value})} />
                    <Input label="Current Medications" placeholder="E.g., Aspirin 81mg" value={medicalInfo.medications} onChange={e => setMedicalInfo({...medicalInfo, medications: e.target.value})} />
                    <Input label="Previous Surgeries" placeholder="E.g., Appendectomy (2015)" value={medicalInfo.surgeries} onChange={e => setMedicalInfo({...medicalInfo, surgeries: e.target.value})} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Previous Consultations</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Have you consulted a doctor for this issue before?</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={medicalInfo.consultedBefore} onChange={e => setMedicalInfo({...medicalInfo, consultedBefore: e.target.value})}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>

                    {medicalInfo.consultedBefore === "Yes" && (
                      <Input label="Previous diagnosis / treatment" placeholder="What did the doctor say?" value={medicalInfo.previousDiagnosis} onChange={e => setMedicalInfo({...medicalInfo, previousDiagnosis: e.target.value})} />
                    )}

                    <div className="flex flex-col gap-2 mt-4">
                      <label className="text-sm font-semibold text-text-secondary">Additional information for the doctor</label>
                      <textarea className="w-full rounded-xl border border-border px-4 py-3 outline-none min-h-[80px]" placeholder="Anything else?" value={medicalInfo.additionalInfo} onChange={e => setMedicalInfo({...medicalInfo, additionalInfo: e.target.value})}></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Appointment Details */}
          {currentStep === 3 && (
            <section className="rounded-3xl border border-border bg-white p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <h3 className="mb-6 text-xl font-bold text-text-primary font-serif">3. Appointment Details</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Type & Reason</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Appointment Type *</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={appointmentInfo.type} onChange={e => setAppointmentInfo({...appointmentInfo, type: e.target.value})}>
                        <option value="Video Consultation">Video Consultation</option>
                        <option value="In-Person Consultation">In-Person Consultation</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-text-secondary">Reason for Appointment *</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={appointmentInfo.reason} onChange={e => setAppointmentInfo({...appointmentInfo, reason: e.target.value})}>
                        <option value="General Consultation">General Consultation</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="New Symptoms">New Symptoms</option>
                        <option value="Routine Check-up">Routine Check-up</option>
                        <option value="Prescription Follow-up">Prescription Follow-up</option>
                        <option value="Second Opinion">Second Opinion</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  {appointmentInfo.reason === "Other" && (
                    <div className="mt-4">
                      <Input label="Please describe the reason *" placeholder="Describe..." value={appointmentInfo.reasonOther} onChange={e => setAppointmentInfo({...appointmentInfo, reasonOther: e.target.value})} />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Schedule</h4>
                  
                  {availableSlots.length === 0 ? (
                    <div className="rounded-2xl bg-error/10 p-6 text-center ring-1 ring-inset ring-[var(--error)]/20">
                      <p className="text-sm font-bold text-error">No available appointments</p>
                      <p className="text-sm text-text-secondary mt-1">This doctor currently has no open availability.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 w-full mb-4">
                        <label className="text-sm font-semibold text-text-secondary">Date *</label>
                        <select
                          value={appointmentInfo.date}
                          onChange={(e) => {
                             setAppointmentInfo({...appointmentInfo, date: e.target.value, timeSlotId: ""});
                          }}
                          className="w-full rounded-xl border border-border bg-white px-4 py-3 font-medium outline-none"
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
                        <div className="flex flex-col gap-2 w-full mt-4 animate-in fade-in">
                          <label className="text-sm font-semibold text-text-secondary">Time *</label>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {slotsForDate.map((slot) => {
                              const isSelected = appointmentInfo.timeSlotId === slot.id;
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setAppointmentInfo({...appointmentInfo, timeSlotId: slot.id})}
                                  className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary text-white shadow-md"
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
                    </>
                  )}
                </div>
                
                <div>
                   <h4 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Preferences</h4>
                   <div className="flex flex-col gap-2 mb-4">
                      <label className="text-sm font-semibold text-text-secondary">Preferred Communication Method</label>
                      <select className="w-full rounded-xl border border-border bg-white px-4 py-3 outline-none" value={appointmentInfo.preferredCommunication} onChange={e => setAppointmentInfo({...appointmentInfo, preferredCommunication: e.target.value})}>
                        <option value="Phone">Phone</option>
                        <option value="Email">Email</option>
                        <option value="In-app notification">In-app notification</option>
                      </select>
                    </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: Review & Confirm */}
          {currentStep === 4 && (
            <section className="rounded-3xl border border-border bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-primary/5 p-6 border-b border-border">
                <h3 className="text-xl font-bold text-text-primary font-serif">4. Review & Confirm</h3>
                <p className="text-sm text-text-secondary mt-1">Please review your details before confirming.</p>
              </div>
              
              <div className="p-6 space-y-6">
                 {/* Summary items */}
                 <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                       <h4 className="font-bold text-text-primary mb-2">Patient Details</h4>
                       <p className="text-sm text-text-secondary">{patientInfo.fullName}, {patientInfo.gender}</p>
                       <p className="text-sm text-text-secondary">{patientInfo.phone} | {patientInfo.email}</p>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                 </div>
                 
                 <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                       <h4 className="font-bold text-text-primary mb-2">Medical Info</h4>
                       <p className="text-sm text-text-secondary"><span className="font-semibold">Reason:</span> {medicalInfo.reason}</p>
                       <p className="text-sm text-text-secondary"><span className="font-semibold">Symptoms:</span> {medicalInfo.symptoms}</p>
                       {medicalInfo.allergies && <p className="text-sm text-text-secondary"><span className="font-semibold">Allergies:</span> {medicalInfo.allergies}</p>}
                    </div>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                 </div>
                 
                 <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                       <h4 className="font-bold text-text-primary mb-2">Appointment</h4>
                       <p className="text-sm text-text-secondary"><span className="font-semibold">Date:</span> {appointmentInfo.date}</p>
                       <p className="text-sm text-text-secondary"><span className="font-semibold">Time:</span> {selectedSlot?.startTime}</p>
                       <p className="text-sm text-text-secondary"><span className="font-semibold">Type:</span> {appointmentInfo.type}</p>
                    </div>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-xs font-bold text-primary hover:underline">Edit</button>
                 </div>
                 
                 <div className="bg-background rounded-xl p-4 mt-6">
                    <p className="text-sm text-text-secondary mb-3">By confirming this appointment, you agree that the information provided will be shared with the selected doctor for the purpose of this consultation.</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input type="checkbox" className="size-5 rounded border-border text-primary focus:ring-primary" checked={confirmCheckbox} onChange={e => setConfirmCheckbox(e.target.checked)} />
                       <span className="text-sm font-bold text-text-primary">I confirm that the information provided is accurate.</span>
                    </label>
                 </div>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 1 || isLoading} className="w-32">
              Back
            </Button>
            
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext} className="w-32">
                Continue
              </Button>
            ) : (
              <Button type="submit" className="w-48" disabled={!confirmCheckbox || isLoading} isLoading={isLoading}>
                Confirm Appointment
              </Button>
            )}
          </div>
          
        </form>
      </div>
    </div>
  );
}
