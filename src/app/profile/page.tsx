import { Metadata } from "next";
import { UserProfileForm } from "@/features/user-portal/components/UserProfileForm";

export const metadata: Metadata = {
  title: "My Profile | Schedula",
};

export default function ProfilePage() {
  return (
    <main className="flex-1 bg-[var(--canvas)]">
      <UserProfileForm />
    </main>
  );
}
