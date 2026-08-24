"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  setCandidatureStatus,
  deleteCandidature,
  sendAdmission,
  sendRefusal,
  markAsNotified,
} from "@/lib/candidature-actions";
import {
  CANDIDATURE_TRANSITIONS,
  RESERVED_TARGETS,
  isHistoricalDecision,
} from "@/lib/candidatures";
import { formatFCFA } from "@/lib/finance";

export type LevelOption = { level: string; amount: number | null };
export type FiliereOption = { id: string; name: string };
export type ClassOption = {
  id: string;
  name: string;
  kind?: string | null;
  level?: string | null;
  filiere_id?: string | null;
  academic_year?: string | null;
  tuition_amount: number | null;
  registration_fee: number | null;
};

/** Niveaux réservés aux parcours non-diplômants (exclus du sélecteur diplôme). */
const NON_DIPLOMA_LEVELS = ["Bootcamp", "Executive"];

const STEP_LABEL: Record<string, string> = {
  en_etude: "🔎 Mettre en étude",
  pieces_a_completer: "📎 Demander les pièces",
  entretien: "🎙️ Planifier entretien",
  accepte: "✅ Accepter",
  refuse: "❌ Refuser",
};

function fmt(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function CandidatureActions({
  id,
  status,
  name = "",
  canDelete = false,
  canEditStatus = true,
  isSuper = false,
  decidedAt = null,
  refusalSentAt = null,
  lettersEnabled = false,
  testMode = false,
  isDiplome = false,
  levels = [],
  classes = [],
  filieres = [],
  registrationFee = 300000,
  academicYear = null,
  defaultFiliereId = null,
}: {
  id: string;
  status: string;
  name?: string;
  canDelete?: boolean;
  /** Boutons de transition de statut visibles (super_admin ou staff edit_candidature_status). */
  canEditStatus?: boolean;
  /** super_admin : débloque les actions sensibles (envoi admission, lettre de refus, notifications). */
  isSuper?: boolean;
  decidedAt?: string | null;
  refusalSentAt?: string | null;
  lettersEnabled?: boolean;
  testMode?: boolean;
  isDiplome?: boolean;
  levels?: LevelOption[];
  classes?: ClassOption[];
  filieres?: FiliereOption[];
  registrationFee?: number;
  academicYear?: string | null;
  defaultFiliereId?: string | null;
}) {
  const [current, setCurrent] = useState(status);
  const [decided, setDecided] = useState<string | null>(decidedAt);
  const [refSent, setRefSent] = useState<string | null>(refusalSentAt);
  const [acceptFiliere, setAcceptFiliere] = useState<string>(
    defaultFiliereId && filieres.some((f) => f.id === defaultFiliereId) ? defaultFiliereId : ""
  );
  const [acceptLevel, setAcceptLevel] = useState<string>("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const label = name ? `« ${name} »` : "cette candidature";
  const nowIso = () => new Date().toISOString();
  const historical = isHistoricalDecision(current, decided);

  const diplomaLevels = levels.filter((l) => !NON_DIPLOMA_LEVELS.includes(l.level));

  // Résolution ACADÉMIQUE côté client (aperçu) — miroir exact de resolveAcademic serveur :
  // classes de l'année active, filiere_id + level. 0 → manquante · 1 → OK · >1 → doublon.
  const candidates =
    acceptFiliere && acceptLevel
      ? classes.filter(
          (c) =>
            c.kind !== "bootcamp" &&
            c.filiere_id === acceptFiliere &&
            c.academic_year === academicYear &&
            c.level === acceptLevel
        )
      : [];
  const resolveState: "none" | "ok" | "missing" | "duplicate" =
    !acceptFiliere || !acceptLevel
      ? "none"
      : candidates.length === 0
      ? "missing"
      : candidates.length > 1
      ? "duplicate"
      : "ok";
  const resolvedClass = resolveState === "ok" ? candidates[0] : null;
  const previewReg = resolvedClass
    ? resolvedClass.registration_fee != null
      ? resolvedClass.registration_fee
      : registrationFee
    : registrationFee;
  const previewTuition = resolvedClass
    ? resolvedClass.tuition_amount != null
      ? resolvedClass.tuition_amount
      : diplomaLevels.find((l) => l.level === acceptLevel)?.amount ?? null
    : null;
  const tuitionKnown = previewTuition != null;
  // Envoi possible : classe résolue, et (mode test OU scolarité connue).
  const canConfirm = resolveState === "ok" && (testMode || tuitionKnown);

  const changeStatus = (to: string, confirmMsg?: string) => {
    if (pending) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    setNote(null);
    start(async () => {
      const res = await setCandidatureStatus(id, to);
      if (res.ok) {
        setCurrent(to);
        if (to === "accepte" || to === "refuse") setDecided(nowIso());
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

  const confirmAdmission = () => {
    if (pending) return;
    if (isDiplome && !canConfirm) return;
    let msg: string;
    if (testMode)
      msg = `MODE TEST actif : l'email ne partira QUE vers l'adresse de test autorisée — AUCUN vrai candidat n'est contacté.\n\nEnvoyer la lettre d'admission (test) ?`;
    else if (historical)
      msg = `🕓 HISTORIQUE — ${label} a été traité avant la refonte (notification peut-être déjà envoyée manuellement).\n\nConfirmer l'admission ?`;
    else
      msg = `Confirmer l'admission de ${label} ?\nLa candidature passe « En attente de paiement ».`;
    if (!window.confirm(msg)) return;
    setError(null);
    setNote(null);
    start(async () => {
      const res = await sendAdmission(
        id,
        isDiplome
          ? { filiereId: acceptFiliere, level: acceptLevel, force: historical }
          : { force: historical }
      );
      if (res.ok) {
        setCurrent("en_attente_paiement");
        if (!decided) setDecided(nowIso());
        setNote(res.message);
      } else setError(res.message);
    });
  };

  const confirmRefusal = () => {
    if (pending) return;
    let msg: string;
    if (testMode)
      msg = `MODE TEST actif : l'email ne partira QUE vers l'adresse de test autorisée — AUCUN vrai candidat n'est contacté.\n\nEnvoyer la lettre de refus (test) ?`;
    else if (historical)
      msg = `🕓 HISTORIQUE — ${label} a été traité avant la refonte.\n\nConfirmer le refus (verrouillage) ?`;
    else msg = `Confirmer le refus de ${label} ? La candidature sera verrouillée.`;
    if (!window.confirm(msg)) return;
    setError(null);
    setNote(null);
    start(async () => {
      const res = await sendRefusal(id, historical);
      if (res.ok) {
        setRefSent(nowIso());
        if (!decided) setDecided(nowIso());
        setNote(res.message);
      } else setError(res.message);
    });
  };

  const markNotified = (kind: "admission" | "refus") => {
    if (pending) return;
    if (!window.confirm(`Marquer ${label} comme DÉJÀ notifiée ?\nAucun email ne sera envoyé.`))
      return;
    setError(null);
    setNote(null);
    start(async () => {
      const res = await markAsNotified(id, kind);
      if (res.ok) {
        if (kind === "refus") setRefSent(nowIso());
        if (!decided) setDecided(nowIso());
        setNote(res.message);
      } else setError(res.message);
    });
  };

  const reopenRefusal = () => {
    if (pending) return;
    if (
      !window.confirm(
        `Réouvrir ${label} (refus envoyé le ${fmt(refSent)}) ?\nRéouverture EXCEPTIONNELLE : retour « En étude ». Traçabilité conservée.`
      )
    )
      return;
    setError(null);
    setNote(null);
    start(async () => {
      const res = await setCandidatureStatus(id, "en_etude");
      if (res.ok) setCurrent("en_etude");
      else setError(res.message);
    });
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

  const steps = (CANDIDATURE_TRANSITIONS[current] ?? []).filter(
    (t) =>
      !RESERVED_TARGETS.includes(t) &&
      !(current === "refuse" && refSent && t === "en_etude")
  );

  const pill =
    "rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50";
  const disabledPill =
    "inline-flex cursor-not-allowed items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-black/40";
  const testBadge = testMode ? (
    <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
      Mode test
    </span>
  ) : null;

  return (
    <div className="mt-4 border-t border-black/5 pt-3">
      {historical && (
        <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-black/55">
          🕓 Historique — traité avant la refonte
        </p>
      )}

      {canEditStatus && steps.length > 0 && (
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

      {/* ACCEPTÉ — envoi officiel (super_admin uniquement : admission/email) */}
      {isSuper && current === "accepte" && (
        <div className="mt-3 rounded-xl bg-blue-50/70 p-3 ring-1 ring-blue-200">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700/80">
            Décision : accepté {testBadge}
          </p>

          {lettersEnabled && isDiplome && (
            <div className="mt-2 rounded-lg bg-white/70 p-2.5 ring-1 ring-blue-100">
              <p className="text-[11px] font-semibold text-black/55">
                Filière + niveau acceptés — la classe et les frais sont déterminés
                automatiquement pour l&apos;année {academicYear ?? "active"}.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <select
                  value={acceptFiliere}
                  onChange={(e) => setAcceptFiliere(e.target.value)}
                  disabled={pending}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black/70"
                >
                  <option value="">Filière…</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <select
                  value={acceptLevel}
                  onChange={(e) => setAcceptLevel(e.target.value)}
                  disabled={pending}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black/70"
                >
                  <option value="">Niveau…</option>
                  {diplomaLevels.map((l) => (
                    <option key={l.level} value={l.level}>
                      {l.level}
                    </option>
                  ))}
                </select>
                <span className="inline-flex items-center rounded-lg bg-black/[0.04] px-2 py-1 text-[11px] text-black/50">
                  Année : <strong className="ml-1">{academicYear ?? "—"}</strong>
                </span>
              </div>

              {/* Aperçu lecture seule */}
              {resolveState === "ok" && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-black/60">
                    Classe : <strong>{resolvedClass?.name}</strong>
                  </span>
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-black/60">
                    Inscription : <strong>{formatFCFA(previewReg)}</strong>
                  </span>
                  <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-black/60">
                    Scolarité :{" "}
                    <strong>{tuitionKnown ? formatFCFA(previewTuition as number) : "À confirmer"}</strong>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      tuitionKnown ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    Total :{" "}
                    <strong>
                      {tuitionKnown ? formatFCFA(previewReg + (previewTuition as number)) : "À confirmer"}
                    </strong>
                  </span>
                </div>
              )}
              {resolveState === "missing" && (
                <p className="mt-2 text-[11px] font-medium text-ipmd-red">
                  ⚠ Configuration académique manquante : aucune classe pour cette filière + ce niveau en{" "}
                  {academicYear ?? "l'année active"}.{" "}
                  <Link href="/espace/classes" className="underline">
                    Configurer dans Classes &amp; filières
                  </Link>
                </p>
              )}
              {resolveState === "duplicate" && (
                <p className="mt-2 text-[11px] font-medium text-ipmd-red">
                  ⚠ Doublon de classe : {candidates.length} classes pour cette filière + ce niveau.{" "}
                  <Link href="/espace/classes" className="underline">
                    Corriger dans Classes &amp; filières
                  </Link>
                </p>
              )}
              {resolveState === "ok" && !testMode && !tuitionKnown && (
                <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                  ⚠ Mode réel : renseigne le tarif de scolarité de cette classe/niveau pour pouvoir envoyer.
                </p>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {lettersEnabled ? (
              <button
                type="button"
                onClick={confirmAdmission}
                disabled={pending || (isDiplome && !canConfirm)}
                className={`${pill} bg-blue-600 text-white hover:bg-blue-700`}
              >
                📩 Confirmer l&apos;admission
              </button>
            ) : (
              <span className={disabledPill} title="Sera activé au Lot C">
                📩 Lettre d&apos;admission — Disponible après Lot C
              </span>
            )}
            {historical && (
              <button
                type="button"
                onClick={() => markNotified("admission")}
                disabled={pending}
                className={`${pill} bg-white text-black/60 ring-1 ring-black/10 hover:bg-black/5`}
              >
                Marquer déjà notifiée
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-black/45">
            {testMode
              ? "Mode test : l'email ne part que vers l'adresse de test autorisée (aucun vrai candidat)."
              : "Envoie la lettre d'admission (classe + frais figés) et passe « En attente de paiement »."}
          </p>
        </div>
      )}

      {current === "en_attente_paiement" && (
        <p className="mt-3 text-xs font-medium text-orange-700">
          📩 Admission envoyée — en attente du paiement.
        </p>
      )}

      {/* REFUSÉ — envoi officiel */}
      {isSuper && current === "refuse" && !refSent && (
        <div className="mt-3 rounded-xl bg-black/[0.03] p-3 ring-1 ring-black/10">
          <p className="text-[11px] font-bold uppercase tracking-wider text-black/50">
            Décision : refusé {testBadge}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {lettersEnabled ? (
              <button
                type="button"
                onClick={confirmRefusal}
                disabled={pending}
                className={`${pill} bg-ipmd-black text-white hover:opacity-90`}
              >
                📩 Confirmer le refus
              </button>
            ) : (
              <span className={disabledPill} title="Sera activé au Lot C">
                📩 Lettre de refus — Disponible après Lot C
              </span>
            )}
            {historical && (
              <button
                type="button"
                onClick={() => markNotified("refus")}
                disabled={pending}
                className={`${pill} bg-white text-black/60 ring-1 ring-black/10 hover:bg-black/5`}
              >
                Marquer déjà notifiée
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-black/45">
            {testMode
              ? "Mode test : l'email ne part que vers l'adresse de test autorisée (aucun vrai candidat)."
              : "Envoie la lettre de refus et verrouille la candidature."}
          </p>
        </div>
      )}

      {isSuper && current === "refuse" && refSent && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-black/50">
            🔒 Refus envoyé le {fmt(refSent)} — verrouillé.
          </span>
          <button
            type="button"
            onClick={reopenRefusal}
            disabled={pending}
            className={`${pill} text-black/55 ring-1 ring-black/15 hover:bg-black/5`}
          >
            ↩ Réouvrir (exceptionnel)
          </button>
        </div>
      )}

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

      {note && <p className="mt-2 text-xs font-medium text-green-600">{note}</p>}
      {error && <p className="mt-2 text-xs text-ipmd-red">{error}</p>}
    </div>
  );
}
