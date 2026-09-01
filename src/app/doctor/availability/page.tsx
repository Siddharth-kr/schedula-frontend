import { UnifiedScheduleCalendar } from "@/features/doctor-portal/components/UnifiedScheduleCalendar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Availability Schedule | Doctor Portal | Schedula",
};

export default function DoctorAvailabilityPage() {
  return (
    <main className="flex-1 bg-[var(--canvas)]">
      <UnifiedScheduleCalendar />
    </main>
  );
}
