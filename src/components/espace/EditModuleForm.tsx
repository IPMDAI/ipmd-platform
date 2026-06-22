"use client";

import { useActionState } from "react";
import { updateModule } from "@/lib/module-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { NIVEAUX, SEMESTERS } from "@/lib/referentiel";
import type { FormResult } from "@/types";

type Teacher = { id: string; name: string };

export type ModuleData = {
  id: string;
  name: string;
  level: string | null;
  semester: string | null;
  teacher_id: string | null;
  hours: number | null;
  coefficient: number | null;
  syllabus: string | null;
};

export function EditModuleForm({
  module,
  filiereId,
  teachers,
}: {
  module: ModuleData;
  filiereId: string;
  teachers: Teacher[];
}) {
  const bound = updateModule.bind(null, module.id, filiereId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Fiche du module</h2>

      <Field label="Nom du module" htmlFor="em-name" required>
        <input
          id="em-name"
          name="name"
          required
          defaultValue={module.name}
          className={inputBase}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" htmlFor="em-level">
          <select
            id="em-level"
            name="level"
            defaultValue={module.level ?? ""}
            className={inputBase}
          >
            <option value="">—</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semestre" htmlFor="em-sem">
          <select
            id="em-sem"
            name="semester"
            defaultValue={module.semester ?? ""}
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

      <Field label="Enseignant" htmlFor="em-teacher">
        <select
          id="em-teacher"
          name="teacher_id"
          defaultValue={module.teacher_id ?? ""}
          className={inputBase}
        >
          <option value="">— Aucun —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Volume horaire (h)" htmlFor="em-hours">
          <input
            id="em-hours"
            name="hours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={module.hours ?? ""}
            placeholder="30"
            className={inputBase}
          />
        </Field>
        <Field label="Coefficient" htmlFor="em-coef">
          <input
            id="em-coef"
            name="coefficient"
            type="number"
            step="0.5"
            min="0"
            defaultValue={module.coefficient ?? ""}
            placeholder="2"
            className={inputBase}
          />
        </Field>
      </div>

      <Field label="Syllabus" htmlFor="em-syllabus">
        <textarea
          id="em-syllabus"
          name="syllabus"
          rows={5}
          defaultValue={module.syllabus ?? ""}
          placeholder="Objectifs, plan du cours, compétences visées, modalités d'évaluation…"
          className={inputBase}
        />
      </Field>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la fiche"}
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
