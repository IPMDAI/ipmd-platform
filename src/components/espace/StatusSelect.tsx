"use client";

import { useState, useTransition } from "react";
import { setFiliereStatus } from "@/lib/referentiel-actions";
import { setModuleStatus } from "@/lib/module-actions";
import { ACADEMIC_STATUSES } from "@/lib/academic";

/** Sélecteur de statut réservé au Super Admin (validation). */
export function StatusSelect({
  kind,
  id,
  filiereId,
  current,
}: {
  kind: "filiere" | "module";
  id: string;
  filiereId?: string;
  current: string;
}) {
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();

  function change(status: string) {
    setValue(status);
    startTransition(async () => {
      if (kind === "filiere") {
        await setFiliereStatus(id, status);
      } else {
        await setModuleStatus(id, filiereId ?? "", status);
      }
    });
  }

  return (
    <select
      value={value}
      onChange={(e) => change(e.target.value)}
      disabled={pending}
      aria-label="Statut de validation"
      className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-semibold text-ipmd-black outline-none transition-colors focus:border-ipmd-red disabled:opacity-50"
    >
      {ACADEMIC_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
