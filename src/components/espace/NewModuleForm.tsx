"use client";

import { useActionState, useEffect, useRef } from "react";
import { createModule } from "@/lib/referentiel-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { NIVEAUX, SEMESTERS } from "@/lib/referentiel";
import type { FormResult } from "@/types";

export function NewModuleForm({ filiereId }: { filiereId: string }) {
  const bound = createModule.bind(null, filiereId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau module</h2>
      <Field label="Nom du module" htmlFor="m-name" required>
        <input
          id="m-name"
          name="name"
          required
          placeholder="Ex. Fondamentaux du marketing digital"
          className={inputBase}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" htmlFor="m-level">
          <select id="m-level" name="level" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semestre" htmlFor="m-semester">
          <select
            id="m-semester"
            name="semester"
            defaultValue=""
            className={inputBase}
          >
            <option value="">—</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter le module"}
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
