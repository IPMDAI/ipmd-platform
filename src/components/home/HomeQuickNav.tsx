"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const ITEMS = [
  { href: "/news", icon: "📰", label: "News" },
  { href: "/jobs", icon: "💼", label: "Jobs" },
  { href: "/opportunities", icon: "🌍", label: "Opportunités" },
];

// Sous-menu « Admission » (s'ouvre vers le haut depuis la barre du bas).
const ADMISSION_LINKS = [
  {
    href: "/demande-info",
    label: "Demande d'information",
    desc: "Recevoir la brochure & les infos",
  },
  {
    href: "/admission",
    label: "Candidature / Inscription",
    desc: "Déposer mon dossier en ligne",
  },
];

/**
 * Barre fixe en bas (mobile) — raccourcis vers les pages entières
 * IPMD News / Jobs / Opportunities + un menu « Admission » qui ouvre
 * (vers le haut) « Demande d'information » et « Candidature / Inscription ».
 */
export function HomeQuickNav() {
  const [open, setOpen] = useState(false);

  // Réserve de l'espace en bas de page (mobile) pour ne pas masquer le footer.
  useEffect(() => {
    document.body.classList.add("has-workspace-bar");
    return () => document.body.classList.remove("has-workspace-bar");
  }, []);

  return (
    <>
      {/* Voile pour fermer le sous-menu en tapant à côté */}
      {open && (
        <button
          type="button"
          aria-label="Fermer le menu Admission"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      <nav
        aria-label="Actu, Opportunités & Admission"
        className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
      >
        {/* Sous-menu Admission (ouverture vers le haut) */}
        {open && (
          <div className="mx-3 mb-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
            <p className="border-b border-black/5 bg-ipmd-light px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-ipmd-red">
              🎓 Admission
            </p>
            {ADMISSION_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-black/5 px-4 py-3 last:border-0 hover:bg-ipmd-light"
              >
                <span className="block text-sm font-semibold text-ipmd-black">
                  {l.label}
                </span>
                <span className="block text-xs text-black/50">{l.desc}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-stretch border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.10)] backdrop-blur">
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold text-ipmd-black/70 transition-colors hover:text-ipmd-red"
            >
              <span className="text-xl leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          ))}

          {/* Admission — ouvre le sous-menu vers le haut */}
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors ${
              open ? "text-ipmd-red" : "text-ipmd-black/70 hover:text-ipmd-red"
            }`}
          >
            <span className="text-xl leading-none">🎓</span>
            <span className="flex items-center gap-0.5">
              Admission
              <span
                aria-hidden
                className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
