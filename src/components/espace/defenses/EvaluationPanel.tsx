"use client";

import { useActionState } from "react";
import { submitEvaluation, reviseEvaluation } from "@/lib/defense-actions";
import type { FormResult } from "@/types";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

export type EvalMember = {
  id: string;
  name: string;
  member_type: string;
  eval_status: string | null; // null = non saisi
  score: number | null;
};

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>;
}

function SubmitForm({ defenseId, memberId }: { defenseId: string; memberId: string }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    submitEvaluation.bind(null, defenseId, memberId), null
  );
  return (
    <form action={action} className="mt-1 flex flex-wrap items-end gap-2">
      <select name="eval_status" defaultValue="note" className="rounded-lg border border-black/15 px-2 py-1 text-xs">
        <option value="note">Note</option>
        <option value="abstention">Abstention</option>
      </select>
      <input name="score" type="number" step="0.25" min="0" max="20" className="w-24 rounded-lg border border-black/15 px-2 py-1 text-xs" placeholder="/20" />
      <input name="comment" className="flex-1 rounded-lg border border-black/15 px-2 py-1 text-xs" placeholder="Commentaire (optionnel)" />
      <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60">
        {pending ? "…" : "Saisir"}
      </button>
      <Msg state={state} />
    </form>
  );
}

function ReviseForm({ defenseId, member }: { defenseId: string; member: EvalMember }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    reviseEvaluation.bind(null, defenseId, member.id), null
  );
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-[11px] font-semibold text-black/60">Corriger (avec motif)</summary>
      <form action={action} className="mt-1 flex flex-wrap items-end gap-2">
        <input type="hidden" name="expected_score" value={member.score ?? ""} />
        <select name="eval_status" defaultValue={member.eval_status ?? "note"} className="rounded-lg border border-black/15 px-2 py-1 text-xs">
          <option value="note">Note</option>
          <option value="abstention">Abstention</option>
        </select>
        <input name="score" type="number" step="0.25" min="0" max="20" defaultValue={member.score ?? ""} className="w-24 rounded-lg border border-black/15 px-2 py-1 text-xs" placeholder="/20" />
        <input name="reason" required className="flex-1 rounded-lg border border-black/15 px-2 py-1 text-xs" placeholder="Motif de la correction (obligatoire)" />
        <button type="submit" disabled={pending} className="rounded-lg bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60">
          {pending ? "…" : "Corriger"}
        </button>
        <Msg state={state} />
      </form>
    </details>
  );
}

/** Évaluations par juré actif (note OU abstention), révision via RPC + motif. */
export function EvaluationPanel({
  defenseId,
  members,
  editable,
}: {
  defenseId: string;
  members: EvalMember[];
  editable: boolean;
}) {
  if (members.length === 0) {
    return <p className="text-sm text-black/55">Aucun juré actif à évaluer.</p>;
  }
  return (
    <ul className="space-y-2">
      {members.map((m) => {
        const saisi = m.eval_status !== null;
        return (
          <li key={m.id} className="rounded-xl border border-black/10 px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-ipmd-black">{m.name}</p>
              <span className="text-xs text-black/60">
                {!saisi ? (
                  <span className="text-amber-700">Non évalué</span>
                ) : m.eval_status === "abstention" ? (
                  <span className="text-black/50">Abstention</span>
                ) : (
                  <span className="font-semibold">{m.score}/20</span>
                )}
              </span>
            </div>
            {editable && !saisi && <SubmitForm defenseId={defenseId} memberId={m.id} />}
            {editable && saisi && <ReviseForm defenseId={defenseId} member={m} />}
          </li>
        );
      })}
    </ul>
  );
}
