"use client";

import { useState, useTransition } from "react";
import {
  createPackLink,
  sendPackLink,
  revokePackLink,
} from "@/lib/admission-actions";

/**
 * Actions admin sur l'espace d'admission d'un candidat : copier/régénérer le
 * lien, l'envoyer par email (mode test respecté), ou le révoquer.
 * Visible dès qu'un pack existe (admission confirmée).
 */
export function AdmissionPackAdmin({
  candidatureId,
  email,
}: {
  candidatureId: string;
  email: string | null;
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
