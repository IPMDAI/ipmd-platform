"use client";

import { useState, useTransition } from "react";
import { formatFCFA } from "@/lib/finance";
import { repairPackSchedule, type RepairScheduleSummary } from "@/lib/candidature-actions";

/**
 * Réparation LEGACY de l'échéancier (Lot Finance F4b). Affiché sur la fiche
 * candidature d'un pack DIPLÔMANT (tuition_due connu) :
 *  • échéancier valide présent → ✅ « Échéancier financier prêt » (aucun bouton) ;
 *  • échéancier manquant/invalide → ⚠️ + bouton « Générer l'échéancier financier ».
 *
 * Au clic (après confirmation) : appelle `repairPackSchedule` (SANS force) qui
 * génère UNIQUEMENT `admission_packs.schedule_json` — aucun email, aucune lettre,
 * aucun changement de statut, aucun compte/matricule, aucun student_finance ni
 * payment_schedules. Le résumé de l'échéancier généré s'affiche ensuite.
 */
export function ScheduleRepair({
  candidatureId,
  ready,
}: {
  candidatureId: string;
  ready: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<RepairScheduleSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Échéancier déjà prêt (et pas encore réparé dans cette session) → badge simple.
  if (ready && !done) {
    return (
      <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        ✅ Échéancier financier prêt
      </p>
    );
  }

  // Succès de génération → résumé.
  if (done) {
    const optLabel = done.paymentOption === "comptant" ? "Comptant" : "Échelonné";
    const chip = "rounded-full bg-white px-2.5 py-1 text-black/60 ring-1 ring-black/10";
    return (
      <div className="mt-3 rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
        <p className="text-[12px] font-bold text-emerald-700">
          ✅ Échéancier financier généré — aucun email envoyé.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
          <span className={chip}>Année : {done.academicYear ?? "—"}</span>
          <span className={chip}>Niveau : {done.level ?? "—"}</span>
          <span className={chip}>Scolarité officielle : {formatFCFA(done.tuitionOfficial)}</span>
          <span className={chip}>Paiement : {optLabel}</span>
          <span className={chip}>Tranches : {done.installments}</span>
          <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-white">
            Total : {formatFCFA(done.total)}
          </span>
        </div>
      </div>
    );
  }

  // Échéancier manquant → avertissement + bouton.
  const generate = () => {
    if (pending) return;
    const ok = window.confirm(
      "Générer l'échéancier financier pour ce pack ?\n\n" +
        "• Utilise les frais déjà figés du pack (aucun recalcul).\n" +
        "• Aucun email ni lettre ne sera envoyé.\n" +
        "• Aucun changement de statut, de compte ni de matricule.\n" +
        "• N'écrit que l'échéancier (admission_packs.schedule_json)."
    );
    if (!ok) return;
    setErr(null);
    startTransition(async () => {
      const res = await repairPackSchedule(candidatureId);
      if (res.ok && res.schedule) setDone(res.schedule);
      else setErr(res.message);
    });
  };

  return (
    <div className="mt-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200">
      <p className="text-[12px] font-bold text-amber-800">⚠️ Échéancier financier manquant</p>
      <p className="mt-0.5 text-[11px] text-amber-700">
        Ce pack diplômant n'a pas d'échéancier de scolarité figé : la finalisation de
        l'inscription est bloquée tant qu'il n'est pas généré.
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="mt-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Génération…" : "🧾 Générer l'échéancier financier"}
      </button>
      {err && <p className="mt-2 text-[12px] font-medium text-ipmd-red">{err}</p>}
    </div>
  );
}
