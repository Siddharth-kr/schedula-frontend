import type { User } from "@/types/user";

// For this mock flow, any email with "staff" in it is staff, others are patients.
export const mockUsers: Record<string, User> = {
  "patient@example.com": {
    id: "user-101",
    email: "patient@example.com",
    name: "Alex Patient",
    role: "patient",
  },
  "maya.patel@example.com": {
    id: "user-102",
    email: "maya.patel@example.com",
    name: "Maya Patel",
    role: "patient",
  },
  "ethan.brooks@example.com": {
    id: "user-103",
    email: "ethan.brooks@example.com",
    name: "Ethan Brooks",
    role: "patient",
  },
  "inactive.user@example.com": {
    id: "user-104",
    email: "inactive.user@example.com",
    name: "Inactive User",
    role: "patient",
  },
  "staff@example.com": {
    id: "user-999",
    email: "staff@example.com",
    name: "Dr. Admin",
    role: "staff",
  },
};
