import { NextResponse } from "next/server";
import { mockUsers } from "@/lib/mock-data/users";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // In a real app we'd check if email exists. Since mockUsers is static, we just create a mock user object.
    const user = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: email.includes("staff") ? "staff" : ("patient" as const),
    };

    return NextResponse.json({ data: user });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
