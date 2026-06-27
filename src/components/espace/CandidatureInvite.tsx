"use client";

import { useActionState, useState } from "react";
import { inviteFromCandidature } from "@/lib/user-admin-actions";
import { inputBase } from "@/components/forms/FormField";
import { ROLE_OPTIONS } from "@/lib/dashboards";
import { formatFCFA } from "@/lib/finance";
import { FORMATION_MODE_LABEL } from "@/lib/academic";
import type { FormResult } from "@/types";

type ClassOption = {
  id: string;
  name: string;
  kind: string;
  tuition_amount: number | null;
  registration_fee: number | null;
  installments: number;
  mode: string | null;
};

export function CandidatureInvite({
  candidatureId,
  defaultRole,
  isBootcamp = false,
  classes,
  levels = [],
  registrationFee = 300000,
}: {
  candidatureId: string;
  defaultRole: string;
  isBootcamp?: boolean;
  classes: ClassOption[];
  levels?: { level: string; amount: number }[];
  registrationFee?: number;
}) {
  const bound = inviteFromCandidature.bind(null, candidatureId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  const [level, setLevel] = useState("");
  const [classId, setClassId] = useState("");

  // On ne propose que les classes du bon type (bootcamp vs diplôme) → pas de mélange.
  const availableClasses = classes.filter((c) =>
    isBootcamp ? c.kind === "bootcamp" : c.kind !== "bootcamp"
  );
  const selectedClass = availableClasses.find((c) => c.id === classId) || null;

  // Calcul des frais.
  const levelTuition = levels.find((l) => l.level === level)?.amount ?? 0;
  let reg = registrationFee;
  let tuition = 0;
  let installments = 1;
  let hasFee = false;

  if (isBootcamp) {
    if (selectedClass) {
      reg = selectedClass.registration_fee != null ? selectedClass.registration_fee : registrationFee;
      tuition = selectedClass.tuition_amount ?? 0;
      installments = selectedClass.installments || 1;
      hasFee = true;
    }
  } else {
    // Diplôme : tarif de la classe prioritaire, sinon tarif du niveau.
    tuition = selectedClass?.tuition_amount ?? levelTuition;
    hasFee = !!level || !!selectedClass;
  }
  const total = reg + tuition;

  return (
    <form action={action} className="mt-4 rounded-xl bg-ipmd-light p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-black/45">
        Créer le compte & inviter — {isBootcamp ? "Bootcamp" : "Diplôme"}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-black/55">
          Rôle
          <select name="role" defaultValue={defaultRole} className={`${inputBase} mt-1 py-1.5 text-sm`}>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        {/* Diplôme uniquement : niveau (frais du niveau) */}
        {!isBootcamp && (
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
        )}

        <label className="text-xs font-semibold text-black/55">
          {isBootcamp ? "Session bootcamp" : "Classe (optionnel)"}
          <select
            name="class_id"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className={`${inputBase} mt-1 py-1.5 text-sm`}
          >
            <option value="">—</option>
            {availableClasses.map((c) => (
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

      {isBootcamp && availableClasses.length === 0 && (
        <p className="mt-2 text-[11px] text-amber-600">
          ⚠️ Aucune session bootcamp créée. Crée-la dans <strong>Classes &amp; filières</strong> (Nature
          = Bootcamp) avec ses frais propres, puis reviens ici.
        </p>
      )}

      {/* Récap des frais */}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
        <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
          Inscription : {hasFee ? formatFCFA(reg) : "—"}
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
          Scolarité : {hasFee ? formatFCFA(tuition) : "—"}
        </span>
        <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-white">
          Total : {hasFee ? formatFCFA(total) : "—"}
        </span>
        {isBootcamp && selectedClass && (
          <>
            <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
              Paiement en {installments} fois
            </span>
            {selectedClass.mode && (
              <span className="rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10">
                {FORMATION_MODE_LABEL[selectedClass.mode] ?? selectedClass.mode}
              </span>
            )}
          </>
        )}
      </div>

      {state && (
        <p className={`mt-2 text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
