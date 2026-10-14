"use client";

import { useActionState, useRef } from "react";
import { createHostCompany } from "@/lib/internship-actions";
import type { FormResult } from "@/types";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";
const label = "block text-xs font-semibold text-black/60 mb-1";

/** Création d'une entreprise d'accueil (fiche opérationnelle). */
export function HostCompanyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(
    async (prev, fd) => {
      const r = await createHostCompany(prev, fd);
      if (r.ok) formRef.current?.reset();
      return r;
    },
    null
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className={label}>Nom de l&apos;entreprise *</label>
        <input name="name" required className={field} placeholder="Ex. Société Générale CI" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Secteur</label>
          <input name="sector" className={field} placeholder="Banque, BTP, ONG…" />
        </div>
        <div>
          <label className={label}>Ville</label>
          <input name="city" className={field} placeholder="Abidjan" />
        </div>
        <div>
          <label className={label}>Pays</label>
          <input name="country" className={field} placeholder="Côte d'Ivoire" />
        </div>
        <div>
          <label className={label}>Site web</label>
          <input name="website" className={field} placeholder="https://…" />
        </div>
      </div>
      <div>
        <label className={label}>Adresse</label>
        <input name="address" className={field} placeholder="Rue, quartier, BP…" />
      </div>
      <div>
        <label className={label}>Notes internes (non visibles par l&apos;étudiant)</label>
        <textarea name="notes" rows={2} className={field} placeholder="Contact, remarques opérationnelles…" />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-ipmd-red px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Créer l'entreprise"}
        </button>
        {state && (
          <p className={`text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
