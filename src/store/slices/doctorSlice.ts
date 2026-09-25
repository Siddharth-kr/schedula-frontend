import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Doctor } from '@/types/doctor';
import { mockDoctors } from '@/lib/mock-data/doctors';
import { defaultDoctorAccounts } from '@/lib/mock-data/doctor-accounts';

interface DoctorState {
  doctors: Doctor[];
}

const DOCTORS_KEY = 'schedula_doctors';

export const baseInitialDoctors: Doctor[] = mockDoctors.map((d, index) => {
  let status: 'pending' | 'approved' | 'rejected' = 'approved';
  let active = true;
  let submittedAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  if (index === 0 || index === 1) {
    status = 'pending';
    submittedAt = new Date().toISOString();
  } else if (index === 2) {
    status = 'rejected';
    active = false;
  }
  
  const authAccount = defaultDoctorAccounts.find(acc => acc.id === d.id);
  
  return {
    ...d,
    active,
    verificationStatus: status,
    submittedAt,
    rejectionReason: status === 'rejected' ? 'Invalid medical license document uploaded.' : undefined,
    email: authAccount ? authAccount.email : `${d.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    password: authAccount ? authAccount.password : 'doctor123',
    phone: authAccount ? authAccount.phone : '+1 (555) 123-4567',
    clinic: 'Schedula Medical Center',
    documents: [
      { type: 'Medical License', url: '/mock-doc-1.pdf' },
      { type: 'Board Certification', url: '/mock-doc-2.pdf' }
    ]
  };
});

const loadFromStorage = (): Doctor[] => {
  if (typeof window === 'undefined') return baseInitialDoctors;
  try {
    const data = localStorage.getItem(DOCTORS_KEY);
    if (data) {
      let parsedDoctors = JSON.parse(data) as Doctor[];
      let migrated = false;
      
      // RECOVERY MIGRATION: If previous bug wiped out the base seeded doctors, restore them.
      if (parsedDoctors.length < baseInitialDoctors.length) {
        const missingBase = baseInitialDoctors.filter(
          bd => !parsedDoctors.find(pd => pd.id === bd.id)
        );
        if (missingBase.length > 0) {
          parsedDoctors = [...missingBase, ...parsedDoctors];
          migrated = true;
        }
      }
      
      parsedDoctors = parsedDoctors.map(doc => {
        const authAccount = defaultDoctorAccounts.find(acc => acc.id === doc.id);
        const updatedDoc = { ...doc };
        let modified = false;
        
        if (authAccount) {
          if (updatedDoc.email !== authAccount.email) {
            updatedDoc.email = authAccount.email;
            modified = true;
          }
          if (updatedDoc.password !== authAccount.password) {
            updatedDoc.password = authAccount.password;
            modified = true;
          }
        }
        
        // Ensure new registrations have a verification status so they show up in Admin
        if (updatedDoc.verificationStatus === undefined) {
          updatedDoc.verificationStatus = 'pending';
          updatedDoc.submittedAt = new Date().toISOString();
          updatedDoc.active = true;
          modified = true;
        }
        
        // Fix data-shape mismatch for newly registered doctors missing required Doctor type fields
        if (updatedDoc.availableNextDays === undefined) {
          updatedDoc.availableNextDays = 2; // Default to available in 2 days
          modified = true;
        }

        if (updatedDoc.clinic === undefined) {
          updatedDoc.clinic = 'Schedula Medical Center';
          modified = true;
        }
        
        if (modified) {
          migrated = true;
        }
        return updatedDoc;
      });

      if (migrated && typeof window !== 'undefined') {
        localStorage.setItem(DOCTORS_KEY, JSON.stringify(parsedDoctors));
      }
      
      return parsedDoctors;
    }
  } catch (error) {
    console.warn("Failed to load doctors from localStorage", error);
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(baseInitialDoctors));
  }
  return baseInitialDoctors;
};

const initialState: DoctorState = {
  doctors: baseInitialDoctors, // Always start with base state to avoid hydration mismatch
};

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    loadDoctors: (state) => {
      state.doctors = loadFromStorage();
    },
    updateDoctorStatus: (state, action: PayloadAction<{ id: string; active: boolean }>) => {
      const doc = state.doctors.find(d => d.id === action.payload.id);
      if (doc) {
        doc.active = action.payload.active;
        if (typeof window !== 'undefined') {
          localStorage.setItem(DOCTORS_KEY, JSON.stringify(state.doctors));
          window.dispatchEvent(new Event('schedula_doctors_change'));
        }
      }
    },
    approveDoctor: (state, action: PayloadAction<string>) => {
      const doc = state.doctors.find(d => d.id === action.payload);
      if (doc) {
        doc.verificationStatus = 'approved';
        if (typeof window !== 'undefined') {
          localStorage.setItem(DOCTORS_KEY, JSON.stringify(state.doctors));
          window.dispatchEvent(new Event('schedula_doctors_change'));
        }
      }
    },
    rejectDoctor: (state, action: PayloadAction<{ id: string; reason: string }>) => {
      const doc = state.doctors.find(d => d.id === action.payload.id);
      if (doc) {
        doc.verificationStatus = 'rejected';
        doc.rejectionReason = action.payload.reason;
        if (typeof window !== 'undefined') {
          localStorage.setItem(DOCTORS_KEY, JSON.stringify(state.doctors));
          window.dispatchEvent(new Event('schedula_doctors_change'));
        }
      }
    },
    resubmitVerification: (state, action: PayloadAction<string>) => {
      const doc = state.doctors.find(d => d.id === action.payload);
      if (doc) {
        doc.verificationStatus = 'pending';
        doc.submittedAt = new Date().toISOString();
        if (typeof window !== 'undefined') {
          localStorage.setItem(DOCTORS_KEY, JSON.stringify(state.doctors));
          window.dispatchEvent(new Event('schedula_doctors_change'));
        }
      }
    }
  },
});

export const { loadDoctors, updateDoctorStatus, approveDoctor, rejectDoctor, resubmitVerification } = doctorSlice.actions;
export default doctorSlice.reducer;
