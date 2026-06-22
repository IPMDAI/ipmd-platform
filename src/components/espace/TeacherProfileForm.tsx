"use client";

import { useActionState } from "react";
import { saveTeacherProfile } from "@/lib/teacher-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { TEACHER_STATUSES } from "@/lib/teacher";
import type { FormResult } from "@/types";

export type TeacherSheet = {
  phone?: string | null;
  function?: string | null;
  title?: string | null;
  specialty?: string | null;
  availability?: string | null;
  cv_url?: string | null;
  diplomas?: string | null;
  authorization?: string | null;
  status?: string | null;
};

export function TeacherProfileForm({
  teacherId,
  sheet,
}: {
  teacherId: string;
  sheet: TeacherSheet;
}) {
  const bound = saveTeacherProfile.bind(null, teacherId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-black/5 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fonction réelle" htmlFor={`f-${teacherId}`}>
          <input
            id={`f-${teacherId}`}
            name="function"
            defaultValue={sheet.function ?? ""}
            placeholder="Consultant en Marketing digital"
            className={inputBase}
          />
        </Field>
        <Field label="Titre / qualité" htmlFor={`t-${teacherId}`}>
          <input
            id={`t-${teacherId}`}
            name="title"
            defaultValue={sheet.title ?? ""}
            placeholder="Dr, Enseignant-chercheur…"
            className={inputBase}
          />
        </Field>
        <Field label="Spécialité" htmlFor={`s-${teacherId}`}>
          <input
            id={`s-${teacherId}`}
            name="specialty"
            defaultValue={sheet.specialty ?? ""}
            className={inputBase}
          />
        </Field>
        <Field label="Téléphone" htmlFor={`p-${teacherId}`}>
          <input
            id={`p-${teacherId}`}
            name="phone"
            defaultValue={sheet.phone ?? ""}
            className={inputBase}
          />
        </Field>
        <Field label="Disponibilité" htmlFor={`a-${teacherId}`}>
          <input
            id={`a-${teacherId}`}
            name="availability"
            defaultValue={sheet.availability ?? ""}
            placeholder="Ex. Mar–Jeu, après-midi"
            className={inputBase}
          />
        </Field>
        <Field label="Statut" htmlFor={`st-${teacherId}`}>
          <select
            id={`st-${teacherId}`}
            name="status"
            defaultValue={sheet.status ?? "en_attente"}
            className={inputBase}
          >
            {TEACHER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lien CV" htmlFor={`cv-${teacherId}`}>
          <input
            id={`cv-${teacherId}`}
            name="cv_url"
            defaultValue={sheet.cv_url ?? ""}
            placeholder="https://…"
            className={inputBase}
          />
        </Field>
        <Field label="Autorisation d'enseigner" htmlFor={`au-${teacherId}`}>
          <input
            id={`au-${teacherId}`}
            name="authorization"
            defaultValue={sheet.authorization ?? ""}
            className={inputBase}
          />
        </Field>
      </div>
      <Field label="Diplômes" htmlFor={`d-${teacherId}`}>
        <textarea
          id={`d-${teacherId}`}
          name="diplomas"
          rows={2}
          defaultValue={sheet.diplomas ?? ""}
          placeholder="Master en marketing, Certifications…"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer la fiche"}
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
