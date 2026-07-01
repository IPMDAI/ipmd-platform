"use client";

import { useActionState } from "react";
import { setStudentCivil } from "@/lib/admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export type ClassOption = { id: string; label: string };

/** Édition admin de l'état civil (naissance) + classe/filière d'un étudiant. */
export function StudentCivilForm({
  userId,
  birthDate,
  birthPlace,
  classId,
  classes,
}: {
  userId: string;
  birthDate: string | null;
  birthPlace: string | null;
  classId: string | null;
  classes: ClassOption[];
}) {
  const bound = setStudentCivil.bind(null, userId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  const has = birthDate || birthPlace;

  return (
    <details className="mt-2 rounded-lg bg-ipmd-light/60 px-3 py-2 text-xs">
      <summary className="cursor-pointer font-semibold text-ipmd-black">
        🎂 État civil &amp; classe
        {has ? (
          <span className="ml-2 text-[11px] font-normal text-black/45">
            {birthDate ?? ""}
            {birthPlace ? ` · ${birthPlace}` : ""}
          </span>
        ) : (
          <span className="ml-2 text-[11px] font-normal text-ipmd-red/70">à compléter</span>
        )}
      </summary>

      <form action={action} className="mt-2 grid grid-cols-2 gap-2">
        <Field label="Date de naissance" htmlFor={`bd-${userId}`}>
          <input
            id={`bd-${userId}`}
            name="birth_date"
            type="date"
            defaultValue={birthDate ?? ""}
            className={inputBase}
          />
        </Field>
        <Field label="Lieu de naissance" htmlFor={`bp-${userId}`}>
          <input
            id={`bp-${userId}`}
            name="birth_place"
            defaultValue={birthPlace ?? ""}
            placeholder="Ex. Daloa (Côte d'Ivoire)"
            className={inputBase}
          />
        </Field>
        <div className="col-span-2">
          <Field label="Classe (définit la filière)" htmlFor={`cl-${userId}`}>
            <select
              id={`cl-${userId}`}
              name="class_id"
              defaultValue={classId ?? ""}
              className={inputBase}
            >
              <option value="">— Ne pas changer —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <ActionButton type="submit" disabled={pending}>
            {pending ? "…" : "Enregistrer"}
          </ActionButton>
          {state && (
            <span className={`text-[11px] font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}
