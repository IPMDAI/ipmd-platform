"use client";

import { useState } from "react";
import { TeacherAssignForm, type EligibleTeacher } from "@/components/espace/TeacherAssignForm";
import type { FormResult } from "@/types";

/**
 * Contrôle compact « Changer l'enseignant » d'un créneau (D7-3). Ouvre le
 * formulaire d'affectation (éligibles only + motif) branché sur la RPC D7-2
 * `directeur_etudes_assign_slot_teacher` (réaffectation = motif obligatoire).
 */
export function SlotTeacherReassign({
  action,
  eligible,
  currentTeacherId,
  currentTeacherName,
}: {
  action: (prev: FormResult | null, formData: FormData) => Promise<FormResult>;
  eligible: EligibleTeacher[];
  currentTeacherId: string | null;
  currentTeacherName: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-semibold text-black/45 hover:text-ipmd-red"
      >
        {open ? "Fermer" : "✏️ Changer l'enseignant"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-white p-2 ring-1 ring-black/10">
          <TeacherAssignForm
            action={action}
            eligible={eligible}
            currentTeacherId={currentTeacherId}
            currentTeacherName={currentTeacherName}
            submitLabel="Réaffecter"
            motifPlaceholder="Motif de la réaffectation (obligatoire)"
          />
        </div>
      )}
    </div>
  );
}
