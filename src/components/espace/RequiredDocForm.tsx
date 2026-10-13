"use client";

import { useActionState } from "react";
import { addRequiredDocument } from "@/lib/student-document-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };
type DocType = { doc_key: string; label: string };

export function RequiredDocForm({
  students,
  docTypes,
}: {
  students: Student[];
  docTypes: DocType[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    addRequiredDocument,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Demander une pièce</h2>

      <Field label="Étudiant" htmlFor="d-student" required>
        <select id="d-student" name="student_id" required defaultValue="" className={inputBase}>
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

      <Field label="Libellé" htmlFor="d-label" required>
        <input
          id="d-label"
          name="label"
          required
          placeholder="Ex. Acte de naissance"
          className={inputBase}
        />
      </Field>

      <Field label="Type (optionnel)" htmlFor="d-key">
        <select id="d-key" name="doc_key" defaultValue="" className={inputBase}>
          <option value="">— Aucun —</option>
          {docTypes.map((t) => (
            <option key={t.doc_key} value={t.doc_key}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Demander & notifier"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
