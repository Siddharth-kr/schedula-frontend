/**
 * Shared availability store backed by localStorage.
 *
 * This is the single source of truth for doctor-created availability.
 * Both the Doctor Portal and Patient Portal read/write through these functions.
 */

import type { AvailabilitySlot, RecurringRule, DoctorProfile } from "@/types/availability";
import { defaultDoctorAccounts } from "@/lib/mock-data/doctor-accounts";

// ── localStorage keys ──────────────────────────────────────────────────────

const SLOTS_KEY = "schedula_slots";
const RULES_KEY = "schedula_rules";
const DOCTORS_KEY = "schedula_doctors";
const DOCTOR_USER_KEY = "schedula_doctor_user";

// ── Seed guard ─────────────────────────────────────────────────────────────

let _seeded = false;

function ensureSeeded(): void {
  if (_seeded) return;
  if (typeof window === "undefined") return;
  _seeded = true;

  const existing = localStorage.getItem(DOCTORS_KEY);
  if (existing) return;

  // Seed doctor accounts
  localStorage.setItem(DOCTORS_KEY, JSON.stringify(defaultDoctorAccounts));

  // Seed availability slots for the 4 existing doctors
  // Day 1 times
  const seededTimes = [
    { start: "09:00", end: "09:30" },
    { start: "09:30", end: "10:00" },
    { start: "10:00", end: "10:30" },
    { start: "11:00", end: "11:30" },
    { start: "13:30", end: "14:00" },
    { start: "14:00", end: "14:30" },
    { start: "15:30", end: "16:00" },
    { start: "16:00", end: "16:30" }
  ];
  const slots: AvailabilitySlot[] = [];
  const today = new Date();

  for (const doctor of defaultDoctorAccounts) {
    for (let d = 0; d < 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);

      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;

      const dateStr = date.toISOString().split("T")[0];

      for (const time of seededTimes) {
        slots.push({
          id: `seed-${doctor.id}-${dateStr}-${time.start}`,
          doctorId: doctor.id,
          date: dateStr,
          startTime: time.start,
          endTime: time.end,
          isBooked: false,
        });
      }
    }
  }

  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
  localStorage.setItem(RULES_KEY, JSON.stringify([]));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function readJSON<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeJSON<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Overlap detection
function hasOverlap(slots: AvailabilitySlot[], doctorId: string, date: string, start: string, end: string): boolean {
  return slots.some(s => 
    s.doctorId === doctorId && 
    s.date === date && 
    (start < s.endTime && end > s.startTime)
  );
}

// ── Slots CRUD ─────────────────────────────────────────────────────────────

export function getAllSlots(): AvailabilitySlot[] {
  ensureSeeded();
  return readJSON<AvailabilitySlot>(SLOTS_KEY);
}

export function getSlotsForDoctor(doctorId: string): AvailabilitySlot[] {
  return getAllSlots().filter((s) => s.doctorId === doctorId);
}

export function addSlot(doctorId: string, date: string, startTime: string, endTime: string): AvailabilitySlot {
  const slots = getAllSlots();

  if (hasOverlap(slots, doctorId, date, startTime, endTime)) {
    throw new Error("This slot overlaps with existing availability.");
  }

  const newSlot: AvailabilitySlot = {
    id: generateId("slot"),
    doctorId,
    date,
    startTime,
    endTime,
    isBooked: false,
  };

  slots.push(newSlot);
  writeJSON(SLOTS_KEY, slots);
  return newSlot;
}

export function deleteSlot(slotId: string): boolean {
  const slots = getAllSlots();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot || slot.isBooked) return false;

  writeJSON(SLOTS_KEY, slots.filter((s) => s.id !== slotId));
  return true;
}

export function markSlotBooked(slotId: string, appointmentId?: string): void {
  const slots = getAllSlots();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) return;

  slot.isBooked = true;
  if (appointmentId) slot.appointmentId = appointmentId;
  writeJSON(SLOTS_KEY, slots);
}

// ── Recurring Rules CRUD ───────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getAllRules(): RecurringRule[] {
  ensureSeeded();
  return readJSON<RecurringRule>(RULES_KEY);
}

export function getRulesForDoctor(doctorId: string): RecurringRule[] {
  return getAllRules().filter((r) => r.doctorId === doctorId);
}

/**
 * Materialize a recurring rule into concrete slots for the next 14 days.
 * Includes idempotent overlap checks: won't overwrite or duplicate existing booked/unbooked slots.
 */
