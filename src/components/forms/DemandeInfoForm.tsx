"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitProspect } from "@/lib/prospect-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { PhoneField } from "@/components/forms/PhoneField";
import { ActionButton } from "@/components/ui/Button";
import { NIVEAUX, IPMD_FILIERES } from "@/lib/referentiel";
import { PROSPECT_FORMATS } from "@/lib/prospect";
import { universes } from "@/data/universes";
import type { FormResult } from "@/types";

const DI_UNIVERSES = universes.filter((u) => u.kind === "diplome" || u.kind === "certificat");

export function DemandeInfoForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(submitProspect, null);
  const ref = useRef<HTMLFormElement>(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (state?.ok) {
      setSent(true);
      ref.current?.reset();
    }
  }, [state]);

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <p className="text-4xl">✅</p>
        <h2 className="mt-3 text-xl font-bold text-ipmd-black">Demande envoyée !</h2>
        <p className="mt-2 text-sm text-black/60">{state?.message}</p>
        <button onClick={() => setSent(false)} className="mt-4 text-sm font-semibold text-ipmd-red hover:underline">
          Envoyer une autre demande
        </button>
      </div>
    );
  }

  return (
    <form ref={ref} action={action} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom & prénom" htmlFor="di-name" required>
          <input id="di-name" name="full_name" required placeholder="Aude-Lucrèce Kouamé" className={inputBase} />
        </Field>
        <Field label="Email" htmlFor="di-email" required>
          <input id="di-email" name="email" type="email" required placeholder="vous@email.com" className={inputBase} />
        </Field>
      </div>
      <Field label="Téléphone / WhatsApp" htmlFor="di-phone" required>
        <PhoneField id="di-phone" name="phone" required />
      </Field>
      <Field label="Univers visé (optionnel)" htmlFor="di-univ">
        <select id="di-univ" name="universe" defaultValue="" className={inputBase}>
          <option value="">— Je ne sais pas encore —</option>
          {DI_UNIVERSES.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Programme qui vous intéresse" htmlFor="di-prog" required>
          <input
            id="di-prog"
            name="program_interest"
            list="di-programmes"
            required
            placeholder="Choisir une filière ou écrire…"
            className={inputBase}
          />
          <datalist id="di-programmes">
            {IPMD_FILIERES.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Field>
        <Field label="Niveau visé" htmlFor="di-level" required>
          <select id="di-level" name="level_interest" defaultValue="" required className={inputBase}>
            <option value="" disabled>—</option>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Format souhaité" htmlFor="di-format" required>
        <select id="di-format" name="format" defaultValue="" required className={inputBase}>
          <option value="" disabled>—</option>
          {PROSPECT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Votre message" htmlFor="di-msg" required>
        <textarea id="di-msg" name="message" rows={3} required placeholder="Votre question, votre parcours…" className={inputBase} />
      </Field>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </ActionButton>
      {state && !state.ok && <p className="text-sm font-medium text-ipmd-red">{state.message}</p>}
    </form>
  );
}
