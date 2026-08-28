export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string | null;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableNextDays: number; // e.g. 0 means today, 1 means tomorrow
};
