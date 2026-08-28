import type { User } from "@/types/user";

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Failed to login");
  }

  // In a real app, you might save a token here, but for this mock,
  // we'll just save the user object in localStorage for simplicity
  if (typeof window !== "undefined") {
    localStorage.setItem("mock_user", JSON.stringify(body.data));
  }

  return body.data;
}
