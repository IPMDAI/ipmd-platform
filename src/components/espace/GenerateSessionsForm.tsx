"use client";

import { useActionState } from "react";
import { generateSessions } from "@/lib/session-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { SEMESTERS } from "@/lib/referentiel";
import type { FormResult } from "@/types";

export function GenerateSessionsForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    generateSessions,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Générer les séances</h2>
      <p className="text-sm text-black/55">
        Crée les séances datées depuis le planning, jours fériés exclus.
      </p>
      <Field label="Classe" htmlFor="g-class" required>
        <select id="g-class" name="class_id" required defaultValue="" className={inputBase}>
          <option value="" disabled>
            — Choisir —
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Du" htmlFor="g-start" required>
          <input id="g-start" name="start" type="date" required className={inputBase} />
        </Field>
        <Field label="Au" htmlFor="g-end" required>
          <input id="g-end" name="end" type="date" required className={inputBase} />
        </Field>
      </div>
      <Field label="Semestre" htmlFor="g-sem">
        <select id="g-sem" name="semester" defaultValue="" className={inputBase}>
          <option value="">—</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Génération…" : "Générer"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
