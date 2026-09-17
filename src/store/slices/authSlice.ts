import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user';
import type { DoctorProfile } from '@/types/availability';
import { getDoctorSession, clearDoctorSession, setDoctorSession } from '@/lib/availability-store';

interface AuthState {
  patient: User | null;
  doctor: DoctorProfile | null;
  admin: User | null;
}

const initialState: AuthState = {
  patient: null,
  doctor: null,
  admin: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loadSession: (state) => {
      if (typeof window === 'undefined') return;
      
      const patientStr = localStorage.getItem('mock_user');
      if (patientStr) {
        try {
          state.patient = JSON.parse(patientStr);
        } catch (e) {
          console.error("Failed to parse patient session", e);
        }
      } else {
        state.patient = null;
      }
      
      const adminStr = localStorage.getItem('mock_admin');
      if (adminStr) {
        try {
          state.admin = JSON.parse(adminStr);
        } catch (e) {
          console.error("Failed to parse admin session", e);
        }
      } else {
        state.admin = null;
      }

      state.doctor = getDoctorSession();
    },
    loginPatient: (state, action: PayloadAction<User>) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('mock_user', JSON.stringify(action.payload));
      clearDoctorSession();
      localStorage.removeItem('mock_admin');
      state.patient = action.payload;
      state.doctor = null;
      state.admin = null;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    loginDoctor: (state, action: PayloadAction<DoctorProfile>) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mock_user');
      localStorage.removeItem('mock_admin');
      setDoctorSession(action.payload);
      state.patient = null;
      state.admin = null;
      state.doctor = action.payload;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    loginAdmin: (state, action: PayloadAction<User>) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mock_user');
      clearDoctorSession();
      localStorage.setItem('mock_admin', JSON.stringify(action.payload));
      state.patient = null;
      state.doctor = null;
      state.admin = action.payload;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    logoutPatient: (state) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mock_user');
      state.patient = null;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    logoutDoctor: (state) => {
      if (typeof window === 'undefined') return;
      clearDoctorSession();
      state.doctor = null;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    logoutAdmin: (state) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mock_admin');
      state.admin = null;
      window.dispatchEvent(new Event('schedula_auth_change'));
    }
  }
});

export const { loadSession, loginPatient, loginDoctor, loginAdmin, logoutPatient, logoutDoctor, logoutAdmin } = authSlice.actions;
export default authSlice.reducer;
