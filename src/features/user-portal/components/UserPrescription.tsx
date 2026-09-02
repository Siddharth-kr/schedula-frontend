"use client";

import type { Prescription } from "@/types/prescription";
import type { Appointment } from "@/types/appointment";
import { PrescriptionDetails } from "@/features/doctor-portal/components/PrescriptionDetails";

interface Props {
  prescription: Prescription;
  appointment: Appointment;
  onClose: () => void;
}

export function UserPrescription({ prescription, appointment, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-dark/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-full bg-background text-text-secondary hover:bg-slate-200 hover:text-text-primary"
        >
          &times;
        </button>
        <PrescriptionDetails prescription={prescription} appointment={appointment} isDoctor={false} />
      </div>
    </div>
  );
}
