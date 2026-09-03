export type UserProfile = {
  id: string; // Patient name or user ID
  // Personal Info
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  maritalStatus?: string;
  nationality?: string;
  preferredLanguage?: string;
  
  // Physical Details
  height: string;
  weight: string;
  bloodGroup: string;
  bodyType?: string;
  activityLevel?: string;
  
  // Lifestyle
  dietType?: string;
  exerciseFrequency?: string;
  sleepDuration?: string;
  smokingStatus?: string;
  alcoholConsumption?: string;
  occupation?: string;
  
  // Medical
  medicalConditions: string[];
  allergies: string[];
  currentMedications: { name: string; dosage: string; frequency: string }[] | string[];
  previousSurgeries?: { surgery: string; year: string; notes: string }[];
  medicalHistoryNotes?: string;
  
  // Insurance
  insuranceProvider: string;
  policyNumber: string;
  insuranceMemberId?: string;
  insurancePlanType?: string;
  insuranceCoverageStart?: string;
  insuranceCoverageEnd?: string;
  insuranceContact?: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  emergencyContactEmail?: string;
  emergencyContactAddress?: string;
};
