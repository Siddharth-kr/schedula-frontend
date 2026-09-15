import type { Doctor } from "@/types/doctor";

export async function getDoctor(id: string): Promise<Doctor> {
  const response = await fetch(`/api/doctors/${id}`);
  
  if (!response.ok) {
    throw new Error("Unable to load doctor");
  }
  
  const body = await response.json();
  return body.data;
}
