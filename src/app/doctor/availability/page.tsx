import { AvailabilityManager } from "@/features/doctor-portal/components/AvailabilityManager";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doctor Availability | Schedula",
};

export default function DoctorAvailabilityPage() {
  return (
    <main className="flex-1 bg-[var(--canvas)]">
      <AvailabilityManager />
    </main>
  );
}
