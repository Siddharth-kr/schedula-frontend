import type { DoctorProfile } from "@/types/availability";

/**
 * Pre-seeded doctor accounts for the 4 existing mock doctors.
 * These allow Day 1 doctors to be "logged into" without registration.
 * All use password "doctor123" for the mock flow.
 */
export const defaultDoctorAccounts: DoctorProfile[] = [
  {
    id: "doc-1",
    email: "anika@schedula.com",
    password: "doctor123",
    name: "Dr. Anika Rao",
    specialty: "General Medicine",
    phone: "+91 98765 43210",
    experienceYears: 12,
    consultationFee: 80,
    bio: "Experienced general practitioner with a focus on preventive care and wellness.",
    rating: 4.8,
    reviewCount: 142,
    imageUrl: null,
  },
  {
    id: "doc-2",
    email: "rohan@schedula.com",
    password: "doctor123",
    name: "Dr. Rohan Sharma",
    specialty: "Dermatology",
    phone: "+91 98765 43211",
    experienceYears: 8,
    consultationFee: 120,
    bio: "Board-certified dermatologist specializing in skin conditions and cosmetic procedures.",
    rating: 4.9,
    reviewCount: 96,
    imageUrl: null,
  },
  {
    id: "doc-3",
    email: "priya@schedula.com",
    password: "doctor123",
    name: "Dr. Priya Patel",
    specialty: "Cardiology",
    phone: "+91 98765 43212",
    experienceYears: 15,
    consultationFee: 150,
    bio: "Senior cardiologist with extensive experience in heart disease management and diagnostics.",
    rating: 4.7,
    reviewCount: 231,
    imageUrl: null,
  },
  {
    id: "doc-4",
    email: "vikram@schedula.com",
    password: "doctor123",
    name: "Dr. Vikram Singh",
    specialty: "Pediatrics",
    phone: "+91 98765 43213",
    experienceYears: 10,
    consultationFee: 90,
    bio: "Caring pediatrician dedicated to child health and developmental milestones.",
    rating: 4.6,
    reviewCount: 88,
    imageUrl: null,
  },
];
