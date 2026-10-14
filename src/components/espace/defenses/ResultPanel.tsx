"use client";

import { useActionState } from "react";
import { recordResult, reviseResult, validateResult } from "@/lib/defense-actions";
import { JURY_DECISIONS, JURY_DECISION_LABEL } from "@/lib/defenses";
import type { FormResult } from "@/types";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

export type Result = {
  final_score: number | null;
  mention: string | null;
  jury_decision: string | null;
  deliberation: string | null;
  result_status: string;
} | null;

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>;
}

function DecisionSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select name="decision" required defaultValue={defaultValue ?? ""} className={field}>
      <option value="" disabled>— Décision du jury —</option>
      {JURY_DECISIONS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
    </select>
  );
}

function Fields({ result }: { result?: Result }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <input name="score" type="number" step="0.25" min="0" max="20" required defaultValue={result?.final_score ?? ""} className={field} placeholder="Note finale /20 *" />
        <DecisionSelect defaultValue={result?.jury_decision ?? ""} />
      </div>
      <textarea name="deliberation" required rows={3} defaultValue={result?.deliberation ?? ""} className={field} placeholder="PV de délibération (obligatoire)" />
      <p className="text-[11px] text-black/45">
        La mention est calculée par la base d&apos;après la note ; la décision n&apos;est liée à aucun seuil automatique.
      </p>
    </>
  );
}

/** Enregistrement / révision / validation du résultat (le frontend ne décide rien). */
export function ResultPanel({
  defenseId,
  status,
  result,
}: {
  defenseId: string;
  status: string; // statut de la soutenance
  result: Result;
}) {
  const [recState, recAction, recPending] = useActionState<FormResult | null, FormData>(
    recordResult.bind(null, defenseId), null
  );
  const [revState, revAction, revPending] = useActionState<FormResult | null, FormData>(
    reviseResult.bind(null, defenseId), null
  );
  const [valState, valAction, valPending] = useActionState<FormResult | null, FormData>(
    validateResult.bind(null, defenseId), null
  );

  if (status !== "tenue") {
    return <p className="text-sm text-black/55">Le résultat se saisit après que la soutenance est « tenue ».</p>;
  }

  const rs = result?.result_status;

  if (rs === "valide") {
    return (
      <div className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
        <p className="text-sm font-semibold text-emerald-800">Résultat validé (verrouillé)</p>
        <p className="mt-1 text-sm text-emerald-900">
          {result?.final_score}/20 · {result?.mention} · {JURY_DECISION_LABEL[result?.jury_decision ?? ""] ?? result?.jury_decision}
        </p>
      </div>
    );
  }

  // en_evaluation → saisie ; delibere → révision + validation
  if (!result || rs === "en_evaluation") {
    return (
      <form action={recAction} className="space-y-2">
        <p className="text-xs font-semibold text-black/70">Enregistrer le résultat (délibération)</p>
        <Fields />
        <button type="submit" disabled={recPending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {recPending ? "…" : "Enregistrer le résultat"}
        </button>
        <Msg state={recState} />
      </form>
    );
  }

  // delibere
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-sky-50 p-3 ring-1 ring-sky-200">
        <p className="text-sm font-semibold text-sky-800">Délibéré (non validé)</p>
        <p className="mt-1 text-sm text-sky-900">
          {result?.final_score}/20 · {result?.mention} · {JURY_DECISION_LABEL[result?.jury_decision ?? ""] ?? result?.jury_decision}
        </p>
      </div>

      <details className="rounded-lg ring-1 ring-black/10">
        <summary className="cursor-pointer px-3 py-1.5 text-xs font-semibold text-black/70">Réviser avant validation</summary>
        <form action={revAction} className="space-y-2 p-3">
          <Fields result={result} />
          <input name="reason" required className={field} placeholder="Motif de la révision (obligatoire)" />
          <button type="submit" disabled={revPending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {revPending ? "…" : "Réviser le résultat"}
          </button>
          <Msg state={revState} />
        </form>
      </details>

      <form action={valAction}
        onSubmit={(e) => { if (!window.confirm("Valider définitivement le résultat ? Il deviendra visible par l'étudiant et sera verrouillé.")) e.preventDefault(); }}>
        <button type="submit" disabled={valPending} className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {valPending ? "…" : "Valider le résultat (pédagogique)"}
        </button>
        <Msg state={valState} />
      </form>
    </div>
  );
}
