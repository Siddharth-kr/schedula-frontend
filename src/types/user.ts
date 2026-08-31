export type UserRole = "patient" | "staff" | "doctor";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
