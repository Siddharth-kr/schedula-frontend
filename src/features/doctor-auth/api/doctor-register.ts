import { registerDoctor } from "@/lib/availability-store";
import type { DoctorProfile } from "@/types/availability";

export type DoctorRegistrationPayload = Omit<DoctorProfile, "id" | "rating" | "reviewCount" | "imageUrl">;

export async function doctorRegister(payload: DoctorRegistrationPayload): Promise<DoctorProfile> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const newDoctor = registerDoctor(payload);
    return newDoctor;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to register doctor.");
  }
}
