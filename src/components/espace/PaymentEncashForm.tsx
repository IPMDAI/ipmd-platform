"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { encashPaymentProof } from "@/lib/payment-encash-actions";
import { PAYMENT_METHODS, formatFCFA } from "@/lib/finance";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

/**
 * Formulaire d'encaissement (W4) d'une preuve validée. Pré-rempli depuis la
 * preuve mais MODIFIABLE (montant réellement reçu, méthode, référence, date
 * réelle). Anti double-clic (bouton désactivé pendant l'envoi) ; la RPC garantit
 * l'idempotence (une preuve déjà encaissée est refusée). Aucun email, aucun effet
 * `student_finance`/`access`/`statut`.
 */
export function PaymentEncashForm({
  proofId,
  defaultAmount,
  defaultMethod,
  defaultReference,
  today,
}: {
  proofId: string;
  defaultAmount: number;
  defaultMethod: string | null;
  defaultReference: string | null;
  today: string;
}) {
  const router = useRouter();
  const bound = encashPaymentProof.bind(null, proofId);
  const [state, action, pending] = useActionState<
    (FormResult & { paymentId?: string }) | null,
    FormData
  >(bound, null);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const amt = String(fd.get("amount") ?? "");
        if (!window.confirm(`Enregistrer l'encaissement de ${amt} FCFA ? (montant réellement reçu)`)) {
          e.preventDefault();
        }
      }}
      className="mt-3 grid gap-2 rounded-xl bg-ipmd-light p-3 sm:grid-cols-2"
    >
      <label className="text-[11px] font-semibold text-black/55">
        Montant réellement reçu (FCFA)
        <input
          name="amount"
          type="number"
          min="1"
          required
          defaultValue={defaultAmount}
          className={`${inputBase} mt-1 py-1.5 text-sm`}
        />
      </label>

      <label className="text-[11px] font-semibold text-black/55">
        Méthode
        <select
          name="method"
          required
          defaultValue={defaultMethod ?? ""}
          className={`${inputBase} mt-1 py-1.5 text-sm`}
        >
          <option value="" disabled>
            — choisir —
          </option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <label className="text-[11px] font-semibold text-black/55">
        Référence / n° transaction
        <input
          name="reference"
          type="text"
          defaultValue={defaultReference ?? ""}
          placeholder="ID Wave / OM / avis AFG"
          className={`${inputBase} mt-1 py-1.5 text-sm`}
        />
      </label>

      <label className="text-[11px] font-semibold text-black/55">
        Date réelle d'encaissement
        <input
          name="paid_at"
          type="date"
          required
          defaultValue={today}
          className={`${inputBase} mt-1 py-1.5 text-sm`}
        />
      </label>

      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "💰 Enregistrer l'encaissement"}
        </button>
        <span className="text-[11px] text-black/45">
          Montant déclaré : {formatFCFA(defaultAmount)} · modifiable ci-dessus
        </span>
        {state && (
          <span className={`text-[12px] font-medium ${state.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
            {state.message}
            {state.ok && state.paymentId ? (
              <>
                {" "}
                <a
                  href={`/espace/recu/${state.paymentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Voir le reçu ↗
                </a>
              </>
            ) : null}
          </span>
        )}
      </div>
    </form>
  );
}
