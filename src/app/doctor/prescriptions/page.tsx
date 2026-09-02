import { Metadata } from "next";
import { DoctorPrescriptionDashboard } from "@/features/doctor-portal/components/DoctorPrescriptionDashboard";

export const metadata: Metadata = {
  title: "Prescriptions | Doctor Portal | Schedula",
};

export default function DoctorPrescriptionsPage() {
  return (
    <main className="flex-1 bg-[var(--canvas)]">
      <DoctorPrescriptionDashboard />
    </main>
  );
}
