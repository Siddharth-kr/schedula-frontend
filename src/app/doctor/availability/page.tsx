import { AvailabilityManager } from "@/features/doctor-portal/components/AvailabilityManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Availability Schedule | Doctor Portal | Schedula",
};

export default function DoctorAvailabilityPage() {
  return (
    <main className="flex-1 bg-background">
      <AvailabilityManager />
    </main>
  );
}
