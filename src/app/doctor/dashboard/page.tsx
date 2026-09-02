import { DoctorDashboard } from "@/features/doctor-portal/components/DoctorDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Dashboard | Schedula",
};

export default function DoctorDashboardPage() {
  return (
    <main className="flex-1 bg-background">
      <DoctorDashboard />
    </main>
  );
}
