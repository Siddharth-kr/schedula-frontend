"use client";

import { useAppSelector } from "@/store/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const maintenanceMode = useAppSelector(state => state.adminState.settings.maintenanceMode);
  
  const { admin, doctor, patient } = useAppSelector(state => state.auth);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (maintenanceMode) {
      // 1. Admin bypass: if accessing an admin route, or if an admin is currently logged in, allow them to navigate anywhere if desired (or at least don't block them).
      // Actually, admin routes should always be allowed.
      if (pathname.startsWith("/admin")) return;
      
      // If we are already on the maintenance page, do nothing.
      if (pathname === "/maintenance") return;

      // 2. Patient / Doctor route protection:
      const isPatientRoute = pathname.startsWith("/appointments") || 
                             pathname.startsWith("/prescriptions") || 
                             pathname.startsWith("/profile") ||
                             pathname.startsWith("/doctors") ||
                             pathname.startsWith("/booking") ||
                             pathname.startsWith("/confirmation") ||
                             pathname.startsWith("/find-specialist");
                             
      const isDoctorRoute = pathname.startsWith("/doctor/dashboard") || 
                            pathname.startsWith("/doctor/appointments") || 
                            pathname.startsWith("/doctor/availability") || 
                            pathname.startsWith("/doctor/prescriptions") || 
                            pathname.startsWith("/doctor/profile") || 
                            pathname.startsWith("/doctor/rating-analyzer") || 
                            pathname.startsWith("/doctor/revenue");

      if (isPatientRoute || isDoctorRoute) {
        router.push("/maintenance");
      }
    }
  }, [isClient, maintenanceMode, pathname, router, admin, doctor, patient]);

  return <>{children}</>;
}
