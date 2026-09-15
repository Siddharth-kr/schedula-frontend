import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user';
import type { DoctorProfile } from '@/types/availability';
import { getDoctorSession, clearDoctorSession, setDoctorSession } from '@/lib/availability-store';

interface AuthState {
  patient: User | null;
  doctor: DoctorProfile | null;
}

const initialState: AuthState = {
  patient: null,
  doctor: null,
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
      state.doctor = getDoctorSession();
    },
    loginPatient: (state, action: PayloadAction<User>) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('mock_user', JSON.stringify(action.payload));
      clearDoctorSession();
      state.patient = action.payload;
      state.doctor = null;
      window.dispatchEvent(new Event('schedula_auth_change'));
    },
    loginDoctor: (state, action: PayloadAction<DoctorProfile>) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem('mock_user');
      setDoctorSession(action.payload);
      state.patient = null;
      state.doctor = action.payload;
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
    }
  }
});

export const { loadSession, loginPatient, loginDoctor, logoutPatient, logoutDoctor } = authSlice.actions;
export default authSlice.reducer;
