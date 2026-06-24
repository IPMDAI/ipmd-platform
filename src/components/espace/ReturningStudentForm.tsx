"use client";

import { useActionState, useState } from "react";
import { createReturningStudent } from "@/lib/user-admin-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { formatFCFA } from "@/lib/finance";
import type { FormResult } from "@/types";

type ClassOpt = { id: string; name: string; intake: string | null; tuition: number | null };

export function ReturningStudentForm({
  classes,
  levels,
  levelTuition,
  registrationFee,
}: {
  classes: ClassOpt[];
  levels: string[];
  levelTuition: Record<string, number>;
  registrationFee: number;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createReturningStudent,
    null
  );

  const [level, setLevel] = useState("");
  const [classId, setClassId] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [paid, setPaid] = useState(0);

  // Récap live (tarif de la classe prioritaire, sinon tarif du niveau).
  const cls = classes.find((c) => c.id === classId) ?? null;
  const tuitionBrut = cls?.tuition != null ? cls.tuition : levelTuition[level] ?? 0;
  const rate = Math.min(100, Math.max(0, discountPct)) / 100;
  const reduction = Math.round(tuitionBrut * rate);
  const tuitionNet = tuitionBrut - reduction;
  const totalDue = registrationFee + tuitionNet;
  const reste = totalDue - paid;
  const inscriptionSettled = registrationFee > 0 ? Math.min(paid, registrationFee) >= registrationFee : true;

  const Line = ({ label, value, strong, cls: c }: { label: string; value: string; strong?: boolean; cls?: string }) => (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-black/55">{label}</span>
      <span className={`${strong ? "font-bold" : "font-medium"} ${c ?? "text-ipmd-black"}`}>{value}</span>
    </div>
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    const nom = (fd.get("full_name") as string)?.trim() || "cet étudiant";
    const ok = window.confirm(
      `Confirmer la reprise de ${nom} ?\n\n` +
        `Total dû (après réduction) : ${totalDue.toLocaleString("fr-FR")} FCFA\n` +
        `Report antérieur déjà payé : ${paid.toLocaleString("fr-FR")} FCFA\n` +
        `Reste à payer : ${(reste <= 0 ? 0 : reste).toLocaleString("fr-FR")} FCFA\n` +
        `Accès : ${inscriptionSettled ? "actif" : "en pause (inscription non soldée)"}`
    );
    if (!ok) e.preventDefault();
  };

  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="text-lg font-bold text-ipmd-black">Reprendre un étudiant</h2>
      <p className="text-xs text-black/50">
        Compte + cohorte + frais + <strong>report antérieur</strong> en une fois.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nom & prénom" htmlFor="rs-name" required>
          <input id="rs-name" name="full_name" required placeholder="Aya Brou" className={inputBase} />
        </Field>
        <Field label="Email de connexion (compte)" htmlFor="rs-email" required>
          <input id="rs-email" name="email" type="email" required placeholder="aya@email.com" className={inputBase} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Téléphone" htmlFor="rs-phone">
          <input id="rs-phone" name="phone" placeholder="+225 0700000000" className={inputBase} />
        </Field>
        <Field label="WhatsApp" htmlFor="rs-wa">
          <input id="rs-wa" name="whatsapp" placeholder="+225 0700000000" className={inputBase} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email personnel" htmlFor="rs-pe">
          <input id="rs-pe" name="personal_email" type="email" placeholder="perso@email.com" className={inputBase} />
        </Field>
        <Field label="Email IPMD attribué" htmlFor="rs-se">
          <input id="rs-se" name="school_email" type="email" placeholder="prenom.nom@ipmd.pro" className={inputBase} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Niveau" htmlFor="rs-level">
          <select id="rs-level" name="level" value={level} onChange={(e) => setLevel(e.target.value)} className={inputBase}>
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

      <Field label="Classe / cohorte (optionnel — son tarif prime sur le niveau)" htmlFor="rs-class">
        <select id="rs-class" name="class_id" value={classId} onChange={(e) => setClassId(e.target.value)} className={inputBase}>
          <option value="">— Aucune —</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.intake ? ` · ${c.intake}` : ""}{c.tuition != null ? ` · tarif ${c.tuition.toLocaleString("fr-FR")}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Réduction scolarité (%)" htmlFor="rs-disc">
          <input
            id="rs-disc"
            name="discount_pct"
            type="number"
            min="0"
            max="100"
            value={discountPct || ""}
            onChange={(e) => setDiscountPct(Number(e.target.value))}
            placeholder="0"
            className={inputBase}
          />
          <p className="mt-1 text-[11px] text-amber-700">
            Sur la scolarité uniquement — jamais sur l&apos;inscription.
          </p>
        </Field>
        <Field label="Report antérieur — déjà payé (FCFA)" htmlFor="rs-paid">
          <input
            id="rs-paid"
            name="paid_amount"
            type="number"
            min="0"
            value={paid || ""}
            onChange={(e) => setPaid(Number(e.target.value))}
            placeholder="0"
            className={inputBase}
          />
        </Field>
      </div>

      {/* Récapitulatif live */}
      <div className="rounded-xl bg-ipmd-light px-4 py-3 text-xs">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-black/40">Récapitulatif</p>
        <Line label="Frais d'inscription" value={formatFCFA(registrationFee)} />
        <Line label="Frais de scolarité (brut)" value={formatFCFA(tuitionBrut)} />
        <Line label="Réduction scolarité (%)" value={`${discountPct || 0} %`} cls="text-amber-600" />
        <Line label="Montant de la réduction" value={`−${formatFCFA(reduction)}`} cls="text-amber-600" />
        <Line label="Total dû (après réduction)" value={formatFCFA(totalDue)} strong />
        <Line label="Report antérieur déjà payé" value={formatFCFA(paid)} cls="text-green-700" />
        <Line label="Reste à payer" value={reste <= 0 ? "Soldé" : formatFCFA(reste)} strong cls={reste <= 0 ? "text-green-600" : "text-ipmd-red"} />
        <p className="mt-1.5 text-[10px] italic text-black/40">
          La réduction s&apos;applique uniquement sur les frais de scolarité, jamais sur les frais d&apos;inscription.
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 border-t border-black/10 pt-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${inscriptionSettled ? "bg-blue-50 text-blue-700" : "bg-ipmd-red/10 text-ipmd-red"}`}>
            {inscriptionSettled ? "Inscription soldée" : "Inscription non soldée"}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${inscriptionSettled ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {inscriptionSettled ? "Accès actif" : "Accès en pause"}
          </span>
        </div>
      </div>

      <Field label="Action" htmlFor="rs-mode">
        <select id="rs-mode" name="send_mode" defaultValue="create_only" className={inputBase}>
          <option value="create_only">Créer le dossier seulement (sans email)</option>
          <option value="create_send">Créer le dossier et envoyer l&apos;email</option>
        </select>
      </Field>

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
