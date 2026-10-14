"use client";

import { useState } from "react";
import { TeacherAssignForm, type EligibleTeacher } from "@/components/espace/TeacherAssignForm";
import type { FormResult } from "@/types";

/**
 * Substitution EXCEPTIONNELLE de l'enseignant d'UNE séance (D7-3b). Branché sur
 * la RPC D7-2 `directeur_etudes_substitute_session_teacher` (éligibilité + motif
 * obligatoire + audit). Ne modifie NI le module NI le créneau permanent.
 */
export function SessionTeacherSubstitute({
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
    <div className="mt-3 border-t border-black/5 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-black/15 transition-colors hover:bg-black/5"
      >
        {open ? "Fermer" : "🔁 Remplacer l'enseignant pour cette séance"}
      </button>
      {open && (
        <div className="mt-3">
          <p className="mb-2 text-[11px] text-black/50">
            Remplacement ponctuel pour cette séance uniquement — l&apos;enseignant permanent du
            module et du créneau n&apos;est pas modifié.
          </p>
          <TeacherAssignForm
            action={action}
            eligible={eligible}
            currentTeacherId={currentTeacherId}
            currentTeacherName={currentTeacherName}
            submitLabel="Remplacer pour cette séance"
            motifPlaceholder="Motif du remplacement (obligatoire)"
          />
        </div>
      )}
    </div>
  );
}
