import { NextResponse } from "next/server";
import { appointments } from "@/lib/mock-data/appointments";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const appointment = appointments.find((a) => a.id === id);
  
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  return NextResponse.json({ data: appointment });
}
