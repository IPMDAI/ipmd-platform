"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGrade } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };

export function AddGradeForm({
  courseId,
  students,
}: {
  courseId: string;
  students: Student[];
}) {
  const bound = addGrade.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Saisir une note</h2>

      {students.length === 0 ? (
        <p className="text-sm text-black/55">
          Aucun étudiant inscrit à ce cours. Inscrivez d&apos;abord des
          étudiants.
        </p>
      ) : (
        <>
          <Field label="Étudiant" htmlFor="g-student" required>
            <select
              id="g-student"
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
                  {s.full_name || s.email}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Évaluation" htmlFor="g-title" required>
            <input
              id="g-title"
              name="title"
              required
              placeholder="Ex. Contrôle continu 1"
              className={inputBase}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Note" htmlFor="g-score" required>
              <input
                id="g-score"
                name="score"
                type="number"
                step="0.25"
                min="0"
                required
                placeholder="14"
                className={inputBase}
              />
            </Field>
            <Field label="Barème" htmlFor="g-max">
              <input
                id="g-max"
                name="max_score"
                type="number"
                step="0.25"
                min="1"
                defaultValue="20"
                className={inputBase}
              />
            </Field>
          </div>

          <Field label="Commentaire (optionnel)" htmlFor="g-comment">
            <input
              id="g-comment"
              name="comment"
              placeholder="Ex. Bon travail, à approfondir…"
              className={inputBase}
            />
          </Field>

          <ActionButton type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer la note"}
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
