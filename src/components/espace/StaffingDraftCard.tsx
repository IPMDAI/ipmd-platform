"use client";

import { useActionState, useState } from "react";
import { submitStaffingRequest } from "@/lib/staffing-actions";
import { StaffingRequestForm, type StaffingOptions } from "@/components/espace/StaffingRequestForm";
import { NEED_TYPE_LABEL, PRIORITY_LABEL, type StaffingRequestRow } from "@/lib/staffing";
import type { FormResult } from "@/types";

/**
 * Carte d'un besoin au statut BROUILLON : résumé + « Modifier » (monte le
 * formulaire d'édition) + « Soumettre à l'AG » (confirmation, puis plus aucune
 * modification possible). Aucun bouton Valider/Refuser/Affecter/Recruter.
 */
export function StaffingDraftCard({
  request,
  options,
}: {
  request: StaffingRequestRow;
  options: StaffingOptions;
}) {
  const [editing, setEditing] = useState(false);
  const submit = submitStaffingRequest.bind(null, request.id);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    submit,
    null
  );

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ipmd-black">{request.position_title}</p>
          <p className="mt-0.5 text-sm text-black/55">
            {NEED_TYPE_LABEL[request.need_type] ?? request.need_type}
            {request.academic_year ? ` · ${request.academic_year}` : ""}
            {` · priorité ${PRIORITY_LABEL[request.priority] ?? request.priority}`}
          </p>
        </div>
        <span className="inline-block rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-black/60 ring-1 ring-black/10">
          Brouillon
        </span>
      </div>

      {!editing && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-black/70">{request.justification}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-black/15 transition-colors hover:bg-black/5"
        >
          {editing ? "Fermer l'édition" : "✏️ Modifier"}
        </button>

        <form
          action={formAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                "Soumettre ce besoin à l'Administrateur Général ? Vous ne pourrez plus le modifier ensuite."
              )
            )
              e.preventDefault();
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "…" : "Soumettre à l'AG"}
          </button>
        </form>

        {state && !state.ok && (
          <p className="w-full text-xs font-medium text-ipmd-red">{state.message}</p>
        )}
      </div>

      {editing && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <StaffingRequestForm mode="edit" requestId={request.id} initial={request} options={options} />
        </div>
      )}
    </li>
  );
}
