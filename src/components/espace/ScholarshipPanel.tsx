"use client";

import { useState, useTransition } from "react";
import { formatFCFA } from "@/lib/finance";
import {
  scholarshipAmount,
  applyBourseAndPlan,
  type ScholarshipMode,
} from "@/lib/admission-schedule";
import {
  grantScholarship,
  setScholarshipTerm,
  suspendScholarshipTerm,
  resumeScholarshipTerm,
  revokeScholarship,
} from "@/lib/scholarship-actions";

/**
 * B4-2 — Panneau super_admin d'attribution/gestion de la Bourse IPMD sur la fiche
 * candidature. Aucune écriture DB directe : chaque bouton passe par une server
 * action (`requireSuperAdmin()` + RPC B4-1). Le `reason` est PRIVÉ (admin only).
 * La confirmation financière (scolarité officielle → bourse → remise plan → net)
 * s'affiche AVANT validation, calculée avec le moteur PUR partagé.
 */

export type PanelTerm = {
  id: string;
  academicYear: string;
  mode: ScholarshipMode;
  rate: number | null;
  amount: number | null;
  status: "active" | "superseded" | "suspended";
};
export type PanelScholarship = {
  id: string;
  kind: string;
  status: "active" | "revoked";
  startYear: string;
  durationYears: 1 | 2 | 3;
  cumulable: boolean;
  reason: string | null;
  terms: PanelTerm[];
};

const KIND_LABEL: Record<string, string> = {
  merite: "Mérite",
  sociale: "Sociale",
  partenaire: "Partenaire",
  institutionnelle: "Institutionnelle",
  autre: "Autre",
};
const KIND_OPTIONS = Object.entries(KIND_LABEL);

