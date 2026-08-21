"use client";

import { useState, useTransition } from "react";
import {
  createPackLink,
  sendPackLink,
  revokePackLink,
} from "@/lib/admission-actions";

function fmt(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export type PackState = {
  sentAt: string | null;
  viewedAt: string | null;
  reglementAt: string | null;
  conventionStatus: string | null;
  signatureMethod: string | null;
};

function conventionBadge(
  status: string | null,
  method: string | null
): { label: string; cls: string } {
  if (status === "signee")
    return { label: "✍️ Convention signée", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  if (method === "accord_principe_non_contraignant")
    return {
      label: "✍️ Accord de principe (non contraignant)",
      cls: "bg-black/5 text-black/55 ring-black/10",
    };
  return { label: "✍️ Convention en attente", cls: "bg-amber-50 text-amber-700 ring-amber-200" };
}

const badge = "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1";

/**
 * Actions admin + états de l'espace d'admission d'un candidat. Affiche
 * l'avancement (envoyé / consulté / règlement / convention) et les actions
 * lien (copier/régénérer, envoyer, révoquer). Visible dès qu'un pack existe.
 */
export function AdmissionPackAdmin({
  candidatureId,
  email,
  pack = null,
  conventionUrl = null,
}: {
  candidatureId: string;
  email: string | null;
  pack?: PackState | null;
  conventionUrl?: string | null;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (pending) return;
    setMsg(null);
    start(async () => {
      const res = await createPackLink(candidatureId);
      if (res.ok && res.url) {
        try {
          await navigator.clipboard.writeText(res.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          /* presse-papier indisponible */
        }
      }
      setMsg({ ok: res.ok, text: res.message });
    });
  };

  const sendLink = () => {
    if (pending) return;
    if (!window.confirm("Envoyer le lien de l'espace d'admission au candidat ?"))
      return;
    setMsg(null);
    start(async () => {
      const res = await sendPackLink(candidatureId);
      setMsg({ ok: res.ok, text: res.message });
    });
  };

  const revoke = () => {
    if (pending) return;
    if (
      !window.confirm(
        "Révoquer le lien ?\nLe candidat n'y aura plus accès (il faudra en régénérer un)."
      )
    )
      return;
    setMsg(null);
    start(async () => {
      const res = await revokePackLink(candidatureId);
      setMsg({ ok: res.ok, text: res.message });
    });
  };

  const pill =
    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

  return (
    <div className="mt-3 rounded-xl bg-indigo-50/60 p-3 ring-1 ring-indigo-200">
      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
        🔗 Espace d&apos;admission
      </p>

      {/* États d'avancement (C5) */}
      {pack && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pack.sentAt && (
            <span className={`${badge} bg-blue-50 text-blue-700 ring-blue-200`}>
              📤 Envoyé {fmt(pack.sentAt)}
            </span>
          )}
          <span
            className={`${badge} ${
              pack.viewedAt
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-black/5 text-black/45 ring-black/10"
            }`}
          >
            {pack.viewedAt ? `👀 Consulté ${fmt(pack.viewedAt)}` : "👀 Non consulté"}
          </span>
          <span
            className={`${badge} ${
              pack.reglementAt
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-amber-200"
            }`}
          >
            {pack.reglementAt ? `📜 Règlement ${fmt(pack.reglementAt)}` : "📜 Règlement en attente"}
          </span>
          {(() => {
            const cb = conventionBadge(pack.conventionStatus, pack.signatureMethod);
            return <span className={`${badge} ${cb.cls}`}>{cb.label}</span>;
          })()}
          {conventionUrl && (
            <a
              href={conventionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${badge} bg-white text-ipmd-black ring-black/15 hover:ring-ipmd-red/40`}
            >
              📎 Voir la convention signée
            </a>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={pending}
          className={`${pill} bg-white text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/40`}
        >
          {copied ? "✅ Lien copié" : "🔗 Copier / régénérer le lien"}
        </button>
        <button
          type="button"
          onClick={sendLink}
          disabled={pending || !email}
          title={email ? `Envoyer à ${email}` : "Aucun email"}
          className={`${pill} bg-ipmd-black text-white hover:opacity-90`}
        >
          ✉️ Envoyer par email
        </button>
        <button
          type="button"
          onClick={revoke}
          disabled={pending}
          className={`${pill} text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/10`}
        >
          ⛔ Révoquer
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-black/45">
        « Copier / régénérer » crée un nouveau lien et révoque l&apos;ancien (1 seul actif).
      </p>
      {msg && (
        <p
          className={`mt-2 text-xs font-medium ${
            msg.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
