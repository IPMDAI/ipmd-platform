"use client";

import { useActionState, useRef, useEffect } from "react";
import { addProspect } from "@/lib/prospect-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { NIVEAUX } from "@/lib/referentiel";
import { PROSPECT_FORMATS, PROSPECT_SOURCES } from "@/lib/prospect";
import type { FormResult } from "@/types";

export function AddProspectForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(addProspect, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <details className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <summary className="cursor-pointer text-sm font-bold text-ipmd-black">➕ Ajouter un prospect (manuel)</summary>
      <form ref={ref} action={action} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom & prénom" htmlFor="ap-name" required>
            <input id="ap-name" name="full_name" required placeholder="Aude-Lucrèce Kouamé" className={inputBase} />
          </Field>
          <Field label="Email" htmlFor="ap-email">
            <input id="ap-email" name="email" type="email" placeholder="vous@email.com" className={inputBase} />
          </Field>
          <Field label="Téléphone" htmlFor="ap-phone">
            <input id="ap-phone" name="phone" placeholder="+225 07…" className={inputBase} />
          </Field>
          <Field label="WhatsApp" htmlFor="ap-wa">
            <input id="ap-wa" name="whatsapp" placeholder="+225 07…" className={inputBase} />
          </Field>
          <Field label="Programme visé" htmlFor="ap-prog">
            <input id="ap-prog" name="program_interest" placeholder="Master Communication digitale" className={inputBase} />
          </Field>
          <Field label="Niveau" htmlFor="ap-level">
            <select id="ap-level" name="level_interest" defaultValue="" className={inputBase}>
              <option value="">—</option>
              {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Format" htmlFor="ap-format">
            <select id="ap-format" name="format" defaultValue="" className={inputBase}>
              <option value="">—</option>
              {PROSPECT_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Source" htmlFor="ap-source">
            <select id="ap-source" name="source" defaultValue="manuel" className={inputBase}>
              {PROSPECT_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Message / contexte" htmlFor="ap-msg">
          <textarea id="ap-msg" name="message" rows={2} className={inputBase} />
        </Field>
        <ActionButton type="submit" disabled={pending}>{pending ? "…" : "Ajouter le prospect"}</ActionButton>
        {state && <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>{state.message}</p>}
      </form>
    </details>
  );
}
