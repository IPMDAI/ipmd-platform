"use client";

import { useActionState } from "react";
import {
  openAcademicWork,
  validateAcademicWork,
  requestCorrection,
  cancelAcademicWork,
  assignWorkAdvisor,
} from "@/lib/academic-work-actions";
import type { FormResult } from "@/types";
import type { Opt } from "@/components/espace/works/AcademicWorkCreateForm";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

type Bound = (prev: FormResult | null, fd: FormData) => Promise<FormResult>;

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>
      {state.message}
    </p>
  );
}

function ActionButton({
  action,
  label,
  confirm,
  tone = "primary",
}: {
  action: Bound;
  label: string;
  confirm: string;
  tone?: "primary" | "ghost";
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(action, null);
  const cls =
    tone === "primary"
      ? "rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-black/15 hover:bg-black/5 disabled:opacity-60";
  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm(confirm)) e.preventDefault();
        }}
      >
        <button type="submit" disabled={pending} className={cls}>
          {pending ? "…" : label}
        </button>
      </form>
      <Msg state={state} />
    </div>
  );
}

function ReasonForm({
  id,
  action,
  summary,
  placeholder,
  submitLabel,
  tone = "dark",
}: {
  id: string;
  action: (id: string) => Bound;
  summary: string;
  placeholder: string;
  submitLabel: string;
  tone?: "dark" | "red";
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    action(id),
    null
  );
  const btn =
    tone === "red"
      ? "rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      : "rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60";
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className={`cursor-pointer px-3 py-1.5 text-xs font-semibold ${tone === "red" ? "text-ipmd-red" : "text-black/70"}`}>
        {summary}
      </summary>
      <form action={formAction} className="space-y-2 p-3">
        <textarea name="reason" required rows={2} className={field} placeholder={placeholder} />
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "…" : submitLabel}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

function AssignAdvisorForm({
  id,
  current,
  advisors,
}: {
  id: string;
  current: string | null;
  advisors: Opt[];
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    assignWorkAdvisor.bind(null, id),
    null
  );
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">
        {current ? "Changer l'encadreur" : "Affecter un encadreur"}
      </summary>
      <form action={formAction} className="space-y-2 p-3">
        <input type="hidden" name="expected_advisor" value={current ?? ""} />
        <select name="advisor_id" required defaultValue="" className={field}>
          <option value="" disabled>— Encadreur éligible —</option>
          {advisors.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input name="reason" required className={field} placeholder="Motif (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Affecter"}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

/** Panneau d'actions du travail, dépendant du statut (les RPC restent l'autorité). */
export function WorkActions({
  id,
  status,
  advisorId,
  advisors,
}: {
  id: string;
  status: string;
  advisorId: string | null;
  advisors: Opt[];
}) {
  if (status === "annule" || status === "valide") {
    return (
      <p className="rounded-xl bg-black/5 px-3 py-2 text-xs text-black/55">
        Travail {status === "valide" ? "validé" : "annulé"} : aucune action disponible.
      </p>
    );
  }

  const canAssign = ["brouillon", "a_deposer", "depose", "a_corriger"].includes(status);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === "brouillon" && (
          <ActionButton
            action={openAcademicWork.bind(null, id)}
            label="Ouvrir le dépôt"
            confirm="Ouvrir le dépôt documentaire pour l'étudiant ?"
          />
        )}
        {status === "depose" && (
          <ActionButton
            action={validateAcademicWork.bind(null, id)}
            label="Valider le travail"
            confirm="Valider ce travail ? Le document sera marqué validé."
          />
        )}
      </div>

      <div className="space-y-2">
        {canAssign && <AssignAdvisorForm id={id} current={advisorId} advisors={advisors} />}
        {status === "depose" && (
          <ReasonForm
            id={id}
            action={(i) => requestCorrection.bind(null, i)}
            summary="Demander une correction"
            placeholder="Motif / consignes de correction (obligatoire)"
            submitLabel="Demander la correction"
          />
        )}
        <ReasonForm
          id={id}
          action={(i) => cancelAcademicWork.bind(null, i)}
          summary="Annuler le travail"
          placeholder="Motif d'annulation (obligatoire)"
          submitLabel="Confirmer l'annulation"
          tone="red"
        />
      </div>
    </div>
  );
}
