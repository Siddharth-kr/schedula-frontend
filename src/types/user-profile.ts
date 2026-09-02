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
  
  // Physical Details
  height: string;
  weight: string;
  bloodGroup: string;
  
  // Medical
  medicalConditions: string[];
  allergies: string[];
  currentMedications: string[];
  
  // Insurance
  insuranceProvider: string;
  policyNumber: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
};
