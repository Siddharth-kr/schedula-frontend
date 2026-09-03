export type AppointmentStatus = "pending" | "confirmed" | "upcoming" | "completed" | "cancelled" | "missed";

export type Prescription = {
  diagnosis: string;
  medicines: string;
  instructions: string;
};

export type Appointment = {
  id: string;
  patient: { name: string; initials: string; age: number };
  doctorId: string;
  clinician: string;
  specialty: string;
  startsAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  reason: string;
  room: string;
  prescription?: Prescription;
  review?: { rating: number; text?: string };
  // New intake fields
  patientInfo?: {
    dob?: string;
    gender?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    emergencyContactName?: string;
    emergencyContactRelation?: string;
    emergencyContactPhone?: string;
  };
  medicalInfo?: {
    symptoms?: string;
    symptomsStarted?: string;
    severity?: string;
    medicalConditions?: string;
    surgeries?: string;
    allergies?: string;
    medications?: string;
    consultedBefore?: string;
    previousDiagnosis?: string;
    additionalInfo?: string;
  };
  appointmentType?: string;
  preferredCommunication?: string;
};