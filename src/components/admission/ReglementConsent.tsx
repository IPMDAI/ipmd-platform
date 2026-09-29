"use client";

import { useState, useTransition } from "react";
import { acceptPackReglement } from "@/lib/admission-actions";
import { getReglement } from "@/data/reglement";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Consentement au règlement intérieur (C3). Le candidat lit le texte, coche la
 * case, valide → enregistre date + version. CONSENTEMENT, pas signature.
 */
export function ReglementConsent({
  token,
  acceptedAt = null,
  priorAcceptedAt = null,
  priorLabel = null,
  isBootcamp = false,
}: {
  token: string;
  acceptedAt?: string | null;
  /** Acceptation d'une AUTRE version (ex. Diplôme) : traçabilité, ne vaut pas
   * acceptation de la version en vigueur → l'accusé de lecture reste demandé. */
  priorAcceptedAt?: string | null;
  priorLabel?: string | null;
  /** Certifiant/bootcamp → règlement « Bootcamps & Certificats » ; sinon Diplôme. */
  isBootcamp?: boolean;
}) {
  const reglement = getReglement(isBootcamp);
  const [accepted, setAccepted] = useState<string | null>(acceptedAt);
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (accepted) {
    return (
      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
        ✅ Règlement intérieur <strong>accepté</strong> le {fmt(accepted)}.
      </div>
    );
  }

  const submit = () => {
    if (!checked || pending) return;
    setError(null);
    start(async () => {
      const res = await acceptPackReglement(token);
      if (res.ok) setAccepted(new Date().toISOString());
      else setError(res.message);
    });
  };

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-black/10">
      <p className="text-sm font-bold text-ipmd-black">{reglement.title}</p>
      <p className="text-xs text-black/50">Année {reglement.year}</p>

      {priorAcceptedAt && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Vous aviez accepté le règlement <strong>{priorLabel ?? "précédent"}</strong> le{" "}
          {fmt(priorAcceptedAt)}. Le règlement applicable à votre formation est désormais le{" "}
          <strong>{reglement.title}</strong> : merci d&apos;en accuser lecture ci-dessous. Votre
          acceptation précédente reste enregistrée.
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-semibold text-ipmd-red hover:underline"
        >
          {open ? "▲ Masquer le règlement" : "▼ Lire le règlement intérieur"}
        </button>
        {/* Vrai téléchargement PDF (lien signé, avant création de compte). */}
        <a
          href={`/admission/pack/reglement/pdf?t=${encodeURIComponent(token)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-ipmd-black hover:underline"
        >
          ⬇️ Télécharger le règlement (PDF)
        </a>
      </div>

      {open && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg bg-ipmd-light px-3 py-3 text-[13px] leading-relaxed text-black/75">
          {reglement.articles.map((a) => (
            <div key={a.n} className="mb-3">
              <p className="font-semibold text-ipmd-black">
                Article {a.n} — {a.title}
              </p>
              {a.body.map((p, i) => (
                <p key={i} className="mt-1">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-black/80">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-ipmd-red"
        />
        <span>
          J&apos;ai lu et j&apos;accepte le règlement intérieur de l&apos;IPMD.
        </span>
      </label>

      <button
        type="button"
        onClick={submit}
        disabled={!checked || pending}
        className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-full bg-ipmd-red px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Valider mon acceptation"}
      </button>

      {error && <p className="mt-2 text-xs text-ipmd-red">{error}</p>}
    </div>
  );
}
