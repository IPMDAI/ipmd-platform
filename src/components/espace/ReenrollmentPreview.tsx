"use client";

import { useMemo, useState, useTransition } from "react";
import { formatFCFA } from "@/lib/finance";
import type { ReenrollPreview, ReenrollStatus } from "@/lib/reenrollment-preview";
import { prepareReenrollments, type PrepareReport } from "@/lib/reenrollment-actions";

const OUTCOME_META: Record<string, { c: string; t: string }> = {
  created: { c: "bg-emerald-50 text-emerald-700", t: "Créé" },
  already_prepared: { c: "bg-blue-50 text-blue-700", t: "Déjà préparé" },
  end_of_cycle: { c: "bg-black/[0.06] text-black/60", t: "Fin de cycle" },
  missing_filiere: { c: "bg-amber-50 text-amber-800", t: "Filière manquante" },
  missing_target_class: { c: "bg-red-50 text-ipmd-red", t: "Classe cible manquante" },
  special_case: { c: "bg-amber-50 text-amber-800", t: "Cas particulier" },
  error: { c: "bg-red-50 text-ipmd-red", t: "Erreur" },
};

const STATUS_META: Record<ReenrollStatus, { c: string; t: string }> = {
  eligible: { c: "bg-emerald-50 text-emerald-700", t: "Éligible" },
  cas_particulier: { c: "bg-amber-50 text-amber-800", t: "Cas particulier" },
  fin_de_cycle: { c: "bg-black/[0.06] text-black/60", t: "Fin de cycle" },
  classe_cible_manquante: { c: "bg-red-50 text-ipmd-red", t: "Classe cible manquante" },
  deja_prepare: { c: "bg-blue-50 text-blue-700", t: "Déjà préparé" },
};

/**
 * Écran admin « Réinscriptions 2026-2027 » — MODE PREVIEW.
 * Affiche la cohorte 2025-2026, le passage proposé et les statuts. L'admin
 * sélectionne les étudiants ÉLIGIBLES à préparer en lot. Aucune écriture ici :
 * le bouton n'affiche qu'un récapitulatif de ce qui SERAIT créé (l'action
 * transactionnelle n'est pas encore branchée).
 */
