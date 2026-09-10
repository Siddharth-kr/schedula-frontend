import { NextResponse } from "next/server";
import { appointments } from "@/lib/mock-data/appointments";

export async function GET() { 
  return NextResponse.json({ data: appointments, meta: { total: appointments.length } }); 
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate basic requirements
    if (!body.clinician || !body.startsAt || !body.patient?.name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newAppointment = {
      id: `apt-${Math.floor(1000 + Math.random() * 9000)}`,
      patient: {
        name: body.patient.name,
        initials: body.patient.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2),
        age: 30, // Default mock age
      },
      clinician: body.clinician,
      doctorId: body.doctorId || "doc-unknown",
      specialty: body.specialty || "General Medicine",
      startsAt: body.startsAt,
      durationMinutes: 30,
      status: "pending" as const,
      reason: body.reason || "General Consultation",
      room: `Room ${Math.floor(1 + Math.random() * 20)}`,
    };

    appointments.push(newAppointment);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ data: newAppointment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }
}