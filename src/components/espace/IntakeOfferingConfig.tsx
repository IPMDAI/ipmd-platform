"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  // Combinaisons déjà ouvertes → pré-cochées.
  const initial = useMemo(
    () => new Set(offerings.filter((o) => o.status === "open").map((o) => keyOf(o.filiereId, o.level))),
    [offerings]
  );
  const offeringByKey = useMemo(
    () => new Map(offerings.map((o) => [keyOf(o.filiereId, o.level), o])),
    [offerings]
  );

  const [selection, setSelection] = useState<Set<string>>(new Set(initial));
  const [plan, setPlan] = useState<ConfigPlan | null>(null);
  const [stale, setStale] = useState(true);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectionArray = useMemo(
    () =>
      [...selection].map((k) => {
        const [filiere_id, level] = k.split("::");
        return { filiere_id, level };
      }),
    [selection]
  );

  // Auto-preview (debounced) : les compteurs/statuts viennent TOUJOURS de la RPC.
  useEffect(() => {
    setStale(true);
    if (timer.current) clearTimeout(timer.current);
    if (selection.size === 0) {
      setPlan(null);
      setStale(false);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        const r = await previewIntakeConfig(intakeId, selectionArray);
        if (r.ok && r.plan) {
          setPlan(r.plan);
          setStale(false);
        } else {
          setMsg({ ok: false, text: r.message ?? "Preview impossible." });
        }
      });
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

  const planByKey = useMemo(() => {
    const m = new Map<string, ConfigPlan["rows"][number]>();
    for (const r of plan?.rows ?? []) m.set(keyOf(r.filiere_id, r.level), r);
    return m;
  }, [plan]);

  const toggle = (k: string) => {
    setMsg(null);
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const summary = plan?.summary;
  const canApply =
    !pending && !stale && !!plan?.ok && (summary?.selected ?? 0) > 0 && (summary?.blocking ?? 0) === 0;

  const apply = () => {
    if (!canApply) return;
    if (
      !window.confirm(
        `Préparer ${summary?.selected ?? 0} offre(s) pour cette rentrée ?\n\n` +
          `• ${summary?.selected ?? 0} sélectionnée(s)\n` +
          `• ${summary?.to_create ?? 0} classe(s) à créer\n` +
          `• ${summary?.ready ?? 0} déjà prête(s)\n\n` +
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

  const doClose = (o: Offering) => {
    if (
      !window.confirm(
        `Fermer l'offre « ${filieres.find((f) => f.id === o.filiereId)?.name ?? "?"} · ${o.level} » ?\n(Action explicite. N'affecte ni la classe ni les candidatures déposées.)`
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

      {/* Compteurs — issus du preview RPC */}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-black/[0.04] px-2.5 py-1">
          Offres sélectionnées : <strong>{selection.size}</strong>
        </span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">
          Classes à créer : <strong>{stale ? "…" : summary?.to_create ?? 0}</strong>
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">
          Déjà prêtes : <strong>{stale ? "…" : summary?.ready ?? 0}</strong>
        </span>
        <span
          className={`rounded-full px-2.5 py-1 ${
            (summary?.blocking ?? 0) > 0 ? "bg-red-50 text-ipmd-red" : "bg-black/[0.04] text-black/50"
          }`}
        >
          Erreurs bloquantes : <strong>{stale ? "…" : summary?.blocking ?? 0}</strong>
        </span>
      </div>

      {/* Grille filière × niveau */}
      <div className="mt-3 space-y-2">
        {filieres.map((f) => (
          <div key={f.id} className="rounded-lg ring-1 ring-black/5">
            <div className="bg-ipmd-light px-3 py-1.5 text-xs font-semibold">{f.name}</div>
            <div className="divide-y divide-black/5">
              {levels.map((lvl) => {
                const k = keyOf(f.id, lvl);
                const checked = selection.has(k);
                const row = planByKey.get(k);
                const off = offeringByKey.get(k);
                const b = row ? statusBadge(row.status) : null;
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
                    {row && row.tuition_due != null && (
                      <span className="text-[11px] text-black/50">
                        Insc. {formatFCFA(row.registration_fee ?? 0)} · Scol. {formatFCFA(row.tuition_due)} ·{" "}
                        <strong className="text-black/70">
                          Total {formatFCFA((row.registration_fee ?? 0) + row.tuition_due)}
                        </strong>
                      </span>
                    )}
                    {off?.status === "open" && (
                      <button
                        type="button"
                        onClick={() => doClose(off)}
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
          </div>
        ))}
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
            : `Préparer ${selection.size} offre${selection.size > 1 ? "s" : ""} pour cette rentrée`}
        </button>
        {stale && selection.size > 0 && (
          <span className="text-[11px] text-black/40">Prévisualisation en cours…</span>
        )}
        {(summary?.blocking ?? 0) > 0 && !stale && (
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
