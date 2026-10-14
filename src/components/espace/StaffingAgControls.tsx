"use client";

import { useActionState, useState } from "react";
import { decideStaffing, assignStaffing, closeStaffing } from "@/lib/staffing-ag-actions";
import type { FormResult } from "@/types";

type EligibleOption = { id: string; label: string };

const btnBase = "rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60";

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p className={`mt-1 w-full text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
      {state.message}
    </p>
  );
}

/** EN ATTENTE : Valider | Refuser (motif obligatoire). RPC staffing_decide. */
export function DecideControls({ id }: { id: string }) {
  const decide = decideStaffing.bind(null, id);
  const [vState, vAction, vPending] = useActionState<FormResult | null, FormData>(decide, null);
  const [rState, rAction, rPending] = useActionState<FormResult | null, FormData>(decide, null);
  const [refusing, setRefusing] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={vAction}>
          <input type="hidden" name="approve" value="true" />
          <button type="submit" disabled={vPending} className={`${btnBase} bg-green-600 text-white`}>
            {vPending ? "…" : "✓ Valider"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setRefusing((v) => !v)}
          className={`${btnBase} ring-1 ring-ipmd-red/40 text-ipmd-red hover:bg-ipmd-red/5`}
        >
          {refusing ? "Annuler" : "✕ Refuser"}
        </button>
      </div>

      {refusing && (
        <form action={rAction} className="flex flex-col gap-2 rounded-lg bg-ipmd-red/5 p-2">
          <label className="text-xs font-semibold text-black/60">
            Motif du refus (obligatoire)
            <textarea
              name="reason"
              required
              rows={2}
              placeholder="Ex. budget indisponible cette année"
              className="mt-0.5 w-full rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-ipmd-red focus:outline-none"
            />
          </label>
          <input type="hidden" name="approve" value="false" />
          <button type="submit" disabled={rPending} className={`${btnBase} self-start bg-ipmd-red text-white`}>
            {rPending ? "…" : "Confirmer le refus"}
          </button>
        </form>
      )}
      <Msg state={vState} />
      <Msg state={rState} />
    </div>
  );
}

/** VALIDÉE : affecter un profil éligible (select) + clôturer. RPC staffing_assign/close. */
export function AssignControls({ id, eligible }: { id: string; eligible: EligibleOption[] }) {
  const assign = assignStaffing.bind(null, id);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(assign, null);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-black/60">
          Affecter (profils éligibles seulement)
          <select
            name="profile_id"
            required
            defaultValue=""
            className="mt-0.5 block min-w-[220px] rounded-lg border border-black/15 bg-white px-2 py-1.5 text-sm focus:border-ipmd-red focus:outline-none"
          >
            <option value="" disabled>— Choisir un profil —</option>
            {eligible.map((e) => (
              <option key={e.id} value={e.id}>{e.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className={`${btnBase} bg-ipmd-black text-white`}>
          {pending ? "…" : "Affecter"}
        </button>
      </form>
      {eligible.length === 0 && (
        <p className="text-xs text-black/50">
          Aucun profil éligible pour l&apos;instant : recrutez d&apos;abord via le module
          recrutement, puis revenez affecter. Le besoin reste « Validée ».
        </p>
      )}
      <Msg state={state} />
      <CloseButton id={id} label="Clôturer ce besoin" />
    </div>
  );
}

/** Clôturer un besoin (transitions D6-1). RPC staffing_close. */
export function CloseButton({ id, label = "Clôturer" }: { id: string; label?: string }) {
  const close = closeStaffing.bind(null, id);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(close, null);
  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!window.confirm("Clôturer ce besoin ?")) e.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className={`${btnBase} ring-1 ring-black/15 text-black/60 hover:bg-black/5`}
        >
          {pending ? "…" : label}
        </button>
      </form>
      <Msg state={state} />
    </div>
  );
}
