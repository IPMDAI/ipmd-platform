"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  previewIntakeConfig,
  applyIntakeConfig,
  closeOffering,
  type ConfigPlan,
} from "@/lib/academic-year-actions";
import { formatFCFA } from "@/lib/finance";

type Filiere = { id: string; name: string };
type Offering = { id: string; filiereId: string; level: string; status: string };

const keyOf = (filiereId: string, level: string) => `${filiereId}::${level}`;
const BLOCKING = ["DOUBLON_BLOQUANT", "INCOHERENT_BLOQUANT"];

const statusBadge = (s: string) => {
  const map: Record<string, { c: string; t: string }> = {
    CLASSE_PRETE: { c: "bg-emerald-50 text-emerald-700", t: "classe prête" },
    A_CREER: { c: "bg-amber-50 text-amber-700", t: "à créer" },
    DOUBLON_BLOQUANT: { c: "bg-red-50 text-ipmd-red", t: "doublon — bloquant" },
    INCOHERENT_BLOQUANT: { c: "bg-red-50 text-ipmd-red", t: "incohérent — bloquant" },
  };
  return map[s] ?? { c: "bg-black/5 text-black/50", t: s };
};

export function IntakeOfferingConfig({
  intakeId,
  filieres,
  levels,
  offerings,
}: {
  intakeId: string;
  filieres: Filiere[];
  levels: string[];
  offerings: Offering[];
}) {
  const offeringByKey = useMemo(
    () => new Map(offerings.map((o) => [keyOf(o.filiereId, o.level), o])),
    [offerings]
  );
  const initial = useMemo(
    () => new Set(offerings.filter((o) => o.status === "open").map((o) => keyOf(o.filiereId, o.level))),
    [offerings]
  );

  const [selection, setSelection] = useState<Set<string>>(new Set(initial));
  const [catalog, setCatalog] = useState<ConfigPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set()); // toutes repliées par défaut
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // PREVIEW du CATALOGUE COMPLET (40 combinaisons) → statut + frais par niveau,
  // indépendamment de la sélection. Une seule lecture RPC (p_apply=false).
  const catalogSel = useMemo(
    () => filieres.flatMap((f) => levels.map((l) => ({ filiere_id: f.id, level: l }))),
    [filieres, levels]
  );
  useEffect(() => {
    let active = true;
    setLoading(true);
    start(async () => {
      const r = await previewIntakeConfig(intakeId, catalogSel);
      if (!active) return;
      if (r.ok && r.plan) setCatalog(r.plan);
      else setMsg({ ok: false, text: r.message ?? "Preview impossible." });
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeId, offerings]);

  const planByKey = useMemo(() => {
    const m = new Map<string, ConfigPlan["rows"][number]>();
    for (const r of catalog?.rows ?? []) m.set(keyOf(r.filiere_id, r.level), r);
    return m;
  }, [catalog]);

  // Compteurs = tally des STATUTS RPC des lignes SÉLECTIONNÉES (pas de résolveur JS parallèle).
  const selRows = useMemo(
    () => [...selection].map((k) => planByKey.get(k)).filter(Boolean) as ConfigPlan["rows"],
    [selection, planByKey]
  );
  const counts = {
    selected: selection.size,
    to_create: selRows.filter((r) => r.status === "A_CREER").length,
    ready: selRows.filter((r) => r.status === "CLASSE_PRETE").length,
    blocking: selRows.filter((r) => BLOCKING.includes(r.status)).length,
  };
  const canApply = !pending && !loading && counts.selected > 0 && counts.blocking === 0;

  const selectionArray = useMemo(
    () =>
      [...selection].map((k) => {
        const [filiere_id, level] = k.split("::");
        return { filiere_id, level };
      }),
    [selection]
  );

  const toggle = (k: string) => {
    setMsg(null);
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const toggleSection = (fid: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });

  const apply = () => {
    if (!canApply) return;
    if (
      !window.confirm(
        `Préparer ${counts.selected} offre(s) pour cette rentrée ?\n\n` +
          `• ${counts.selected} sélectionnée(s)\n` +
          `• ${counts.to_create} classe(s) à créer\n` +
          `• ${counts.ready} déjà prête(s)\n\n` +
          `(Additif : n'affecte aucune offre déjà ouverte hors sélection.)`
      )
    )
      return;
    setMsg(null);
    start(async () => {
      const r = await applyIntakeConfig(intakeId, selectionArray);
      setMsg({ ok: r.ok, text: r.message ?? (r.ok ? "Appliqué." : "Échec.") });
    });
  };

  const doClose = (o: Offering, name: string) => {
    if (
      !window.confirm(
        `Fermer l'offre « ${name} · ${o.level} » ?\n(Action explicite. N'affecte ni la classe ni les candidatures déposées.)`
      )
    )
      return;
    setMsg(null);
    start(async () => {
      const r = await closeOffering(o.id);
      setMsg({ ok: r.ok, text: r.message ?? "" });
    });
  };

  return (
    <div className="mt-3 rounded-xl bg-white/70 p-3 ring-1 ring-black/10">
      <p className="text-[11px] font-bold uppercase tracking-wider text-black/50">
        Configurer les offres de cette rentrée
      </p>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1">
          Offres sélectionnées : <strong>{counts.selected}</strong>
        </span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
          Classes à créer : <strong>{loading ? "…" : counts.to_create}</strong>
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
          Déjà prêtes : <strong>{loading ? "…" : counts.ready}</strong>
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            counts.blocking > 0 ? "bg-red-50 text-ipmd-red" : "bg-black/[0.04] text-black/50"
          }`}
        >
          Erreurs bloquantes : <strong>{loading ? "…" : counts.blocking}</strong>
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {filieres.map((f) => {
          const isOpen = expanded.has(f.id);
          const selCount = levels.filter((l) => selection.has(keyOf(f.id, l))).length;
          return (
            <div key={f.id} className="rounded-lg ring-1 ring-black/5">
              <button
                type="button"
                onClick={() => toggleSection(f.id)}
                className="flex w-full items-center gap-2 bg-ipmd-light px-3 py-2 text-left text-xs font-semibold hover:bg-black/5"
              >
                <span className="text-black/40">{isOpen ? "▾" : "▸"}</span>
                <span className="flex-1">{f.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-black/5 text-black/40"
                  }`}
                >
                  {selCount}/5 sélectionnée{selCount > 1 ? "s" : ""}
                </span>
              </button>

              {isOpen && (
                <div className="divide-y divide-black/5">
                  {levels.map((lvl) => {
                    const k = keyOf(f.id, lvl);
                    const checked = selection.has(k);
                    const row = planByKey.get(k);
                    const off = offeringByKey.get(k);
                    const b = row ? statusBadge(row.status) : null;
                    const tuitionKnown = row?.tuition_due != null;
                    const reg = row?.registration_fee ?? 0;
                    return (
                      <div key={k} className="flex flex-wrap items-center gap-2 px-3 py-1.5 text-[12px]">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={checked} onChange={() => toggle(k)} className="h-4 w-4" />
                          <span className="w-[70px] font-medium">{lvl}</span>
                        </label>

                        {off?.status === "open" && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                            déjà ouverte
                          </span>
                        )}
                        {b && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.c}`}>{b.t}</span>}

                        {row && (
                          <span className="text-[11px] text-black/55">
                            Insc. {formatFCFA(reg)} · Scol.{" "}
                            {tuitionKnown ? formatFCFA(row!.tuition_due as number) : "à confirmer"} ·{" "}
                            <strong className="text-black/75">
                              Total {tuitionKnown ? formatFCFA(reg + (row!.tuition_due as number)) : "à confirmer"}
                            </strong>
                          </span>
                        )}

                        {off?.status === "open" && (
                          <button
                            type="button"
                            onClick={() => doClose(off, f.name)}
                            disabled={pending}
                            className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-black/55 hover:bg-black/10 disabled:opacity-50"
                            title="Fermer cette offre (action explicite)"
                          >
                            Fermer l&apos;offre
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={!canApply}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending
            ? "…"
            : `Préparer ${counts.selected} offre${counts.selected > 1 ? "s" : ""} pour cette rentrée`}
        </button>
        {counts.blocking > 0 && !loading && (
          <span className="text-[11px] font-medium text-ipmd-red">
            Corrige les erreurs bloquantes avant de créer.
          </span>
        )}
      </div>

      {msg && (
        <p className={`mt-2 text-xs font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>{msg.text}</p>
      )}
    </div>
  );
}
