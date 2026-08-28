import type { Doctor } from "@/types/doctor";

export const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Anika Rao",
    specialty: "General Medicine",
    imageUrl: null,
    experienceYears: 12,
    rating: 4.8,
    reviewCount: 142,
    consultationFee: 80,
    availableNextDays: 0,
  },
  {
    id: "doc-2",
    name: "Dr. Rohan Sharma",
    specialty: "Dermatology",
    imageUrl: null,
    experienceYears: 8,
    rating: 4.9,
    reviewCount: 96,
    consultationFee: 120,
    availableNextDays: 2,
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel",
    specialty: "Cardiology",
    imageUrl: null,
    experienceYears: 15,
    rating: 4.7,
    reviewCount: 231,
    consultationFee: 150,
    availableNextDays: 1,
  },
  {
    id: "doc-4",
    name: "Dr. Vikram Singh",
    specialty: "Pediatrics",
    imageUrl: null,
    experienceYears: 10,
    rating: 4.6,
    reviewCount: 88,
    consultationFee: 90,
    availableNextDays: 0,
  }
];
