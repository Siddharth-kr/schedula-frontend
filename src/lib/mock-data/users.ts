import type { User } from "@/types/user";

// For this mock flow, any email with "staff" in it is staff, others are patients.
export const mockUsers: Record<string, User> = {
  "patient@example.com": {
    id: "user-101",
    email: "patient@example.com",
    name: "Alex Patient",
    role: "patient",
  },
  "staff@example.com": {
    id: "user-999",
    email: "staff@example.com",
    name: "Dr. Admin",
    role: "staff",
  },
};
