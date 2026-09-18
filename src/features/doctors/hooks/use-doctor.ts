import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { useAppSelector } from "@/store/hooks";

export function useDoctor(id: string) {
  const doctors = useAppSelector(state => state.doctors.doctors);
  const data = doctors.find(d => d.id === id) || null;
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "not-found">("loading");

  useEffect(() => {
    // Simulate network delay to preserve Schedula loading states
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    const timer = setTimeout(() => {
      if (data) {
        setStatus("ready");
      } else {
        setStatus("not-found");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [id, data]); // Use data directly

  return { data, status };
}
