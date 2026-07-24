"use client";

import { useState } from "react";
import { Check, Clock3, Pill } from "lucide-react";

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  slot: "morning" | "afternoon" | "evening" | "night";
  notes: string | null;
  taken: boolean;
};

const slotLabels = {
  morning: ["सुबह", "Morning"],
  afternoon: ["दोपहर", "Afternoon"],
  evening: ["शाम", "Evening"],
  night: ["रात", "Night"],
};

export function MedicineList({
  initialMedications,
  language,
}: {
  initialMedications: Medication[];
  language: "hi" | "en";
}) {
  const [medications, setMedications] = useState(initialMedications);
  const [saving, setSaving] = useState<string | null>(null);
  const isHindi = language === "hi";

  async function markTaken(medicationId: string) {
    setSaving(medicationId);
    const response = await fetch("/api/medications/taken", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ medicationId }),
    });
    if (response.ok) {
      setMedications((current) =>
        current.map((medication) =>
          medication.id === medicationId ? { ...medication, taken: true } : medication,
        ),
      );
    }
    setSaving(null);
  }

  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <article
          key={medication.id}
          className={`rounded-[1.7rem] border p-5 transition ${
            medication.taken
              ? "border-[#cfe0cc] bg-[#edf4e9]"
              : "border-line bg-white shadow-sm"
          }`}
        >
          <div className="flex items-start gap-4">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${
              medication.taken ? "bg-forest text-white" : "bg-[#fff4d8] text-[#8b6010]"
            }`}>
              {medication.taken ? <Check size={25} /> : <Pill size={25} />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl font-bold">{medication.name}</h2>
              <p className="mt-1 text-base text-muted">{medication.dosage}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-forest">
                <Clock3 size={16} />
                {slotLabels[medication.slot][isHindi ? 0 : 1]}
              </p>
              {medication.notes && <p className="mt-2 text-base text-muted">{medication.notes}</p>}
            </div>
          </div>
          <button
            disabled={medication.taken || saving === medication.id}
            onClick={() => markTaken(medication.id)}
            className={`focus-ring mt-5 min-h-14 w-full rounded-2xl text-xl font-bold ${
              medication.taken
                ? "bg-white/70 text-forest"
                : "bg-forest text-white"
            }`}
          >
            {medication.taken
              ? isHindi
                ? "ले लिया ✓"
                : "Taken ✓"
              : saving === medication.id
                ? isHindi
                  ? "दर्ज हो रहा है…"
                  : "Saving…"
                : isHindi
                  ? "ले लिया"
                  : "Taken"}
          </button>
        </article>
      ))}
    </div>
  );
}
