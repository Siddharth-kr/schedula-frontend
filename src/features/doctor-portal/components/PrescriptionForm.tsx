import { useState } from "react";
import type { Prescription, Medicine } from "@/types/prescription";
import type { Appointment } from "@/types/appointment";
import { addPrescription, updatePrescription } from "@/lib/prescription-store";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

interface Props {
  appointment: Appointment;
  existingPrescription?: Prescription;
  onSuccess: (prescription: Prescription) => void;
  onCancel: () => void;
}

export function PrescriptionForm({ appointment, existingPrescription, onSuccess, onCancel }: Props) {
  const [diagnosis, setDiagnosis] = useState(existingPrescription?.diagnosis || "");
  const [instructions, setInstructions] = useState(existingPrescription?.instructions || "");
  const [medicines, setMedicines] = useState<Medicine[]>(
    existingPrescription?.medicines || [{ id: uuidv4(), name: "", dosage: "", frequency: "", duration: "", instructions: "" }]
  );

  const addMedicine = () => {
    setMedicines([...medicines, { id: uuidv4(), name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const newMedicines = [...medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setMedicines(newMedicines);
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis) return toast.error("Diagnosis is required.");
    if (medicines.length === 0) return toast.error("At least one medicine is required.");
    for (const m of medicines) {
      if (!m.name || !m.dosage || !m.duration) {
        return toast.error("Medicine name, dosage, and duration are required.");
      }
    }

    const payload: Prescription = {
      id: existingPrescription?.id || uuidv4(),
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      patientId: appointment.patient.name, // using name as id since mock data is simple
      diagnosis,
      medicines,
      instructions,
      createdAt: existingPrescription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingPrescription) {
      updatePrescription(payload);
      toast.success("Prescription updated successfully");
    } else {
      addPrescription(payload);
      toast.success("Prescription created successfully");
    }
    
    onSuccess(payload);
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="border-b border-border bg-background/50 px-6 py-4">
        <h2 className="font-bold text-text-primary font-serif">
          {existingPrescription ? "Edit Prescription" : "Create Prescription"}
        </h2>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Diagnosis <span className="text-error">*</span></label>
          <input 
            type="text" 
            value={diagnosis} 
            onChange={e => setDiagnosis(e.target.value)} 
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary bg-background"
            placeholder="e.g. Viral fever"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Medicines</h3>
          </div>
          
          <div className="space-y-4">
            {medicines.map((med, idx) => (
              <div key={med.id} className="relative rounded-xl border border-border p-4 bg-background">
                {medicines.length > 1 && (
                  <button type="button" onClick={() => removeMedicine(idx)} className="absolute top-4 right-4 text-error hover:text-error text-sm font-bold">
                    Remove
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1">Medicine Name <span className="text-error">*</span></label>
                    <input type="text" value={med.name} onChange={e => updateMedicine(idx, 'name', e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Paracetamol 500mg" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Dosage <span className="text-error">*</span></label>
                    <input type="text" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. 1 tablet" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Frequency</label>
                    <input type="text" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Twice daily" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Duration <span className="text-error">*</span></label>
                    <input type="text" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} required className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. 5 days" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Instructions</label>
                    <input type="text" value={med.instructions} onChange={e => updateMedicine(idx, 'instructions', e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary outline-none" placeholder="e.g. Take after meals" />
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addMedicine} className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
              + Add Medicine
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">Additional Instructions</label>
          <textarea 
            value={instructions} 
            onChange={e => setInstructions(e.target.value)} 
            rows={3}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-primary bg-background"
            placeholder="e.g. Stay hydrated and rest."
          />
        </div>
      </div>

      <div className="border-t border-border bg-background/50 px-6 py-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl bg-white border border-border px-5 py-2.5 text-sm font-bold text-text-primary hover:bg-background transition-colors">
          Cancel
        </button>
        <button type="submit" className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-sm">
          Save Prescription
        </button>
      </div>
    </form>
  );
}
