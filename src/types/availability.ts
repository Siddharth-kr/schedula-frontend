/** Day 2 shared types for the Doctor Portal and availability system. */

/** Extended doctor profile used for doctor registration and authentication. */
export type DoctorProfile = {
  id: string;
  email: string;
  password: string; // plaintext for frontend-only mock
  name: string;
  gender?: string;
  dob?: string;
  specialty: string;
  qualification?: string;
  phone: string;
  address?: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
  rating: number;
  reviewCount: number;
  imageUrl: string | null;
};

/** A concrete bookable time slot for a specific doctor on a specific date. */
export type AvailabilitySlot = {
  id: string;
  doctorId: string;
  date: string; // ISO date string, e.g. "2026-09-01"
  startTime: string; // 24h format, e.g. "09:00"
  endTime: string; // 24h format, e.g. "09:30"
  isBooked: boolean;
  isUnavailable?: boolean; // explicit unavailability that splits/overrides rules
  appointmentId?: string; // set when booked
};

/** A recurring availability rule that generates concrete slots. */
export type RecurringRule = {
  id: string;
  doctorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string;
  endTime: string;
  label: string; // Human-readable, e.g. "Every Monday at 10:00 AM - 1:00 PM"
};
