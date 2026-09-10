import { NextResponse } from "next/server";
import { mockDoctors } from "@/lib/mock-data/doctors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Next 15+ convention for dynamic routes requires awaiting params
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const doctor = mockDoctors.find((d) => d.id === id);
  
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  return NextResponse.json({ data: doctor });
}
