"use client";

import { useActionState } from "react";
import { enrollStudent } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };

export function EnrollStudentForm({
  courseId,
  students,
}: {
  courseId: string;
  students: Student[];
}) {
  const bound = enrollStudent.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Inscrire un étudiant</h2>

      {students.length === 0 ? (
        <p className="text-sm text-black/55">
          Aucun compte étudiant disponible. Créez un compte avec le rôle
          « Étudiant » pour pouvoir l&apos;inscrire.
        </p>
      ) : (
        <>
          <Field label="Étudiant" htmlFor="student_id" required>
            <select
              id="student_id"
              name="student_id"
              required
              className={inputBase}
              defaultValue=""
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
            {pending ? "Inscription…" : "Inscrire"}
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
