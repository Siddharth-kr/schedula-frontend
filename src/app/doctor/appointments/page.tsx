import { DoctorAppointments } from "@/features/doctor-portal/components/DoctorAppointments";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Appointments | Schedula",
};

export default function DoctorAppointmentsPage() {
  return (
    <main className="flex-1 bg-[var(--canvas)]">
      <DoctorAppointments />
    </main>
  );
}
