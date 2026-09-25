import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { useAppSelector } from "@/store/hooks";

export function useDoctors() {
  const allDoctors = useAppSelector(state => state.doctors.doctors);
  const doctors = allDoctors.filter(d => d.active && d.verificationStatus === 'approved');
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    // Simulate network delay to preserve Schedula loading states
    const timer = setTimeout(() => {
      setStatus("ready");
    }, 800);
    return () => clearTimeout(timer);
  }, [allDoctors, doctors]);

  return { data: doctors, status };
}
