export type UserRole = "patient" | "staff";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