export function ReenrollmentPreview({ preview }: { preview: ReenrollPreview }) {
  const eligibleIds = useMemo(
    () => preview.rows.filter((r) => r.status === "eligible").map((r) => r.studentId),
    [preview.rows],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(eligibleIds));
  const [report, setReport] = useState<PrepareReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameById = useMemo(
    () => new Map(preview.rows.map((r) => [r.studentId, r.fullName])),
    [preview.rows],
  );

  const submit = () => {
    if (selected.size === 0 || pending) return;
    const n = selected.size;
    if (
      !window.confirm(
        `Créer ${n} dossier(s) de réinscription « prepared » pour ${preview.year} ?\n\n` +
          `• Frais d'inscription figés : ${preview.registrationFee != null ? formatFCFA(preview.registrationFee) : "—"}\n` +
          `• Aucune modification des classes ni de la finance courante.\n` +
          `• Les non-éligibles éventuels seront ignorés (rapport détaillé).`,
      )
    )
      return;
    setError(null);
    setReport(null);
    startTransition(async () => {
      const res = await prepareReenrollments([...selected], preview.year);
      if (res.ok) setReport(res.report);
      else setError(res.message);
    });
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = eligibleIds.length > 0 && eligibleIds.every((id) => selected.has(id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(eligibleIds));

  const c = preview.counters;
  const Counter = ({ label, n, cls }: { label: string; n: number; cls: string }) => (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {label} : <strong>{n}</strong>
    </span>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Counter label="Éligibles" n={c.eligible} cls="bg-emerald-50 text-emerald-700" />
        <Counter label="Cas particuliers" n={c.cas_particulier} cls="bg-amber-50 text-amber-800" />
        <Counter label="Fin de cycle" n={c.fin_de_cycle} cls="bg-black/[0.06] text-black/60" />
        <Counter label="Classe cible manquante" n={c.classe_cible_manquante} cls="bg-red-50 text-ipmd-red" />
        {c.deja_prepare > 0 && <Counter label="Déjà préparés" n={c.deja_prepare} cls="bg-blue-50 text-blue-700" />}
        <Counter label="Total 2025-2026" n={c.total} cls="bg-black/[0.04] text-black/55" />
      </div>

      <p className="mt-3 text-xs text-black/50">
        Frais d'inscription {preview.year} :{" "}
        <strong>{preview.registrationFee != null ? formatFCFA(preview.registrationFee) : "—"}</strong>
        {preview.lumpSumDiscount != null && (
          <> · Remise paiement intégral : <strong>{Math.round(preview.lumpSumDiscount * 100)}%</strong></>
        )}
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-black/10">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="bg-ipmd-light text-[11px] uppercase tracking-wide text-black/50">
            <tr>
              <th className="w-10 px-3 py-2">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={eligibleIds.length === 0} aria-label="Tout sélectionner" />
              </th>
              <th className="px-3 py-2">Étudiant</th>
              <th className="px-3 py-2">Classe actuelle</th>
              <th className="px-3 py-2">Niveau</th>
              <th className="px-3 py-2">Passage proposé 2026-2027</th>
              <th className="px-3 py-2">Frais insc.</th>
              <th className="px-3 py-2">Scolarité</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {preview.rows.map((r) => {
              const meta = STATUS_META[r.status];
              const selectable = r.status === "eligible";
              return (
                <tr key={r.studentId} className={selectable ? "" : "bg-black/[0.015]"}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.studentId)}
                      onChange={() => toggle(r.studentId)}
                      disabled={!selectable}
                      aria-label={`Sélectionner ${r.fullName}`}
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-ipmd-black">{r.fullName}</td>
                  <td className="px-3 py-2 text-black/70">
                    {r.currentClassName}
                    {r.filiereName && <span className="block text-[11px] text-black/45">{r.filiereName}</span>}
                  </td>
                  <td className="px-3 py-2 text-black/70">{r.currentLevel}</td>
                  <td className="px-3 py-2">
                    {r.toClassName ? (
                      <span className="text-black/80">
                        {r.nextLevel} · <span className="text-black/55">{r.toClassName}</span>
                      </span>
                    ) : (
                      <span className="text-black/40">{r.nextLevel ?? "—"}</span>
                    )}
                    {r.reason && <span className="block text-[11px] text-amber-700">{r.reason}</span>}
                  </td>
                  <td className="px-3 py-2 text-black/70">{r.registrationFee != null ? formatFCFA(r.registrationFee) : "—"}</td>
                  <td className="px-3 py-2 text-black/70">{r.tuition != null ? formatFCFA(r.tuition) : "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.c}`}>{meta.t}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={selected.size === 0 || pending}
          onClick={submit}
          className="rounded-full bg-ipmd-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ipmd-red-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending
            ? "Préparation en cours…"
            : `Préparer ${selected.size} réinscription${selected.size > 1 ? "s" : ""} en lot`}
        </button>
        <span className="text-xs text-black/45">
          Seuls les étudiants <strong>éligibles</strong> sont sélectionnables. Les cas particuliers, fins de cycle et classes cibles manquantes sont traités séparément.
        </span>
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-ipmd-red/10 px-4 py-3 text-[13px] font-medium text-ipmd-red">{error}</p>
      )}

      {report && (
        <div className="mt-5 rounded-2xl ring-1 ring-black/10">
          <div className="border-b border-black/10 bg-ipmd-light px-4 py-3">
            <p className="text-sm font-bold text-ipmd-black">
              Rapport de préparation — {report.academic_year} (source {report.source_year})
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Créés : <strong>{report.counters.created}</strong></span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">Déjà préparés : <strong>{report.counters.already_prepared}</strong></span>
              <span className="rounded-full bg-black/[0.06] px-2.5 py-1 font-semibold text-black/60">Fin de cycle : <strong>{report.counters.end_of_cycle}</strong></span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Filière manquante : <strong>{report.counters.missing_filiere}</strong></span>
              <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-ipmd-red">Classe cible manquante : <strong>{report.counters.missing_target_class}</strong></span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">Cas particuliers : <strong>{report.counters.special_case}</strong></span>
              <span className={`rounded-full px-2.5 py-1 font-semibold ${report.counters.errors > 0 ? "bg-red-50 text-ipmd-red" : "bg-black/[0.04] text-black/50"}`}>Erreurs : <strong>{report.counters.errors}</strong></span>
            </div>
          </div>
          <ul className="divide-y divide-black/5">
            {report.details.map((d) => {
              const m = OUTCOME_META[d.outcome] ?? { c: "bg-black/5 text-black/50", t: d.outcome };
              return (
                <li key={d.student_id} className="flex flex-wrap items-center gap-2 px-4 py-2 text-[13px]">
                  <span className="font-medium text-ipmd-black">{nameById.get(d.student_id) ?? d.student_id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.c}`}>{m.t}</span>
                  {d.to_level && <span className="text-[11px] text-black/50">→ {d.to_level}</span>}
                  {d.message && <span className="text-[11px] text-black/45">{d.message}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
