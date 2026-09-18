import type { Doctor } from "@/types/doctor";
import { store } from "@/store";

export async function getDoctor(id: string): Promise<Doctor> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const doctor = store.getState().doctors.doctors.find((d) => d.id === id);
  if (!doctor) {
    throw new Error("Doctor not found");
  }
  
  return doctor;
}
