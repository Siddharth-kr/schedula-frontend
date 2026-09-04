import { DoctorProfileForm } from "@/features/doctor-portal/components/DoctorProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Profile | Schedula",
};

export default function DoctorProfilePage() {
  return (
    <main className="flex-1 bg-background">
      <DoctorProfileForm />
    </main>
  );
}
