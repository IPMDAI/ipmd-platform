"use client";

import { useActionState, useEffect, useRef } from "react";
import { addGradesBatch } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { GRADE_TYPES } from "@/lib/grades";
import { SEMESTERS } from "@/lib/referentiel";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };

export function BatchGradeForm({
  courseId,
  students,
}: {
  courseId: string;
  students: Student[];
}) {
  const bound = addGradesBatch.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  if (students.length === 0) return null;

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">
        Saisie groupée — toute la classe
      </h2>
      <p className="mt-1 text-sm text-black/55">
        Une même évaluation, un score par étudiant. Laisse vide pour ne pas noter
        un étudiant.
      </p>

      {/* Métadonnées de l'évaluation */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Évaluation" htmlFor="b-title" required>
          <input id="b-title" name="title" required placeholder="Ex. Devoir 1" className={inputBase} />
        </Field>
        <Field label="Semestre" htmlFor="b-sem">
          <select id="b-sem" name="semester" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor="b-type">
          <select id="b-type" name="type" defaultValue="classe" className={inputBase}>
            {GRADE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Coef." htmlFor="b-coef">
            <input id="b-coef" name="coefficient" type="number" step="0.5" min="0.5" defaultValue="1" className={inputBase} />
          </Field>
          <Field label="Barème" htmlFor="b-max">
            <input id="b-max" name="max_score" type="number" step="0.25" min="1" defaultValue="20" className={inputBase} />
          </Field>
        </div>
      </div>

      {/* Tableau étudiant → note */}
      <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-ipmd-light text-left text-xs uppercase tracking-wider text-black/45">
              <th className="px-4 py-2 font-semibold">Étudiant</th>
              <th className="w-32 px-4 py-2 text-right font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-black/5">
                <td className="px-4 py-2 font-medium text-ipmd-black">
                  {s.full_name || s.email}
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    name={`score_${s.id}`}
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="—"
                    className={`${inputBase} w-24 text-right`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer toutes les notes"}
        </ActionButton>
        {state && (
          <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
