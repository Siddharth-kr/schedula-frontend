import { NextResponse } from "next/server";
import { mockDoctors } from "@/lib/mock-data/doctors";

export async function GET() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  return NextResponse.json({ 
    data: mockDoctors, 
    meta: { total: mockDoctors.length } 
  });
}
