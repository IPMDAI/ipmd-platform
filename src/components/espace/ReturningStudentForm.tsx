"use client";

import { useActionState } from "react";
import { createReturningStudent } from "@/lib/user-admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

type ClassOpt = { id: string; name: string; intake: string | null };

export function ReturningStudentForm({
  classes,
  levels,
}: {
  classes: ClassOpt[];
  levels: string[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createReturningStudent,
    null
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Reprendre un étudiant</h2>
      <p className="text-xs text-black/50">
        Crée le compte, l&apos;affecte à une cohorte, fixe ses frais et enregistre ce qu&apos;il a
        <strong> déjà payé</strong> — en une fois.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom & prénom" htmlFor="rs-name" required>
          <input id="rs-name" name="full_name" required placeholder="Aya Brou" className={inputBase} />
        </Field>
        <Field label="Email" htmlFor="rs-email" required>
          <input id="rs-email" name="email" type="email" required placeholder="aya@email.com" className={inputBase} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" htmlFor="rs-level">
          <select id="rs-level" name="level" defaultValue="" className={inputBase}>
            <option value="">—</option>
            {levels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Formation (optionnel)" htmlFor="rs-prog">
          <input id="rs-prog" name="program" placeholder="Communication digitale" className={inputBase} />
        </Field>
      </div>

      <Field label="Classe / cohorte (optionnel)" htmlFor="rs-class">
        <select id="rs-class" name="class_id" defaultValue="" className={inputBase}>
          <option value="">— Aucune —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.intake ? ` · ${c.intake}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Montant déjà payé (report antérieur, FCFA)" htmlFor="rs-paid">
        <input id="rs-paid" name="paid_amount" type="number" min="0" defaultValue="0" className={inputBase} />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium text-black/70">
        <input type="checkbox" name="lump_sum" className="h-4 w-4 rounded border-black/20" />
        Réduction 15% (paiement unique de la scolarité)
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-black/70">
        <input type="checkbox" name="send_email" defaultChecked className="h-4 w-4 rounded border-black/20" />
        📧 Envoyer le lien « définir mot de passe » + sa situation
      </label>

      <ActionButton type="submit" disabled={pending}>
        {pending ? "Reprise…" : "Reprendre l'étudiant"}
      </ActionButton>

      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
