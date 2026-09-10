import { getDoctorByEmail } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";

import { useAuthStore } from "@/store/authStore";

export async function doctorLogin(email: string, password: string): Promise<DoctorProfile> {
  // Simulate network delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  const doctor = getDoctorByEmail(email);

  if (!doctor || doctor.password !== password) {
    throw new Error("Invalid email or password.");
  }

  useAuthStore.getState().loginDoctor(doctor);

  return doctor;
}
