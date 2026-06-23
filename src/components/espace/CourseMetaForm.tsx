"use client";

import { useActionState } from "react";
import { setCourseMeta } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function CourseMetaForm({
  courseId,
  ueNumber,
  ueName,
  ects,
}: {
  courseId: string;
  ueNumber: number | null;
  ueName: string | null;
  ects: number;
}) {
  const bound = setCourseMeta.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl bg-ipmd-light p-4">
      <p className="text-xs font-semibold text-black/55">
        Pour le bulletin officiel (UE = unité d&apos;enseignement, ECTS = crédits).
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="N° UE" htmlFor={`ue-${courseId}`}>
          <input id={`ue-${courseId}`} name="ue_number" type="number" min="1" defaultValue={ueNumber ?? ""} placeholder="1" className={inputBase} />
        </Field>
        <Field label="Crédits ECTS" htmlFor={`ec-${courseId}`}>
          <input id={`ec-${courseId}`} name="ects" type="number" step="0.5" min="0" defaultValue={ects || ""} placeholder="3" className={inputBase} />
        </Field>
        <div className="sm:col-span-3">
          <Field label="Nom de l'UE" htmlFor={`un-${courseId}`}>
            <input id={`un-${courseId}`} name="ue_name" defaultValue={ueName ?? ""} placeholder="Ex. Écosystème et outils digitaux" className={inputBase} />
          </Field>
        </div>
      </div>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer UE & ECTS"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>{state.message}</p>
      )}
    </form>
  );
}
