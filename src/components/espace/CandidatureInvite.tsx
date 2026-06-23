"use client";

import { useActionState, useState } from "react";
import { inviteFromCandidature } from "@/lib/user-admin-actions";
import { inputBase } from "@/components/forms/FormField";
import { ROLE_OPTIONS } from "@/lib/dashboards";
import { formatFCFA } from "@/lib/finance";
import type { FormResult } from "@/types";

export function CandidatureInvite({
  candidatureId,
  defaultRole,
  classes,
  levels = [],
  registrationFee = 300000,
}: {
  candidatureId: string;
  defaultRole: string;
  classes: { id: string; name: string }[];
  levels?: { level: string; amount: number }[];
  registrationFee?: number;
}) {
  const bound = inviteFromCandidature.bind(null, candidatureId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const [level, setLevel] = useState("");
  const tuition = levels.find((l) => l.level === level)?.amount ?? 0;
  const total = registrationFee + tuition;

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
          Niveau accepté (frais)
          <select
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={`${inputBase} mt-1 py-1.5 text-sm`}
          >
            <option value="">—</option>
            {levels.map((l) => (
              <option key={l.level} value={l.level}>
                {l.level} — {l.amount > 0 ? formatFCFA(l.amount) : "tarif à définir"}
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

      {/* Récap des frais (mis à jour selon le niveau choisi). */}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
          Inscription : {formatFCFA(registrationFee)}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
          Scolarité : {level ? formatFCFA(tuition) : "—"}
        </span>
        <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-white">
          Total : {level ? formatFCFA(total) : "—"}
        </span>
      </div>
      {level && tuition === 0 && (
        <p className="mt-1 text-[11px] text-amber-600">
          ⚠️ Tarif de scolarité non défini pour ce niveau — règle-le dans Finance →
          Paramètres financiers, sinon la proforma n&apos;affichera que l&apos;inscription.
        </p>
      )}

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