const TERM_STATUS: Record<PanelTerm["status"], { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  suspended: { label: "Suspendue", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  superseded: { label: "Remplacée", cls: "bg-black/5 text-black/50 ring-black/10" },
};

function startYearOf(label: string): number {
  return parseInt(label.split("-")[0], 10);
}
function coveredYears(startYear: string, duration: number): string[] {
  const s = startYearOf(startYear);
  if (!Number.isFinite(s)) return [];
  return Array.from({ length: duration }, (_, i) => `${s + i}-${s + i + 1}`);
}

/** Confirmation financière (moteur PUR partagé). null si tarif officiel inconnu. */
function computePreview(
  official: number | null,
  mode: ScholarshipMode,
  rate: number | null,
  amount: number | null,
  planDiscount: number,
  cumulable: boolean
) {
  if (official == null || !(official > 0)) return null;
  const sch = scholarshipAmount({ id: "x", academic_year: "", mode, rate, amount, status: "active" }, official);
  const { schApplied, effDiscount, planApplied } = applyBourseAndPlan(official, sch, planDiscount, cumulable);
  const net = Math.round((official - schApplied) * (1 - effDiscount));
  return { sch, schApplied, effDiscount, planApplied, net };
}

function FinancialConfirm({
  official,
  mode,
  rate,
  amount,
  planDiscount,
  cumulable,
}: {
  official: number | null;
  mode: ScholarshipMode;
  rate: number | null;
  amount: number | null;
  planDiscount: number;
  cumulable: boolean;
}) {
  const p = computePreview(official, mode, rate, amount, planDiscount, cumulable);
  const row = "flex items-center justify-between gap-3 py-0.5";
  if (!p) {
    return (
      <div className="mt-2 rounded-lg bg-blue-50 p-2.5 text-[11px] text-blue-800 ring-1 ring-blue-200">
        Tarif officiel pas encore figé : la bourse ({mode === "taux" ? `${rate ?? 0} %` : formatFCFA(amount)})
        sera appliquée automatiquement à la confirmation d'admission.
      </div>
    );
  }
  const bourseWon = p.schApplied > 0;
  const planWon = !bourseWon && p.effDiscount > 0;
  return (
    <div className="mt-2 rounded-lg bg-white p-2.5 text-[12px] ring-1 ring-black/10">
      <div className={row}>
        <span className="text-black/55">Scolarité officielle</span>
        <span className="font-semibold">{formatFCFA(official)}</span>
      </div>
      <div className={row}>
        <span className="text-black/55">Bourse saisie</span>
        <span className="font-semibold">{mode === "taux" ? `${rate ?? 0} %` : formatFCFA(amount)}</span>
      </div>
      <div className={row}>
        <span className="text-black/55">Montant de bourse calculé</span>
        <span className="font-semibold">{formatFCFA(p.sch)}</span>
      </div>
      <div className={row}>
        <span className="text-black/55">Remise du plan éventuelle</span>
        <span className="font-semibold">{planDiscount > 0 ? `${Math.round(planDiscount * 100)} %` : "—"}</span>
      </div>
      {!cumulable && (bourseWon || planWon) && planDiscount > 0 && (
        <p className="mt-1 rounded bg-black/5 px-2 py-1 text-[10.5px] text-black/60">
          Non cumulable — meilleur avantage retenu :{" "}
          {bourseWon ? "la bourse est appliquée (plan ignoré)." : "la remise du plan est appliquée (bourse ignorée cette année)."}
        </p>
      )}
      {cumulable && planDiscount > 0 && p.sch > 0 && (
        <p className="mt-1 rounded bg-black/5 px-2 py-1 text-[10.5px] text-black/60">
          Cumulable — bourse puis remise du plan sur le reste.
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-3 border-t border-black/10 pt-1.5">
        <span className="font-bold">Net final estimé (scolarité)</span>
        <span className="font-bold text-ipmd-black">{formatFCFA(p.net)}</span>
      </div>
      <p className="mt-1 text-[10.5px] text-black/45">Frais d'inscription (300 000) séparés, jamais remisés.</p>
    </div>
  );
}

// ————————————————————————————————————————————————————————————————
// Formulaire commun taux/montant (attribution ou terme annuel)
// ————————————————————————————————————————————————————————————————
function ValueFields({
  mode,
  setMode,
  rate,
  setRate,
  amount,
  setAmount,
  disabled,
}: {
  mode: ScholarshipMode;
  setMode: (m: ScholarshipMode) => void;
  rate: string;
  setRate: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  disabled?: boolean;
}) {
  const input = "w-full rounded-lg border border-black/15 px-2.5 py-1.5 text-[13px] outline-none focus:border-ipmd-black disabled:opacity-50";
  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-[11px] font-semibold text-black/55">
        Mode
        <select value={mode} onChange={(e) => setMode(e.target.value as ScholarshipMode)} disabled={disabled} className={input}>
          <option value="taux">Taux (%)</option>
          <option value="montant">Montant (FCFA)</option>
        </select>
      </label>
      {mode === "taux" ? (
        <label className="text-[11px] font-semibold text-black/55">
          Taux (%)
          <input type="number" min={0.01} max={100} step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} disabled={disabled} className={input} placeholder="ex. 30" />
        </label>
      ) : (
        <label className="text-[11px] font-semibold text-black/55">
          Montant (FCFA)
          <input type="number" min={1} step="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={disabled} className={input} placeholder="ex. 500000" />
        </label>
      )}
    </div>
  );
}

function GrantForm({
  candidatureId,
  official,
  planDiscount,
  currentYear,
  onDone,
}: {
  candidatureId: string;
  official: number | null;
  planDiscount: number;
  currentYear: string;
  onDone: (msg: string) => void;
}) {
  const [kind, setKind] = useState("merite");
  const [duration, setDuration] = useState<1 | 2 | 3>(1);
  const [startYear, setStartYear] = useState(currentYear);
  const [cumulable, setCumulable] = useState(false);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<ScholarshipMode>("taux");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const rateNum = rate ? Number(rate) / 100 : null;
  const amountNum = amount ? Number(amount) : null;
  const valid = mode === "taux" ? rateNum != null && rateNum > 0 && rateNum <= 1 : amountNum != null && amountNum > 0;

  const submit = () => {
    if (!valid || pending) return;
    setErr(null);
    start(async () => {
      const res = await grantScholarship({
        candidatureId,
        kind,
        cumulable,
        durationYears: duration,
        startYear,
        reason,
        academicYear: startYear,
        mode,
        rate: rateNum,
        amount: amountNum,
      });
      if (res.ok) onDone(res.message);
      else setErr(res.message);
    });
  };

  const label = "text-[11px] font-semibold text-black/55";
  const input = "w-full rounded-lg border border-black/15 px-2.5 py-1.5 text-[13px] outline-none focus:border-ipmd-black disabled:opacity-50";
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className={label}>
          Type
          <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={pending} className={input}>
            {KIND_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Durée
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value) as 1 | 2 | 3)} disabled={pending} className={input}>
            <option value={1}>1 an</option>
            <option value={2}>2 ans</option>
            <option value={3}>3 ans</option>
          </select>
        </label>
        <label className={label}>
          Année de début
          <input value={startYear} onChange={(e) => setStartYear(e.target.value)} disabled={pending} className={input} placeholder="2026-2027" />
        </label>
        <label className={`${label} flex items-end gap-2 pb-1.5`}>
          <input type="checkbox" checked={cumulable} onChange={(e) => setCumulable(e.target.checked)} disabled={pending} className="h-4 w-4" />
          <span>Cumulable avec la remise du plan</span>
        </label>
      </div>
      <ValueFields mode={mode} setMode={setMode} rate={rate} setRate={setRate} amount={amount} setAmount={setAmount} disabled={pending} />
      <label className={label}>
        Motif (privé — jamais montré au candidat)
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} disabled={pending} rows={2} className={input} placeholder="Contexte interne de l'attribution" />
      </label>
      {valid && <FinancialConfirm official={official} mode={mode} rate={rateNum} amount={amountNum} planDiscount={planDiscount} cumulable={cumulable} />}
      {err && <p className="text-[12px] font-medium text-ipmd-red">{err}</p>}
      <button type="button" onClick={submit} disabled={!valid || pending} className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
        {pending ? "Attribution…" : "🎓 Confirmer l'attribution"}
      </button>
    </div>
  );
}

