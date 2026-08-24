"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/finance";
import { submitPaymentProof } from "@/lib/payment-proof-actions";
import { PROOF_METHODS, PROOF_ACCEPT } from "@/lib/payment-proof";
import { inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

/**
 * Dépôt de preuve de paiement (W2) dans le pack candidat.
 * - preuve `a_verifier` en cours → état « en cours de vérification » (pas de 2e dépôt) ;
 * - `valide` → paiement validé ; `rejete` → motif + nouveau dépôt possible ;
 * - sinon → formulaire (Wave / Orange Money / versement / virement AFG ; Espèces exclu).
 * ⚠️ L'envoi d'une preuve ne valide jamais le paiement (contrôle admin requis).
 */
export function PaymentProofStep({
  token,
  registrationFee,
  proofStatus = null,
  reviewNote = null,
}: {
  token: string;
  registrationFee: number;
  proofStatus?: "a_verifier" | "valide" | "rejete" | null;
  reviewNote?: string | null;
}) {
  const router = useRouter();
  const bound = submitPaymentProof.bind(null, token);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  // Après un dépôt réussi : masquer immédiatement le formulaire (submitted) puis
  // resynchroniser l'état serveur (proofStatus deviendra "a_verifier").
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (state?.ok) {
      setSubmitted(true);
      router.refresh();
    }
  }, [state, router]);

  if (proofStatus === "valide") {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        ✅ Paiement des frais d'inscription validé par la scolarité.
      </p>
    );
  }

  if (proofStatus === "a_verifier" || submitted) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
        ⏳ <strong>Preuve reçue — en cours de vérification par la scolarité.</strong> L'envoi d'un
        justificatif ne signifie pas que le paiement est encore validé.
      </p>
    );
  }

  return (
    <form action={action} className="rounded-xl bg-white px-4 py-4 ring-1 ring-black/10">
      <p className="text-sm font-bold text-ipmd-black">J'ai effectué mon paiement</p>
      <p className="mt-0.5 text-[12px] text-black/55">
        Frais d'inscription : <strong>{formatFCFA(registrationFee)}</strong>. Renseignez votre
        paiement et joignez le justificatif ; la scolarité le vérifiera.
      </p>

      {proofStatus === "rejete" && (
        <p className="mt-3 rounded-lg bg-ipmd-red/10 px-3 py-2 text-[12px] font-medium text-ipmd-red ring-1 ring-ipmd-red/20">
          ❌ Preuve précédente rejetée{reviewNote ? ` : ${reviewNote}` : ""}. Merci d'en envoyer une nouvelle.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        <label className="text-xs font-semibold text-black/55">
          Moyen de paiement
          <select name="method" required defaultValue="" className={`${inputBase} mt-1 py-2 text-sm`}>
            <option value="" disabled>
              — choisir —
            </option>
            {PROOF_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold text-black/55">
          Montant déclaré (FCFA)
          <input
            name="amount"
            type="number"
            min="1"
            required
            placeholder="300000"
            className={`${inputBase} mt-1 py-2 text-sm`}
          />
        </label>

        <label className="text-xs font-semibold text-black/55">
          Référence / n° de transaction
          <input
            name="reference"
            type="text"
            placeholder="ID transaction Wave / OM / avis AFG"
            className={`${inputBase} mt-1 py-2 text-sm`}
          />
        </label>

        <label className="text-xs font-semibold text-black/55">
          Justificatif (PDF, JPG ou PNG — max 8 Mo)
          <input
            name="file"
            type="file"
            accept={PROOF_ACCEPT}
            required
            className="mt-1 block w-full text-sm text-black/70 file:mr-3 file:rounded-full file:border-0 file:bg-ipmd-black file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-full bg-ipmd-red px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer ma preuve de paiement"}
      </button>

      <p className="mt-2 text-[11px] leading-relaxed text-black/45">
        ⚠️ L'envoi d'un justificatif ne valide pas le paiement : la scolarité contrôle chaque preuve
        avant confirmation.
      </p>

      {state && (
        <p className={`mt-2 text-[12px] font-medium ${state.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
