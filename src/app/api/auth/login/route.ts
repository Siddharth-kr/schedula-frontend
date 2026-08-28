import { NextResponse } from "next/server";
import { mockUsers } from "@/lib/mock-data/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password !== "password123") {
      return NextResponse.json({ error: "Invalid credentials. Use 'password123'." }, { status: 401 });
    }

    // Default to a patient if they type a random email, or match specific ones
    const user = mockUsers[email] || {
      id: `user-${Date.now()}`,
      email,
      name: email.split("@")[0],
      role: email.includes("staff") ? "staff" : "patient",
    };

    return NextResponse.json({ data: user });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
