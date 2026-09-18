import type { Doctor } from "@/types/doctor";
import { store } from "@/store";

export async function getDoctors(): Promise<Doctor[]> {
  // Simulate network delay to keep the loading states testing working
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  // Return from global redux state to support mock admin updates
  const doctors = store.getState().doctors.doctors;
  return doctors;
}