function TermForm({
  candidatureId,
  scholarshipId,
  years,
  official,
  planDiscount,
  onDone,
}: {
  candidatureId: string;
  scholarshipId: string;
  years: string[];
  official: number | null;
  planDiscount: number;
  onDone: (msg: string) => void;
}) {
  const [year, setYear] = useState(years[0] ?? "");
  const [mode, setMode] = useState<ScholarshipMode>("taux");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const rateNum = rate ? Number(rate) / 100 : null;
  const amountNum = amount ? Number(amount) : null;
  const valid = year !== "" && (mode === "taux" ? rateNum != null && rateNum > 0 && rateNum <= 1 : amountNum != null && amountNum > 0);

  const submit = () => {
    if (!valid || pending) return;
    setErr(null);
    start(async () => {
      const res = await setScholarshipTerm({ candidatureId, scholarshipId, academicYear: year, mode, rate: rateNum, amount: amountNum });
      if (res.ok) onDone(res.message);
      else setErr(res.message);
    });
  };

  const label = "text-[11px] font-semibold text-black/55";
  const input = "w-full rounded-lg border border-black/15 px-2.5 py-1.5 text-[13px] outline-none focus:border-ipmd-black disabled:opacity-50";
  return (
    <div className="space-y-2 rounded-lg bg-black/[0.03] p-2.5 ring-1 ring-black/5">
      <p className="text-[11px] font-bold text-black/60">Définir / modifier le taux d'une année</p>
      <label className={label}>
        Année
        <select value={year} onChange={(e) => setYear(e.target.value)} disabled={pending} className={input}>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
      <ValueFields mode={mode} setMode={setMode} rate={rate} setRate={setRate} amount={amount} setAmount={setAmount} disabled={pending} />
      {valid && <FinancialConfirm official={official} mode={mode} rate={rateNum} amount={amountNum} planDiscount={planDiscount} cumulable={false} />}
      {err && <p className="text-[12px] font-medium text-ipmd-red">{err}</p>}
      <button type="button" onClick={submit} disabled={!valid || pending} className="rounded-full bg-ipmd-black px-4 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40">
        {pending ? "Enregistrement…" : "Enregistrer le terme"}
      </button>
    </div>
  );
}

