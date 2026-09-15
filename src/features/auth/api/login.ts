import { loginPatient } from "@/store/slices/authSlice";
import { store } from "@/store";
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

  store.dispatch(loginPatient(body.data));

  return body.data;
}
