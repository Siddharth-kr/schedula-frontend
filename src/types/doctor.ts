export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string | null;
  experienceYears: number;
  qualification?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableNextDays: number; // e.g. 0 means today, 1 means tomorrow
  active?: boolean;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
  rejectionReason?: string;
  documents?: { type: string; url: string }[];
  clinic?: string;
  email?: string;
  phone?: string;
};
