import type { Prescription } from "@/types/prescription";
import type { Appointment } from "@/types/appointment";
import { format, parseISO } from "date-fns";

interface Props {
  prescription: Prescription;
  appointment: Appointment;
  onEdit?: () => void;
  isDoctor?: boolean;
}

export function PrescriptionDetails({ prescription, appointment, onEdit, isDoctor = false }: Props) {
  
  const handleDownload = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.getElementById(`prescription-${prescription.id}`);
      if (!element) return;
      
      const opt = {
        margin:       10,
        filename:     `schedula-prescription-${prescription.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save();
    } catch (e) {
      console.error(e);
      // fallback just in case
      window.print();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[var(--line)] shadow-sm overflow-hidden">
      <div className="border-b border-[var(--line)] bg-slate-50/50 px-6 py-4 flex items-center justify-between">
        <h2 className="font-bold text-[var(--ink)] font-serif">Prescription Details</h2>
        <div className="flex gap-2">
          {onEdit && isDoctor && (
            <button onClick={onEdit} className="text-sm font-bold text-[var(--brand)] hover:underline">Edit</button>
          )}
          <button onClick={handleDownload} className="text-sm font-bold text-[var(--ink)] hover:text-[var(--brand)] hover:underline flex items-center gap-1">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download PDF
          </button>
        </div>
      </div>

      <div className="p-6" id={`prescription-${prescription.id}`}>
        <div className="text-center mb-8 border-b border-[var(--line)] pb-6">
          <h1 className="font-serif text-2xl font-bold text-[var(--brand-deep)]">Schedula Health</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Digital Prescription</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Doctor</h4>
            <p className="font-bold text-[var(--ink)] mt-1">Dr. {appointment.clinician}</p>
            <p className="text-sm text-[var(--muted)]">{appointment.specialty}</p>
          </div>
          <div className="text-right">
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Patient</h4>
            <p className="font-bold text-[var(--ink)] mt-1">{appointment.patient.name}</p>
            <p className="text-sm text-[var(--muted)]">Age: {appointment.patient.age}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 border-y border-[var(--line)] py-4">
          <div>
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Appointment Info</h4>
            <p className="text-sm text-[var(--ink)] mt-1">
              {format(parseISO(appointment.startsAt), "dd MMM yyyy • hh:mm a")}
            </p>
          </div>
          <div className="text-right">
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">Prescription Date</h4>
            <p className="text-sm text-[var(--ink)] mt-1">
              {format(parseISO(prescription.createdAt), "dd MMM yyyy")}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Diagnosis</h4>
          <p className="text-lg font-bold text-[var(--ink)]">{prescription.diagnosis}</p>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide mb-4">Medicines Rx</h4>
          <div className="space-y-4">
            {prescription.medicines.map((med, i) => (
              <div key={med.id} className="flex gap-4">
                <span className="font-bold text-[var(--muted)]">{i + 1}.</span>
                <div>
                  <h5 className="font-bold text-[var(--ink)] text-base">{med.name}</h5>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                    <span><strong className="font-medium text-[var(--ink)]">Dosage:</strong> {med.dosage}</span>
                    {med.frequency && <span><strong className="font-medium text-[var(--ink)]">Frequency:</strong> {med.frequency}</span>}
                    <span><strong className="font-medium text-[var(--ink)]">Duration:</strong> {med.duration}</span>
                  </div>
                  {med.instructions && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      <strong className="font-medium text-[var(--ink)]">Instructions:</strong> {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {prescription.instructions && (
          <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-[var(--line)]">
            <h4 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">Additional Instructions</h4>
            <p className="text-sm text-[var(--ink)] whitespace-pre-wrap">{prescription.instructions}</p>
          </div>
        )}
      </div>
    </div>
  );
}
