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
};