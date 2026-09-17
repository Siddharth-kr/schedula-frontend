export type UserRole = "patient" | "staff" | "doctor" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
