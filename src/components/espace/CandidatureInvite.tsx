"use client";

import { useActionState } from "react";
import { inviteFromCandidature } from "@/lib/user-admin-actions";
import { inputBase } from "@/components/forms/FormField";
import { ROLE_OPTIONS } from "@/lib/dashboards";
import type { FormResult } from "@/types";

export function CandidatureInvite({
  candidatureId,
  defaultRole,
  classes,
}: {
  candidatureId: string;
  defaultRole: string;
  classes: { id: string; name: string }[];
}) {
  const bound = inviteFromCandidature.bind(null, candidatureId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form
      action={action}
      className="mt-4 rounded-xl bg-ipmd-light p-4"
    >
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-black/45">
        Créer le compte & inviter
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-black/55">
          Rôle
          <select
            name="role"
            defaultValue={defaultRole}
            className={`${inputBase} mt-1 py-1.5 text-sm`}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-black/55">
          Classe (optionnel)
          <select
            name="class_id"
            defaultValue=""
            className={`${inputBase} mt-1 py-1.5 text-sm`}
          >
            <option value="">—</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Envoi…" : "✉️ Créer & inviter"}
        </button>
      </div>
      {state && (
        <p
          className={`mt-2 text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
