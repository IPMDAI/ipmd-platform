"use client";

import { useActionState, useEffect, useRef } from "react";
import { setStudentDue, addPayment, addSchedule } from "@/lib/finance-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { PAYMENT_METHODS } from "@/lib/finance";
import type { FormResult } from "@/types";

function Feedback({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return (
    <p
      className={`text-sm font-medium ${
        state.ok ? "text-green-600" : "text-ipmd-red"
      }`}
    >
      {state.message}
    </p>
  );
}

export function SetDueForm({
  studentId,
  current,
}: {
  studentId: string;
  current: number;
}) {
  const bound = setStudentDue.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Frais de scolarité</h2>
      <Field label="Montant total dû (FCFA)" htmlFor="d-due" required>
        <input
          id="d-due"
          name="total_due"
          type="number"
          min="0"
          step="1000"
          defaultValue={current || ""}
          placeholder="800000"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer les frais"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function AddPaymentForm({ studentId }: { studentId: string }) {
  const bound = addPayment.bind(null, studentId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouveau paiement</h2>
      <Field label="Montant (FCFA)" htmlFor="p-amount" required>
        <input
          id="p-amount"
          name="amount"
          type="number"
          min="1"
          step="1000"
          required
          placeholder="200000"
          className={inputBase}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Moyen" htmlFor="p-method">
          <select id="p-method" name="method" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" htmlFor="p-date">
          <input id="p-date" name="paid_at" type="date" className={inputBase} />
        </Field>
      </div>
      <Field label="Libellé (optionnel)" htmlFor="p-label">
        <input
          id="p-label"
          name="label"
          placeholder="Ex. Tranche 1"
          className={inputBase}
        />
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
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle échéance</h2>
      <Field label="Montant (FCFA)" htmlFor="s-amount" required>
        <input
          id="s-amount"
          name="amount"
          type="number"
          min="1"
          step="1000"
          required
          placeholder="200000"
          className={inputBase}
        />
      </Field>
      <Field label="Date d'échéance" htmlFor="s-date" required>
        <input id="s-date" name="due_date" type="date" required className={inputBase} />
      </Field>
      <Field label="Libellé (optionnel)" htmlFor="s-label">
        <input
          id="s-label"
          name="label"
          placeholder="Ex. Tranche 2"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter l'échéance"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}
