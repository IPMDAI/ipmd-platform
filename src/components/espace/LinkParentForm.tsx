"use client";

import { useActionState } from "react";
import { linkParentChild } from "@/lib/admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Person = { id: string; full_name: string | null; email: string };

export function LinkParentForm({
  parents,
  students,
}: {
  parents: Person[];
  students: Person[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    linkParentChild,
    null
  );

  const ready = parents.length > 0 && students.length > 0;

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Relier un parent</h2>

      {!ready ? (
        <p className="text-sm text-black/55">
          Il faut au moins un compte <strong>Parent</strong> et un compte{" "}
          <strong>Étudiant</strong>. Créez-les puis attribuez les rôles dans
          « Gestion des utilisateurs ».
        </p>
      ) : (
        <>
          <Field label="Parent" htmlFor="parent_id" required>
            <select
              id="parent_id"
              name="parent_id"
              required
              defaultValue=""
              className={inputBase}
            >
              <option value="" disabled>
                — Choisir —
              </option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email} ({p.email})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Enfant (étudiant)" htmlFor="student_id" required>
            <select
              id="student_id"
              name="student_id"
              required
              defaultValue=""
              className={inputBase}
            >
              <option value="" disabled>
                — Choisir —
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name || s.email} ({s.email})
                </option>
              ))}
            </select>
          </Field>

          <ActionButton type="submit" disabled={pending}>
            {pending ? "Liaison…" : "Créer le lien"}
          </ActionButton>
        </>
      )}

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
