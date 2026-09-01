import { useState, useEffect } from "react";
import type { Doctor } from "@/types/doctor";
import { getDoctors } from "../api/get-doctors";

export function useDoctors() {
  const [data, setData] = useState<Doctor[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    getDoctors()
      .then((doctors) => {
        setData(doctors);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  return { data, status };
}
