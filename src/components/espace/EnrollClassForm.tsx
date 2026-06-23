"use client";

import { useActionState } from "react";
import { enrollClass } from "@/lib/teaching-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function EnrollClassForm({
  courseId,
  classes,
}: {
  courseId: string;
  classes: { id: string; name: string }[];
}) {
  const bound = enrollClass.bind(null, courseId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  if (classes.length === 0) return null;

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-ipmd-light p-4">
      <p className="text-sm font-bold text-ipmd-black">Inscrire toute une classe</p>
      <Field label="Classe" htmlFor={`cls-${courseId}`} required>
        <select id={`cls-${courseId}`} name="class_id" required defaultValue="" className={inputBase}>
          <option value="" disabled>
            — Choisir une classe —
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Inscription…" : "Inscrire la classe"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
