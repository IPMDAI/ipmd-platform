"use client";

import { Field, inputBase } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { PAYER_RELATIONSHIPS } from "@/lib/payment-payer";

export type LinkedParent = {
  id: string;
  name: string;
  email: string | null;
  relationship: string | null;
};

/**
 * Bloc PAYEUR (tous moyens) + détails techniques conditionnels (Chèque / Wave).
 * Réutilisé par la saisie manuelle ET l'encaissement W4 (champs identiques).
 * Pré-remplissage facultatif depuis un parent déjà lié (le snapshot est de toute
 * façon stocké sur le paiement -> renvois indépendants de parent_links).
 */
export function PayerPaymentFields({
  method,
  linkedParents,
}: {
  method: string;
  linkedParents?: LinkedParent[];
}) {
  const isCheque = method === "Chèque";
  const isWave = method === "Wave";
  const payerRequired = isCheque || isWave;

  const prefill = (p?: LinkedParent) => {
    const set = (id: string, v: string) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = v;
    };
    set("pf-payer-name", p?.name ?? "");
    set("pf-payer-email", p?.email ?? "");
    set("pf-payer-rel", p?.relationship ?? "");
  };

  return (
    <div className="space-y-3 rounded-xl bg-black/[0.02] p-3 ring-1 ring-black/5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-black/45">
        Payeur
      </p>

      {linkedParents && linkedParents.length > 0 && (
        <Field label="Pré-remplir depuis un parent lié" htmlFor="pf-prefill">
          <select
            id="pf-prefill"
            defaultValue=""
            onChange={(e) =>
              prefill(linkedParents.find((p) => p.id === e.target.value))
            }
            className={inputBase}
          >
            <option value="">— Saisie manuelle —</option>
            {linkedParents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.email ? ` · ${p.email}` : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom du payeur" htmlFor="pf-payer-name" required={payerRequired}>
          <input
            id="pf-payer-name"
            name="payer_name"
            required={payerRequired}
            placeholder="Ex. HOIMIAN Agénor Jean Claude"
            className={inputBase}
          />
        </Field>
        <Field label="Qualité du payeur" htmlFor="pf-payer-rel" required={payerRequired}>
          <select
            id="pf-payer-rel"
            name="payer_relationship"
            defaultValue=""
            required={payerRequired}
            className={inputBase}
          >
            <option value="">—</option>
            {PAYER_RELATIONSHIPS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email du payeur (copie du reçu)" htmlFor="pf-payer-email">
          <input
            id="pf-payer-email"
            name="payer_email"
            type="email"
            placeholder="pour recevoir le reçu"
            className={inputBase}
          />
        </Field>
        <Field label="Téléphone du payeur" htmlFor="pf-payer-phone">
          <PhoneField id="pf-payer-phone" name="payer_phone" />
        </Field>
      </div>

      {isCheque && (
        <div className="space-y-3 border-t border-black/5 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Détails chèque
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Chèque émis par" htmlFor="pf-cheque-drawer" required>
              <input id="pf-cheque-drawer" name="cheque_drawer" required placeholder="Signataire du chèque" className={inputBase} />
            </Field>
            <Field label="Banque / établissement payeur" htmlFor="pf-cheque-bank" required>
              <input id="pf-cheque-bank" name="cheque_bank" required placeholder="Ex. SIB" className={inputBase} />
            </Field>
          </div>
          <Field label="N° du chèque (si disponible)" htmlFor="pf-cheque-number">
            <input id="pf-cheque-number" name="cheque_number" placeholder="N° inscrit sur le chèque" className={inputBase} />
          </Field>
        </div>
      )}

      {isWave && (
        <div className="space-y-3 border-t border-black/5 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            Détails Wave
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numéro Wave du payeur" htmlFor="pf-wave-number" required>
              <PhoneField id="pf-wave-number" name="wave_payer_number" required />
            </Field>
            <Field label="ID / réf. transaction Wave" htmlFor="pf-wave-tx" required>
              <input id="pf-wave-tx" name="wave_transaction_id" required placeholder="ID transaction (rapprochement)" className={inputBase} />
            </Field>
          </div>
          <Field label="Compte marchand / destination (optionnel)" htmlFor="pf-wave-merchant">
            <input id="pf-wave-merchant" name="wave_merchant" placeholder="Si plusieurs comptes Wave IPMD" className={inputBase} />
          </Field>
        </div>
      )}
    </div>
  );
}
