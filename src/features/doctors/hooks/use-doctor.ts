import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { getDoctor } from "../api/get-doctor";

export function useDoctor(id: string) {
  const [data, setData] = useState<Doctor | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "not-found">("loading");

  useEffect(() => {
    let ignore = false;
    
    getDoctor(id)
      .then((doctor) => {
        if (!ignore) {
          setData(doctor);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus("not-found");
        }
      });
      
    return () => { ignore = true; };
  }, [id]);

  return { data, status };
}
