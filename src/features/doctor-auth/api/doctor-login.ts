import { getDoctorByEmail, setDoctorSession } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";

export async function doctorLogin(email: string, password: string): Promise<DoctorProfile> {
  // Simulate network delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  const doctor = getDoctorByEmail(email);

  if (!doctor || doctor.password !== password) {
    throw new Error("Invalid email or password.");
  }

  // Set the mock session in localStorage
  setDoctorSession(doctor);
  if (typeof window !== "undefined") {
    localStorage.removeItem("mock_user"); // Clear stale patient session
  }

  return doctor;
}
