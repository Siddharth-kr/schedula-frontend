import { create } from 'zustand';
import type { User } from '@/types/user';
import type { DoctorProfile } from '@/types/availability';
import { getDoctorSession, clearDoctorSession, setDoctorSession } from '@/lib/availability-store';

interface AuthState {
  patient: User | null;
  doctor: DoctorProfile | null;
  loadSession: () => void;
  loginPatient: (user: User) => void;
  loginDoctor: (doctor: DoctorProfile) => void;
  logoutPatient: () => void;
  logoutDoctor: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  patient: null,
  doctor: null,
  loadSession: () => {
    if (typeof window === 'undefined') return;
    
    const patientStr = localStorage.getItem('mock_user');
    let patient = null;
    if (patientStr) {
      try {
        patient = JSON.parse(patientStr);
      } catch (e) {
        console.error("Failed to parse patient session", e);
      }
    }
    
    const doctor = getDoctorSession();
    
    set({ patient, doctor });
  },
  loginPatient: (user: User) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mock_user', JSON.stringify(user));
    clearDoctorSession(); // Clear stale doctor session
    set({ patient: user, doctor: null });
    window.dispatchEvent(new Event('schedula_auth_change'));
  },
  loginDoctor: (doctor: DoctorProfile) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mock_user'); // Clear stale patient session
    setDoctorSession(doctor);
    set({ patient: null, doctor: doctor });
    window.dispatchEvent(new Event('schedula_auth_change'));
  },
  logoutPatient: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mock_user');
    set({ patient: null });
    window.dispatchEvent(new Event('schedula_auth_change'));
  },
  logoutDoctor: () => {
    if (typeof window === 'undefined') return;
    clearDoctorSession();
    set({ doctor: null });
    window.dispatchEvent(new Event('schedula_auth_change'));
  }
}));

// Bind to existing legacy events to ensure backward compatibility and sync with localStorage
if (typeof window !== 'undefined') {
  window.addEventListener('schedula_auth_change', () => {
    useAuthStore.getState().loadSession();
  });
  
  // Initialize state on first load
  useAuthStore.getState().loadSession();
}