function materializeRule(rule: RecurringRule): void {
  const slots = getAllSlots();
  const today = new Date();
  
  let slotsUpdated = false;

  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    if (date.getDay() === rule.dayOfWeek) {
      const dateStr = date.toISOString().split("T")[0];
      
      // Idempotency / Overlap check
      if (!hasOverlap(slots, rule.doctorId, dateStr, rule.startTime, rule.endTime)) {
        slots.push({
          id: generateId("slot-rec"),
          doctorId: rule.doctorId,
          date: dateStr,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isBooked: false,
        });
        slotsUpdated = true;
      }
    }
  }

  if (slotsUpdated) {
    writeJSON(SLOTS_KEY, slots);
  }
}

export function addRule(doctorId: string, dayOfWeek: number, startTime: string, endTime: string): RecurringRule {
  const rules = getAllRules();

  // Prevent completely identical rules
  const existing = rules.find(
    (r) => r.doctorId === doctorId && r.dayOfWeek === dayOfWeek && r.startTime === startTime && r.endTime === endTime
  );
  if (existing) return existing;

  const newRule: RecurringRule = {
    id: generateId("rule"),
    doctorId,
    dayOfWeek,
    startTime,
    endTime,
    label: `Every ${DAY_NAMES[dayOfWeek]} at ${startTime} - ${endTime}`,
  };

  rules.push(newRule);
  writeJSON(RULES_KEY, rules);

  // Generate concrete slots immediately
  materializeRule(newRule);

  return newRule;
}

export function deleteRule(ruleId: string): void {
  const rules = getAllRules().filter((r) => r.id !== ruleId);
  writeJSON(RULES_KEY, rules);
}

// ── Main query: available slots for booking ────────────────────────────────

export function getAvailableSlotsForDoctor(doctorId: string): AvailabilitySlot[] {
  // Materialize recurring rules to ensure generated slots exist
  const rules = getRulesForDoctor(doctorId);
  for (const rule of rules) {
    materializeRule(rule);
  }

  const todayStr = new Date().toISOString().split("T")[0];

  return getSlotsForDoctor(doctorId)
    .filter((s) => !s.isBooked && s.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
}

export function getAvailableSlotsByDate(
  doctorId: string
): Map<string, AvailabilitySlot[]> {
  const slots = getAvailableSlotsForDoctor(doctorId);
  const grouped = new Map<string, AvailabilitySlot[]>();

  for (const slot of slots) {
    const list = grouped.get(slot.date) || [];
    list.push(slot);
    grouped.set(slot.date, list);
  }

  return grouped;
}

// ── Doctor Accounts ────────────────────────────────────────────────────────

export function getRegisteredDoctors(): DoctorProfile[] {
  ensureSeeded();
  return readJSON<DoctorProfile>(DOCTORS_KEY);
}

export function registerDoctor(
  profile: Omit<DoctorProfile, "id" | "rating" | "reviewCount" | "imageUrl">
): DoctorProfile {
  const doctors = getRegisteredDoctors();

  if (doctors.find((d) => d.email === profile.email)) {
    throw new Error("A doctor with this email already exists.");
  }

  const newDoctor: DoctorProfile = {
    ...profile,
    id: generateId("doc"),
    rating: 0,
    reviewCount: 0,
    imageUrl: null,
  };

  doctors.push(newDoctor);
  writeJSON(DOCTORS_KEY, doctors);
  return newDoctor;
}

export function getDoctorByEmail(email: string): DoctorProfile | undefined {
  return getRegisteredDoctors().find((d) => d.email === email);
}

export function getDoctorById(id: string): DoctorProfile | undefined {
  return getRegisteredDoctors().find((d) => d.id === id);
}

export function updateDoctor(
  id: string,
  updates: Partial<Omit<DoctorProfile, "id">>
): DoctorProfile | null {
  const doctors = getRegisteredDoctors();
  const index = doctors.findIndex((d) => d.id === id);
  if (index === -1) return null;

  doctors[index] = { ...doctors[index], ...updates, id };
  writeJSON(DOCTORS_KEY, doctors);
  return doctors[index];
}

// ── Doctor Session ─────────────────────────────────────────────────────────

export function setDoctorSession(doctor: DoctorProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOCTOR_USER_KEY, JSON.stringify(doctor));
}

export function getDoctorSession(): DoctorProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DOCTOR_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearDoctorSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DOCTOR_USER_KEY);
}
