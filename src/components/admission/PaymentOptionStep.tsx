"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatFCFA } from "@/lib/finance";
import { setPlan } from "@/lib/admission-actions";
import type { ScheduleSnapshot } from "@/lib/admission-schedule";
import { ADMISSION_EXPIRED_MESSAGE } from "@/lib/admission-deadline";

/** Formate une date ISO (YYYY-MM-DD) en JJ/MM/AAAA pour le candidat. */
function frDate(d: string): string {
  const [y, m, j] = d.split("-");
  return j && m && y ? `${j}/${m}/${y}` : d;
}

/** Libellé d'un plan : « 1 fois » (comptant) ou « N mensualités ». */
function planLabel(m: number): string {
  return m === 1 ? "Paiement en 1 fois" : `${m} mensualités`;
}

/**
 * Choix du PLAN de paiement par le candidat : 1/2/3/6/8/10 mensualités (source
 * `payment_plans`), remises 15/10/5/0/0/0 appliquées à la scolarité seule. Le
 * choix est persisté dans `admission_packs.schedule_json` via `setPlan` — aucun
 * impact sur `student_finance` (qui n'existe qu'après la finalisation). Jour
 * d'échéance fixe (30 / février dernier jour) ; frais d'inscription séparés.
 */
export function PaymentOptionStep({
  token,
  schedule,
  plans = [],
  registrationFee,
  deadlineText = null,
  deadlineExpired = false,
}: {
  token: string;
  schedule: ScheduleSnapshot | null;
  plans?: { plan_months: number; discount_rate: number }[];
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

  const official = schedule.tuition_official;
  const net = schedule.tuition_net;
  const remiseAmount = official - net; // remise réellement appliquée au plan courant
  const nbTranches = schedule.installments.length;
  // Plan courant : plan_months (nouveaux snapshots) ou dérivé (anciens).
  const currentPlan = schedule.plan_months ?? (schedule.payment_option === "comptant" ? 1 : 10);
  // Repli si la liste des plans n'est pas fournie : au moins le plan courant.
  const options =
    plans.length > 0
      ? [...plans].sort((a, b) => a.plan_months - b.plan_months)
      : [{ plan_months: currentPlan, discount_rate: schedule.discount_rate }];

  const choose = (months: number) => {
    if (pending || months === currentPlan) return;
    setMsg(null);
    startTransition(async () => {
      const res = await setPlan(token, months);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) router.refresh(); // recharge le pack avec le snapshot recalculé
    });
  };

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-black/10">
      {/* Récap tarif officiel → remise appliquée → net (jamais d'écrasement du tarif) */}
      <dl className="divide-y divide-black/5 text-sm">
        <div className="flex items-center justify-between gap-4 py-1.5">
          <dt className="text-black/55">Scolarité officielle</dt>
          <dd className="font-semibold text-ipmd-black">{formatFCFA(official)}</dd>
        </div>
        {schedule.discount_rate > 0 && (
          <div className="flex items-center justify-between gap-4 py-1.5">
            <dt className="text-black/55">
              Remise ({Math.round(schedule.discount_rate * 100)} %)
            </dt>
            <dd className="font-semibold text-emerald-700">− {formatFCFA(remiseAmount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4 py-1.5">
          <dt className="text-black/55">Scolarité à financer</dt>
          <dd className="font-bold text-ipmd-black">{formatFCFA(net)}</dd>
        </div>
      </dl>

      {/* Choix du plan (1/2/3/6/8/10) */}
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-black/45">
        Votre plan de paiement
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((p) => {
          const active = p.plan_months === currentPlan;
          const disc = Math.round(p.discount_rate * 100);
          const sub =
            p.plan_months === 1
              ? `Remise ${disc} % · règlement unique`
              : disc > 0
                ? `Remise ${disc} % · ${p.plan_months} versements`
                : `${p.plan_months} versements au 30 de chaque mois`;
          return (
            <button
              key={p.plan_months}
              type="button"
              onClick={() => choose(p.plan_months)}
              disabled={pending}
              className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${
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
                {planLabel(p.plan_months)}
              </span>
              <span className="mt-1 block text-[12px] text-black/55">{sub}</span>
            </button>
          );
        })}
      </div>

      {msg && (
        <p className={`mt-2 text-[12px] font-medium ${msg.ok ? "text-emerald-700" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}

      {/* Échéancier détaillé (Tranche X/N selon le plan) */}
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-black/45">
          {currentPlan === 1 ? "Règlement" : "Échéancier"}
        </p>
        <ul className="mt-1 divide-y divide-black/5 text-sm">
          {schedule.installments.map((it) => (
            <li key={it.seq} className="flex items-center justify-between gap-4 py-1.5">
              <span className="text-black/60">
                {currentPlan === 1 ? "Scolarité (1 fois)" : `Tranche ${it.seq}/${nbTranches}`} ·{" "}
                {frDate(it.due_date)}
              </span>
              <span className="font-semibold text-ipmd-black">{formatFCFA(it.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Téléchargement de l'échéancier personnalisé — généré à la demande depuis
          le plan courant, toujours à jour. */}
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
