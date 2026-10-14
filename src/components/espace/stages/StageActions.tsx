"use client";

import { useActionState } from "react";
import {
  submitInternship,
  validateInternship,
  startInternship,
  finishInternship,
  cancelInternship,
  changeInternshipCompany,
  changeInternshipDates,
  assignInternshipAdvisor,
} from "@/lib/internship-actions";
import type { FormResult } from "@/types";
import type { Opt } from "@/components/espace/stages/InternshipCreateForm";

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

/** Bouton de transition simple (confirmation). */
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

/** Annulation avec motif. */
function CancelForm({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    cancelInternship.bind(null, id),
    null
  );
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-ipmd-red">
        Annuler le stage
      </summary>
      <form
        action={formAction}
        className="space-y-2 p-3"
        onSubmit={(e) => {
          if (!window.confirm("Annuler définitivement ce stage ?")) e.preventDefault();
        }}
      >
        <textarea name="reason" required rows={2} className={field} placeholder="Motif d'annulation (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Confirmer l'annulation"}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

/** Changement d'entreprise (motif + concurrence). */
function ChangeCompanyForm({
  id,
  current,
  companies,
}: {
  id: string;
  current: string | null;
  companies: Opt[];
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    changeInternshipCompany.bind(null, id),
    null
  );
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">
        Changer l&apos;entreprise
      </summary>
      <form action={formAction} className="space-y-2 p-3">
        <input type="hidden" name="expected_company" value={current ?? ""} />
        <select name="host_company_id" required defaultValue="" className={field}>
          <option value="" disabled>— Nouvelle entreprise —</option>
          {companies.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input name="reason" required className={field} placeholder="Motif (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Changer l'entreprise"}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

/** Changement de dates (motif + concurrence). */
function ChangeDatesForm({
  id,
  start,
  end,
}: {
  id: string;
  start: string | null;
  end: string | null;
}) {
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    changeInternshipDates.bind(null, id),
    null
  );
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">
        Changer les dates
      </summary>
      <form action={formAction} className="space-y-2 p-3">
        <input type="hidden" name="expected_start" value={start ?? ""} />
        <input type="hidden" name="expected_end" value={end ?? ""} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" name="start_date" defaultValue={start ?? ""} className={field} />
          <input type="date" name="end_date" defaultValue={end ?? ""} className={field} />
        </div>
        <input name="reason" required className={field} placeholder="Motif (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Changer les dates"}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

/** Affectation / changement d'encadreur (éligibilité + motif gardés par la RPC). */
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
    assignInternshipAdvisor.bind(null, id),
    null
  );
  return (
    <details className="rounded-lg ring-1 ring-black/10">
      <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">
        {current ? "Changer l'encadreur académique" : "Affecter un encadreur académique"}
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

/** Panneau d'actions, dépendant du statut (les RPC restent l'autorité finale). */
export function StageActions({
  id,
  status,
  hostCompanyId,
  startDate,
  endDate,
  advisorId,
  companies,
  advisors,
}: {
  id: string;
  status: string;
  hostCompanyId: string | null;
  startDate: string | null;
  endDate: string | null;
  advisorId: string | null;
  companies: Opt[];
  advisors: Opt[];
}) {
  const closed = status === "termine" || status === "annule";
  const canChange = ["a_valider", "valide", "en_cours"].includes(status);
  const canAssign = ["brouillon", "a_valider", "valide", "en_cours"].includes(status);

  if (closed) {
    return (
      <p className="rounded-xl bg-black/5 px-3 py-2 text-xs text-black/55">
        Stage {status === "termine" ? "terminé" : "annulé"} : aucune action disponible.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Transitions principales */}
      <div className="flex flex-wrap gap-2">
        {status === "brouillon" && (
          <ActionButton
            action={submitInternship.bind(null, id)}
            label="Soumettre pour validation"
            confirm="Soumettre ce stage pour validation ?"
          />
        )}
        {status === "a_valider" && (
          <ActionButton
            action={validateInternship.bind(null, id)}
            label="Valider le stage"
            confirm="Valider ce stage ?"
          />
        )}
        {status === "valide" && (
          <ActionButton
            action={startInternship.bind(null, id)}
            label="Démarrer le stage"
            confirm="Marquer ce stage comme démarré (en cours) ?"
          />
        )}
        {status === "en_cours" && (
          <ActionButton
            action={finishInternship.bind(null, id)}
            label="Terminer le stage"
            confirm="Marquer ce stage comme terminé ?"
          />
        )}
      </div>

      {/* Corrections encadrées */}
      <div className="space-y-2">
        {canAssign && <AssignAdvisorForm id={id} current={advisorId} advisors={advisors} />}
        {canChange && <ChangeCompanyForm id={id} current={hostCompanyId} companies={companies} />}
        {canChange && <ChangeDatesForm id={id} start={startDate} end={endDate} />}
        <CancelForm id={id} />
      </div>
    </div>
  );
}
