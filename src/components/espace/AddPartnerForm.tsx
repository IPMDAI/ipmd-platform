"use client";

import { useActionState, useRef, useEffect } from "react";
import { createPartner } from "@/lib/partner-actions";
import { PARTNER_CATEGORIES } from "@/lib/partners";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export function AddPartnerForm() {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(createPartner, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <details className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <summary className="cursor-pointer text-sm font-bold text-ipmd-black">➕ Ajouter un partenaire</summary>
      <form ref={ref} action={action} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom du partenaire" htmlFor="ap-name" required>
            <input id="ap-name" name="name" required placeholder="Ex. MBS Montpellier Business School" className={inputBase} />
          </Field>
          <Field label="Catégorie" htmlFor="ap-cat">
            <select id="ap-cat" name="category" defaultValue="academique" className={inputBase}>
              {PARTNER_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.short}</option>)}
            </select>
          </Field>
          <Field label="Site web (optionnel)" htmlFor="ap-web">
            <input id="ap-web" name="website" placeholder="https://…" className={inputBase} />
          </Field>
        </div>
        <Field label="Description (optionnel)" htmlFor="ap-desc">
          <textarea id="ap-desc" name="description" rows={2} placeholder="Nature du partenariat…" className={inputBase} />
        </Field>
        <p className="text-xs text-black/45">💡 Le logo s&apos;ajoute après création, en dépliant la fiche du partenaire.</p>
        <ActionButton type="submit" disabled={pending}>{pending ? "…" : "Ajouter le partenaire"}</ActionButton>
        {state && <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>{state.message}</p>}
      </form>
    </details>
  );
}
