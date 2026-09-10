import type { Doctor } from "@/types/doctor";

export async function getDoctors(): Promise<Doctor[]> {
  const response = await fetch("/api/doctors");
  
  if (!response.ok) {
    throw new Error("Unable to load doctors");
  }
  
  const body: { data: Doctor[] } = await response.json();
  return body.data;
}
