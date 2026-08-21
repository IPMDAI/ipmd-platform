"use client";

import { useState, useTransition } from "react";
import {
  setCandidatureStatus,
  deleteCandidature,
} from "@/lib/candidature-actions";
import {
  CANDIDATURE_TRANSITIONS,
  RESERVED_TARGETS,
  isHistoricalDecision,
} from "@/lib/candidatures";

const STEP_LABEL: Record<string, string> = {
  en_etude: "🔎 Mettre en étude",
  pieces_a_completer: "📎 Demander les pièces",
  entretien: "🎙️ Planifier entretien",
  accepte: "✅ Accepter",
  refuse: "❌ Refuser",
};

export function CandidatureActions({
  id,
  status,
  name = "",
  canDelete = false,
  decidedAt = null,
}: {
  id: string;
  status: string;
  name?: string;
  canDelete?: boolean;
  decidedAt?: string | null;
}) {
  const [current, setCurrent] = useState(status);
  const [decided, setDecided] = useState<string | null>(decidedAt);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const label = name ? `« ${name} »` : "cette candidature";
  const historical = isHistoricalDecision(current, decided);

  // ── Transition de statut (boutons guidés) ────────────────────────────────
  const changeStatus = (to: string, confirmMsg?: string) => {
    if (pending) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    start(async () => {
      const res = await setCandidatureStatus(id, to);
      if (res.ok) {
        setCurrent(to);
        if (to === "accepte" || to === "refuse")
          setDecided(new Date().toISOString());
      } else setError(res.message);
    });
  };

  const stepConfirm = (to: string): string | undefined => {
    if (to === "accepte")
      return `Décision : ACCEPTER ${label} ?\n(Interne — aucun email n'est envoyé maintenant.)`;
    if (to === "refuse")
      return `Décision : REFUSER ${label} ?\n(Interne — aucun email n'est envoyé maintenant.)`;
    if (
      to === "en_etude" &&
      (current === "accepte" || current === "refuse" || current === "en_attente_paiement")
    )
      return `Revenir « En étude » (révision de la décision) ?`;
    return undefined;
  };

  const stepLabelFor = (to: string): string => {
    if (
      to === "en_etude" &&
      (current === "accepte" || current === "refuse" || current === "en_attente_paiement")
    )
      return "↩ Revenir à l'étude";
    return STEP_LABEL[to] ?? to;
  };

  const remove = () => {
    if (pending) return;
    if (
      !window.confirm(
        `Supprimer définitivement ${label} ?\nCette action est irréversible.`
      )
    )
      return;
    setError(null);
    start(async () => {
      const res = await deleteCandidature(id);
      if (res.ok) setDeleted(true);
      else setError(res.message);
    });
  };

  if (deleted) {
    return (
      <div className="mt-4 border-t border-black/5 pt-3">
        <p className="text-xs font-semibold text-black/40">🗑 Candidature supprimée.</p>
      </div>
    );
  }

  // Étapes guidées : transitions permises, hors statuts réservés (posés par
  // les actions dédiées : Confirmer l'admission / Créer & inviter).
  const steps = (CANDIDATURE_TRANSITIONS[current] ?? []).filter(
    (t) => !RESERVED_TARGETS.includes(t)
  );

  const pill =
    "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50";
  const disabledPill =
    "inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/40";

  return (
    <div className="mt-4 border-t border-black/5 pt-3">
      {historical && (
        <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-black/55">
          🕓 Historique — traité avant la refonte
        </p>
      )}

      {/* Étapes guidées (transitions de statut) */}
      {steps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-black/40">Étape :</span>
          {steps.map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => changeStatus(to, stepConfirm(to))}
              disabled={pending}
              className={`${pill} ${
                to === "accepte"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : to === "refuse"
                  ? "bg-ipmd-red/10 text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/20"
                  : "bg-ipmd-light text-black/60 hover:bg-black/5"
              }`}
            >
              {stepLabelFor(to)}
            </button>
          ))}
          {canDelete && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className={`ml-auto ${pill} text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/10`}
            >
              🗑 Supprimer
            </button>
          )}
        </div>
      )}

      {/* Décision ACCEPTÉ — l'envoi officiel arrive au Lot C (désactivé) */}
      {current === "accepte" && (
        <div className="mt-3 rounded-xl bg-blue-50/70 p-3 ring-1 ring-blue-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700/80">
            Décision : accepté
          </p>
          <div className="mt-2">
            <span className={disabledPill} title="Sera activé au Lot C">
              📩 Lettre d&apos;admission — Disponible après Lot C
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-black/45">
            L&apos;envoi officiel (email + passage « En attente de paiement »)
            sera activé au Lot C. Pour inscrire l&apos;étudiant dès maintenant,
            utilise « Créer &amp; inviter » ci-dessous.
          </p>
        </div>
      )}

      {/* Décision REFUSÉ — lettre de refus au Lot C (désactivé) */}
      {current === "refuse" && (
        <div className="mt-3 rounded-xl bg-black/[0.03] p-3 ring-1 ring-black/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-black/50">
            Décision : refusé
          </p>
          <div className="mt-2">
            <span className={disabledPill} title="Sera activé au Lot C">
              📩 Lettre de refus — Disponible après Lot C
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-black/45">
            L&apos;envoi officiel de la lettre de refus sera activé au Lot C.
          </p>
        </div>
      )}

      {/* Barre de suppression si aucune étape guidée n'est affichée */}
      {steps.length === 0 && canDelete && (
        <div className="mt-3">
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className={`${pill} text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/10`}
          >
            🗑 Supprimer
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-ipmd-red">{error}</p>}
    </div>
  );
}
