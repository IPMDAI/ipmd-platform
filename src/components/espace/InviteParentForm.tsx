"use client";

import { useActionState } from "react";
import { inviteParent } from "@/lib/user-admin-actions";
import { PARENT_RELATIONSHIPS } from "@/lib/academic";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type Student = { id: string; full_name: string | null; email: string };

export function InviteParentForm({ students }: { students: Student[] }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    inviteParent,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Inviter un parent</h2>
      <p className="text-xs text-black/50">
        Crée le compte et envoie un email pour définir le mot de passe.
      </p>

      <Field label="Nom et prénom" htmlFor="i-name" required>
        <input id="i-name" name="full_name" required className={inputBase} />
      </Field>
      <Field label="Email" htmlFor="i-email" required>
        <input id="i-email" name="email" type="email" required className={inputBase} />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Enfant à lier (optionnel)" htmlFor="i-student">
          <select id="i-student" name="student_id" defaultValue="" className={inputBase}>
            <option value="">— Aucun —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Relation" htmlFor="i-rel">
          <select id="i-rel" name="relationship" defaultValue="" className={inputBase}>
            <option value="">— Non précisé —</option>
            {PARENT_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Invitation…" : "Inviter & envoyer"}
      </ActionButton>
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
