import type { User } from "@/types/user";

import { useAuthStore } from "@/store/authStore";

export async function signupWithEmail(name: string, email: string, password: string): Promise<User> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "Failed to sign up");
  }

  useAuthStore.getState().loginPatient(body.data);

  return body.data;
}
