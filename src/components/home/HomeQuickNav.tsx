"use client";

import Link from "next/link";
import { useEffect } from "react";

const ITEMS = [
  { href: "/news", icon: "📰", label: "News" },
  { href: "/jobs", icon: "💼", label: "Jobs" },
  { href: "/opportunities", icon: "🌍", label: "Opportunités" },
];

/**
 * Barre fixe en bas (mobile) — raccourcis vers les pages entières
 * IPMD News / Jobs / Opportunities. N'affiche AUCUN contenu sur l'accueil :
 * chaque bouton ouvre sa page dédiée.
 */
export function HomeQuickNav() {
  // Réserve de l'espace en bas de page (mobile) pour ne pas masquer le footer.
  useEffect(() => {
    document.body.classList.add("has-workspace-bar");
    return () => document.body.classList.remove("has-workspace-bar");
  }, []);

  return (
    <nav aria-label="Actu & Opportunités" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
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
      </div>
    </nav>
  );
}