export function ScholarshipPanel({
  candidatureId,
  status,
  officialTuition,
  planDiscountRate,
  currentYear,
  scholarship,
}: {
  candidatureId: string;
  status: string;
  officialTuition: number | null;
  planDiscountRate: number;
  currentYear: string;
  scholarship: PanelScholarship | null;
}) {
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isFrozen = status === "inscrit";

  const done = (msg: string) => setFlash(msg);

  const box = "mt-3 rounded-xl border border-purple-200 bg-purple-50/60 p-3";
  const header = (
    <div className="flex items-center justify-between">
      <p className="text-[12px] font-bold text-purple-900">🎓 Bourse IPMD {isFrozen && <span className="font-medium text-purple-700">· échéancier figé (inscrit)</span>}</p>
    </div>
  );

  // Aucune bourse active → formulaire d'attribution.
  if (!scholarship || scholarship.status !== "active") {
    return (
      <div className={box}>
        {header}
        {flash ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">✅ {flash}</p>
        ) : (
          <div className="mt-2">
            <p className="mb-2 text-[11px] text-purple-800">Aucune bourse active. Attribuer une Bourse IPMD :</p>
            <GrantForm candidatureId={candidatureId} official={officialTuition} planDiscount={planDiscountRate} currentYear={currentYear} onDone={done} />
          </div>
        )}
      </div>
    );
  }

  // Bourse active → synthèse + gestion.
  const years = coveredYears(scholarship.startYear, scholarship.durationYears);
  const endYear = years[years.length - 1] ?? scholarship.startYear;
  const currentTerms = scholarship.terms.filter((t) => t.status === "active" || t.status === "suspended");
  const byYear = new Map(currentTerms.map((t) => [t.academicYear, t]));
  const history = scholarship.terms.filter((t) => t.status === "superseded");

  const termValue = (t: PanelTerm) => (t.mode === "taux" ? `${Math.round((t.rate ?? 0) * 100)} %` : formatFCFA(t.amount));

  const suspendResume = (t: PanelTerm) => {
    if (pending) return;
    start(async () => {
      const res = t.status === "suspended"
        ? await resumeScholarshipTerm(candidatureId, scholarship.id, t.academicYear)
        : await suspendScholarshipTerm(candidatureId, scholarship.id, t.academicYear);
      setFlash(res.message);
    });
  };
  const revoke = () => {
    if (pending) return;
    const reason = window.prompt("Révoquer la bourse (années futures) — motif privé (optionnel) :", "");
    if (reason === null) return;
    start(async () => {
      const res = await revokeScholarship(candidatureId, scholarship.id, reason);
      setFlash(res.message);
    });
  };

  const chip = "rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-purple-800 ring-1 ring-purple-200";
  return (
    <div className={box}>
      {header}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <span className={chip}>{KIND_LABEL[scholarship.kind] ?? scholarship.kind}</span>
        <span className={chip}>{scholarship.durationYears} an{scholarship.durationYears > 1 ? "s" : ""} · {scholarship.startYear} → {endYear}</span>
        <span className={chip}>{scholarship.cumulable ? "Cumulable" : "Non cumulable"}</span>
      </div>
      {scholarship.reason && (
        <p className="mt-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-black/60 ring-1 ring-black/10">
          🔒 Motif (privé) : {scholarship.reason}
        </p>
      )}

      {/* Termes par année couverte */}
      <div className="mt-2 space-y-1.5">
        {years.map((y) => {
          const t = byYear.get(y);
          const st = t ? TERM_STATUS[t.status] : null;
          return (
            <div key={y} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[12px] ring-1 ring-black/10">
              <span className="font-semibold">{y}</span>
              {t ? (
                <>
                  <span className="text-black/70">{termValue(t)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st!.cls}`}>{st!.label}</span>
                  {!isFrozen && (
                    <button type="button" onClick={() => suspendResume(t)} disabled={pending} className="ml-auto rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-black/70 hover:bg-black/10 disabled:opacity-40">
                      {t.status === "suspended" ? "Reprendre" : "Suspendre"}
                    </button>
                  )}
                </>
              ) : (
                <span className="text-black/40">— non défini</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Historique des termes remplacés */}
      {history.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-black/50">Historique ({history.length})</summary>
          <div className="mt-1 space-y-1">
            {history.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded bg-black/[0.03] px-2 py-1 text-[11px] text-black/50">
                <span className="font-semibold">{t.academicYear}</span>
                <span>{termValue(t)}</span>
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[9.5px]">remplacée</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {flash && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] font-semibold text-emerald-700 ring-1 ring-emerald-200">✅ {flash}</p>}

      {/* Gestion : modifier un terme + révoquer */}
      {!isFrozen && (
        <div className="mt-2 space-y-2">
          <TermForm candidatureId={candidatureId} scholarshipId={scholarship.id} years={years} official={officialTuition} planDiscount={planDiscountRate} onDone={done} />
          <button type="button" onClick={revoke} disabled={pending} className="rounded-full bg-ipmd-red/10 px-4 py-1.5 text-[13px] font-semibold text-ipmd-red transition-opacity hover:opacity-90 disabled:opacity-40">
            Révoquer la bourse
          </button>
        </div>
      )}
      {isFrozen && (
        <p className="mt-2 text-[11px] text-purple-700">
          Étudiant inscrit : l'échéancier de l'année en cours est figé. Les changements de bourse ne vaudront que pour une année future / réinscription.
        </p>
      )}
    </div>
  );
}
