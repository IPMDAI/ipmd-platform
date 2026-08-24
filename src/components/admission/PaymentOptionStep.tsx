"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/finance";
import { setPaymentOption, setPaymentDay } from "@/lib/admission-actions";
import type { ScheduleSnapshot, PaymentOption, PaymentDay } from "@/lib/admission-schedule";
import { ADMISSION_EXPIRED_MESSAGE } from "@/lib/admission-deadline";

/** Formate une date ISO (YYYY-MM-DD) en JJ/MM/AAAA pour le candidat. */
function frDate(d: string): string {
  const [y, m, j] = d.split("-");
  return j && m && y ? `${j}/${m}/${y}` : d;
}

/**
 * Choix du mode de paiement (F3) : Échelonné (10 tranches) ou Comptant (−15 %
 * sur la scolarité). Le tarif officiel reste toujours affiché. Le choix est
 * persisté dans `admission_packs.schedule_json` via `setPaymentOption` — aucun
 * impact sur `student_finance` (qui n'existe qu'après la finalisation).
 */
export function PaymentOptionStep({
  token,
  schedule,
  registrationFee,
  deadlineText = null,
  deadlineExpired = false,
}: {
  token: string;
  schedule: ScheduleSnapshot | null;
  registrationFee: number;
  deadlineText?: string | null;
  deadlineExpired?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!schedule) {
    return (
      <div className="rounded-xl bg-ipmd-light px-4 py-3 text-xs text-black/55">
        Votre échéancier de scolarité sera disponible ici très prochainement.
      </div>
    );
  }

  const option = schedule.payment_option;
  const day: PaymentDay = schedule.payment_day === "fin_mois" ? "fin_mois" : "20";
  const official = schedule.tuition_official;
  const net = schedule.tuition_net;
  const remise = official - schedule.comptant_amount; // montant de la remise comptant

  const choose = (next: PaymentOption) => {
    if (pending || next === option) return;
    setMsg(null);
    startTransition(async () => {
      const res = await setPaymentOption(token, next);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh(); // recharge le pack avec le snapshot recalculé
    });
  };

  const chooseDay = (next: PaymentDay) => {
    if (pending || next === day) return;
    setMsg(null);
    startTransition(async () => {
      const res = await setPaymentDay(token, next);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh(); // recharge le pack avec les nouvelles dates
    });
  };

  const dayBtn = (val: PaymentDay, title: string, sub: string) => {
    const active = day === val;
    return (
      <button
        type="button"
        onClick={() => chooseDay(val)}
        disabled={pending}
        className={`flex-1 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
          active
            ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/30"
            : "border-black/10 bg-white hover:border-black/25"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ipmd-black">
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-ipmd-red" : "border-black/25"}`}
            aria-hidden="true"
          >
            {active && <span className="h-2 w-2 rounded-full bg-ipmd-red" />}
          </span>
          {title}
        </span>
        <span className="mt-1 block text-[12px] text-black/55">{sub}</span>
      </button>
    );
  };

  const optBtn = (val: PaymentOption, title: string, sub: string) => {
    const active = option === val;
    return (
      <button
        type="button"
        onClick={() => choose(val)}
        disabled={pending}
        className={`flex-1 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
          active
            ? "border-ipmd-red bg-ipmd-red/[0.04] ring-2 ring-ipmd-red/30"
            : "border-black/10 bg-white hover:border-black/25"
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-bold text-ipmd-black">
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active ? "border-ipmd-red" : "border-black/25"}`}
            aria-hidden="true"
          >
            {active && <span className="h-2 w-2 rounded-full bg-ipmd-red" />}
          </span>
          {title}
        </span>
        <span className="mt-1 block text-[12px] text-black/55">{sub}</span>
      </button>
    );
  };

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-black/10">
      {/* Récap tarif officiel → net (jamais d'écrasement du tarif) */}
      <dl className="divide-y divide-black/5 text-sm">
        <div className="flex items-center justify-between gap-4 py-1.5">
          <dt className="text-black/55">Scolarité officielle</dt>
          <dd className="font-semibold text-ipmd-black">{formatFCFA(official)}</dd>
        </div>
        {option === "comptant" && (
          <div className="flex items-center justify-between gap-4 py-1.5">
            <dt className="text-black/55">
              Remise paiement comptant ({Math.round(schedule.lump_sum_discount * 100)} %)
            </dt>
            <dd className="font-semibold text-emerald-700">− {formatFCFA(remise)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 py-1.5">
          <dt className="text-black/55">Scolarité à financer</dt>
          <dd className="font-bold text-ipmd-black">{formatFCFA(net)}</dd>
        </div>
      </dl>

      {/* Choix du mode */}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {optBtn("echelonne", "Paiement échelonné", "10 versements selon l'échéancier")}
        {optBtn(
          "comptant",
          "Paiement comptant",
          `−${Math.round(schedule.lump_sum_discount * 100)} % sur la scolarité · avant le ${frDate(schedule.comptant_deadline)}`
        )}
      </div>

      {/* Choix de la date mensuelle de règlement (D2) */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-black/45">
          Date mensuelle de règlement
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          {dayBtn("20", "Le 20 de chaque mois", "Échéance fixée au 20")}
          {dayBtn("fin_mois", "Fin de mois", "Dernier jour du mois")}
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-black/45">
          Fin de mois = dernier jour calendaire du mois (28/29, 30 ou 31 selon le mois).
        </p>
      </div>

      {msg && (
        <p className={`mt-2 text-[12px] font-medium ${msg.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}

      {/* Échéancier détaillé */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-black/45">
          {option === "comptant" ? "Règlement" : "Échéancier"}
        </p>
        <ul className="mt-1 divide-y divide-black/5 text-sm">
          {schedule.installments.map((it) => (
            <li key={it.seq} className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-black/60">
                {option === "comptant" ? "Scolarité (comptant)" : `Tranche ${it.seq}/10`} ·{" "}
                {frDate(it.due_date)}
              </span>
              <span className="font-semibold text-ipmd-black">{formatFCFA(it.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Téléchargement de l'échéancier personnalisé (F7) — généré à la demande
          depuis le choix courant (échelonné/comptant), toujours à jour. */}
      <a
        href={`/admission/pack/echeancier/pdf?t=${encodeURIComponent(token)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-ipmd-black px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        ⬇ Télécharger mon échéancier (PDF)
      </a>

      {/* Délai de confirmation 72 h — dépassé : message clair (place non garantie) */}
      {deadlineExpired ? (
        <p className="mt-3 rounded-xl bg-ipmd-red/10 px-3 py-2 text-[12px] font-medium leading-relaxed text-ipmd-red ring-1 ring-ipmd-red/20">
          ⏳ {ADMISSION_EXPIRED_MESSAGE}
        </p>
      ) : deadlineText ? (
        <p className="mt-3 rounded-xl bg-ipmd-light px-3 py-2 text-[12px] leading-relaxed text-black/70 ring-1 ring-black/10">
          ⏳ <strong>Délai de confirmation :</strong> frais d'inscription à régler {deadlineText}{" "}
          pour garantir votre place.
        </p>
      ) : null}

      {/* Frais d'inscription — séparés, hors remise, sous 72 h */}
      <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
        Frais d'inscription : <strong>{formatFCFA(registrationFee)}</strong> — séparés de la
        scolarité, non concernés par la remise, à régler pour confirmer votre place.
      </p>
    </div>
  );
}
