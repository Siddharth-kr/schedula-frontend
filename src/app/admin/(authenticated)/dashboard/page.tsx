import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Schedula Admin",
  description: "Administrative dashboard for Schedula.",
};

export default function AdminDashboardPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Overview</h1>
        <p className="text-stone-500 text-sm mt-1">Here is what is happening across your platform today.</p>
      </div>
      
      <AdminDashboardClient />
    </div>
  );
}
