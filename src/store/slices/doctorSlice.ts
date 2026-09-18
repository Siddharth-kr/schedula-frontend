import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Doctor } from '@/types/doctor';
import { mockDoctors } from '@/lib/mock-data/doctors';

interface DoctorState {
  doctors: Doctor[];
}

const DOCTORS_KEY = 'schedula_doctors';

const baseInitialDoctors: Doctor[] = mockDoctors.map((d, index) => {
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
  
  return {
    ...d,
    active,
    verificationStatus: status,
    submittedAt,
    rejectionReason: status === 'rejected' ? 'Invalid medical license document uploaded.' : undefined,
    email: `${d.name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
    phone: '+1 (555) 123-4567',
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
      return JSON.parse(data);
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
