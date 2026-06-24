"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  setStudentFinance,
  setStudentAccess,
  addPayment,
  addSchedule,
  emailProforma,
} from "@/lib/finance-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import {
  PAYMENT_METHODS,
  PAYMENT_KINDS,
  ACCESS_STATES,
  FINANCIAL_STATUS,
  PAYER_NOTES,
} from "@/lib/finance";
import type { FormResult } from "@/types";

function Feedback({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
      {state.message}
    </p>
  );
}

export function SetFinanceForm({
  studentId,
  registrationFee,
  tuitionDue,
  level,
  discountApplied,
  levels,
}: {
  studentId: string;
  registrationFee: number;
  tuitionDue: number;
  level: string | null;
  discountApplied: boolean;
  levels: { level: string; amount: number }[];
}) {
  const bound = setStudentFinance.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  const [tuition, setTuition] = useState(tuitionDue || 0);

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Frais</h2>
      <Field label="Niveau / programme" htmlFor="f-level">
        <select
          id="f-level"
          name="level"
          defaultValue={level ?? ""}
          onChange={(e) => {
            const m = levels.find((l) => l.level === e.target.value);
            if (m) setTuition(m.amount);
          }}
          className={inputBase}
        >
          <option value="">—</option>
          {levels.map((l) => (
            <option key={l.level} value={l.level}>
              {l.level}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Frais d'inscription (FCFA)" htmlFor="f-reg">
          <input id="f-reg" name="registration_fee" type="number" defaultValue={registrationFee} className={inputBase} />
        </Field>
        <Field label="Scolarité (FCFA)" htmlFor="f-tuition">
          <input
            id="f-tuition"
            name="tuition_due"
            type="number"
            value={tuition}
            onChange={(e) => setTuition(Number(e.target.value))}
            className={inputBase}
          />
        </Field>
      </div>
      <label className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
        <input type="checkbox" name="lump_sum" defaultChecked={discountApplied} className="mt-0.5 h-4 w-4 rounded border-black/20" />
        <span>
          Appliquer la <strong>réduction de 15%</strong> (paiement unique) — sur la scolarité uniquement.
          <span className="block text-[11px] font-normal text-amber-700/80">
            C&apos;est ici qu&apos;on applique la réduction, pas dans « Nouveau paiement ».
          </span>
        </span>
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-black/70">
        <input type="checkbox" name="send_proforma" defaultChecked className="h-4 w-4 rounded border-black/20" />
        📧 Envoyer la facture proforma à l&apos;étudiant / parent
      </label>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer les frais"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function AddPaymentForm({ studentId }: { studentId: string }) {
  const bound = addPayment.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau paiement</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nature" htmlFor="p-kind">
          <select id="p-kind" name="kind" defaultValue="scolarite" className={inputBase}>
            {PAYMENT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Montant (FCFA)" htmlFor="p-amount" required>
          <input id="p-amount" name="amount" type="number" min="1" required placeholder="200000" className={inputBase} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Moyen" htmlFor="p-method" required>
          <select id="p-method" name="method" defaultValue="" required className={inputBase}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" htmlFor="p-date" required>
          <input id="p-date" name="paid_at" type="date" required className={inputBase} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Référence" htmlFor="p-ref">
          <input id="p-ref" name="reference" placeholder="N° transaction / chèque" className={inputBase} />
        </Field>
        <Field label="Libellé" htmlFor="p-label">
          <input id="p-label" name="label" placeholder="Ex. Tranche 1" className={inputBase} />
        </Field>
      </div>
      <Field label="Observation (optionnel)" htmlFor="p-obs">
        <input id="p-obs" name="observation" className={inputBase} />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer le paiement"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function AddScheduleForm({ studentId }: { studentId: string }) {
  const bound = addSchedule.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle échéance</h2>
      <Field label="Montant (FCFA)" htmlFor="s-amount" required>
        <input id="s-amount" name="amount" type="number" min="1" required placeholder="200000" className={inputBase} />
      </Field>
      <Field label="Date d'échéance" htmlFor="s-date" required>
        <input id="s-date" name="due_date" type="date" required className={inputBase} />
      </Field>
      <Field label="Libellé (optionnel)" htmlFor="s-label">
        <input id="s-label" name="label" placeholder="Ex. Tranche 2" className={inputBase} />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter l'échéance"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function EmailProformaButton({ studentId }: { studentId: string }) {
  const bound = emailProforma.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);
  return (
    <form action={action} className="inline-flex flex-col">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40 disabled:opacity-50"
      >
        {pending ? "Envoi…" : "📧 Envoyer la proforma"}
      </button>
      {state && (
        <span className={`mt-1 text-xs font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

export function AccessForm({
  studentId,
  status,
  accessState,
  negotiated,
  payerNote,
}: {
  studentId: string;
  status: string | null;
  accessState: string;
  negotiated: boolean;
  payerNote?: string | null;
}) {
  const bound = setStudentAccess.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(bound, null);

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Statut & accès</h2>
      <Field label="Statut financier (manuel / négocié)" htmlFor="a-status">
        <select id="a-status" name="status" defaultValue={status ?? ""} className={inputBase}>
          <option value="">Automatique</option>
          {Object.entries(FINANCIAL_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Accès plateforme" htmlFor="a-access">
        <select id="a-access" name="access_state" defaultValue={accessState} className={inputBase}>
          {Object.entries(ACCESS_STATES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Appréciation / Commentaire finance" htmlFor="a-payer">
        <input
          id="a-payer"
          name="payer_note"
          list="payer-notes"
          defaultValue={payerNote ?? ""}
          placeholder="Ex. Bon payeur, À relancer…"
          className={inputBase}
        />
        <datalist id="payer-notes">
          {PAYER_NOTES.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-black/70">
        <input type="checkbox" name="negotiated" defaultChecked={negotiated} className="h-4 w-4 rounded border-black/20" />
        Échéancier négocié
      </label>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Mettre à jour"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}
