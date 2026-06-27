"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createFiliere,
  createClasse,
  createRoom,
} from "@/lib/referentiel-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { NIVEAUX } from "@/lib/referentiel";
import { CLASS_TYPES, PAYMENT_REGIMES, CLASS_KINDS, FORMATION_MODES, INSTALLMENT_OPTIONS } from "@/lib/academic";
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

export function NewFiliereForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createFiliere,
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle filière</h2>
      <Field label="Nom de la filière" htmlFor="f-name" required>
        <input
          id="f-name"
          name="name"
          required
          placeholder="Ex. Marketing digital"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter la filière"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function NewClasseForm({
  filieres,
}: {
  filieres: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createClasse,
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle classe</h2>
      <Field label="Nom de la classe" htmlFor="c-name" required>
        <input
          id="c-name"
          name="name"
          required
          placeholder="Ex. Licence 1 Marketing"
          className={inputBase}
        />
      </Field>
      <Field label="Filière" htmlFor="c-filiere">
        <select id="c-filiere" name="filiere_id" defaultValue="" className={inputBase}>
          <option value="">— Aucune —</option>
          {filieres.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" htmlFor="c-level">
          <select id="c-level" name="level" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Année" htmlFor="c-year">
          <input
            id="c-year"
            name="academic_year"
            placeholder="2025-2026"
            className={inputBase}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nature" htmlFor="c-kind">
          <select id="c-kind" name="kind" defaultValue="diplome" className={inputBase}>
            {CLASS_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mode" htmlFor="c-mode">
          <select id="c-mode" name="mode" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {FORMATION_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Rentrée / session" htmlFor="c-intake">
          <input id="c-intake" name="intake" placeholder="Ex. Octobre 2025" className={inputBase} />
        </Field>
        <Field label="Type de classe" htmlFor="c-type">
          <select id="c-type" name="class_type" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {CLASS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Nom du partenaire (si partenaire académique)" htmlFor="c-partner">
        <input id="c-partner" name="partner_name" placeholder="Ex. Académie X" className={inputBase} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de début" htmlFor="c-start">
          <input id="c-start" name="start_date" type="date" className={inputBase} />
        </Field>
        <Field label="Date de fin prévue" htmlFor="c-end">
          <input id="c-end" name="end_date" type="date" className={inputBase} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Régime de paiement" htmlFor="c-regime">
          <select id="c-regime" name="payment_regime" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {PAYMENT_REGIMES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tarif scolarité (FCFA, optionnel)" htmlFor="c-tuition">
          <input id="c-tuition" name="tuition_amount" type="number" min="0" placeholder="sinon tarif du niveau" className={inputBase} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Frais d'inscription (FCFA — bootcamp : 0 si aucun)" htmlFor="c-reg">
          <input id="c-reg" name="registration_fee" type="number" min="0" placeholder="sinon frais global" className={inputBase} />
        </Field>
        <Field label="Paiement en (versements)" htmlFor="c-inst">
          <select id="c-inst" name="installments" defaultValue="1" className={inputBase}>
            {INSTALLMENT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} fois
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter la classe"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}

export function NewRoomForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createRoom,
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
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle salle</h2>
      <Field label="Nom de la salle" htmlFor="r-name" required>
        <input
          id="r-name"
          name="name"
          required
          placeholder="Ex. Salle A2"
          className={inputBase}
        />
      </Field>
      <Field label="Capacité (optionnel)" htmlFor="r-cap">
        <input
          id="r-cap"
          name="capacity"
          type="number"
          min="1"
          placeholder="30"
          className={inputBase}
        />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Ajouter la salle"}
      </ActionButton>
      <Feedback state={state} />
    </form>
  );
}
