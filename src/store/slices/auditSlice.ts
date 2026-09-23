import { createSlice, PayloadAction, current } from '@reduxjs/toolkit';

const AUDIT_LOGS_KEY = "schedula_audit_logs";

export interface AuditLog {
  id: string;
  admin: string;
  action: string;
  entity: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM AM/PM
  details: string;
  createdAt: string; // ISO string
}

interface AuditState {
  logs: AuditLog[];
}

const initialMockLogs: AuditLog[] = [
  {
    id: "al-1",
    admin: "Schedula Admin",
    action: "Admin login",
    entity: "System",
    date: new Date().toISOString().split('T')[0],
    time: "09:00 AM",
    details: "Admin successfully logged into the portal.",
    createdAt: new Date().toISOString()
  },
  {
    id: "al-2",
    admin: "Schedula Admin",
    action: "Doctor verification approved",
    entity: "Dr. Anika Rao",
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: "02:35 PM",
    details: "Approved verification request for Dr. Anika Rao (Cardiology).",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const initialState: AuditState = {
  logs: [],
};

function persistToLocalStorage(logs: AuditLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event("schedula_audit_logs_updated"));
}

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    loadAuditLogs: (state) => {
      if (typeof window === "undefined") return;
      let dataStr = localStorage.getItem(AUDIT_LOGS_KEY);
      if (!dataStr) {
        dataStr = JSON.stringify(initialMockLogs);
        localStorage.setItem(AUDIT_LOGS_KEY, dataStr);
      }
      state.logs = JSON.parse(dataStr);
    },
    addAuditLog: (state, action: PayloadAction<Omit<AuditLog, "id" | "date" | "time" | "createdAt">>) => {
      const now = new Date();
      const newLog: AuditLog = {
        ...action.payload,
        id: `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        createdAt: now.toISOString()
      };
      // Prepend newest
      state.logs.unshift(newLog);
      persistToLocalStorage(current(state.logs));
    }
  }
});

export const { loadAuditLogs, addAuditLog } = auditSlice.actions;
export default auditSlice.reducer;
