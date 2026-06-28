"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import { UpcomingBootcampsGrid } from "@/components/ultraboost/UpcomingBootcamps";
import { AnnualAgenda } from "@/components/sections/AnnualAgenda";
import { getUpcoming } from "@/data/upcoming-bootcamps";
import { getAgenda } from "@/data/agenda";

type Panel = { id: string; icon: string; label: string; sublabel: string; render: () => ReactNode };

/**
 * Espace type « boîte mail » : liste de rubriques à gauche, contenu à droite.
 * Les rubriques apparaissent selon les données disponibles pour l'univers
 * (sessions à venir, agenda annuel, …). Réutilisable pour tout univers/certificat.
 */
export function ExperienceWorkspace({ universeId }: { universeId: string }) {
  const panels: Panel[] = [];

  const upcoming = getUpcoming(universeId);
  if (upcoming.length > 0) {
    panels.push({
      id: "prochains",
      icon: "📅",
      label: "Prochains bootcamps",
      sublabel: `${upcoming.length} session${upcoming.length > 1 ? "s" : ""} à venir`,
      render: () => <UpcomingBootcampsGrid universeId={universeId} />,
    });
  }

  const agenda = getAgenda(universeId);
  if (agenda) {
    panels.push({
      id: "agenda",
      icon: "🗓️",
      label: "Agenda annuel",
      sublabel: "Temps forts mensuels",
      render: () => <AnnualAgenda universeId={universeId} />,
    });
  }

  const [active, setActive] = useState(panels[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setBarVisible(entry.isIntersecting),
      { rootMargin: "-15% 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (panels.length === 0) return null;
  const current = panels.find((p) => p.id === active) ?? panels[0];

  return (
    <>
    <Section variant="light">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-ipmd-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          À ne pas manquer
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          Sessions, agenda & événements
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-black/60">
        Choisissez une rubrique : le contenu s&apos;affiche aussitôt. La barre des rubriques reste accessible
        pendant que vous faites défiler.
      </p>

      <div ref={rootRef} className="mt-8 lg:grid lg:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Liste latérale — reste fixe (sticky) sur desktop */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-col gap-2">
            {panels.map((p) => {
              const isActive = p.id === current.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActive(p.id)}
                    aria-current={isActive}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "border-ipmd-red/30 bg-white shadow-sm"
                        : "border-black/5 bg-ipmd-light hover:bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                        isActive ? "bg-ipmd-red/10" : "bg-white"
                      }`}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${isActive ? "text-ipmd-red" : "text-ipmd-black"}`}>
                        {p.label}
                      </span>
                      <span className="block truncate text-xs text-black/50">{p.sublabel}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Contenu */}
        <div className="min-w-0 pb-20 lg:pb-0">{current.render()}</div>
      </div>
    </Section>

    {/* Barre des rubriques — fixée en bas sur mobile (style application),
        visible uniquement quand la section est à l'écran */}
    <div
      className={`fixed bottom-4 left-4 right-20 z-40 lg:hidden transition-all duration-300 ${
        barVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/95 p-1.5 shadow-xl backdrop-blur">
        {panels.map((p) => {
          const isActive = p.id === current.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p.id)}
              aria-current={isActive}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-xs font-bold transition-colors ${
                isActive ? "bg-ipmd-red text-white" : "text-ipmd-black hover:bg-ipmd-light"
              }`}
            >
              <span className="text-base">{p.icon}</span>
              <span className="truncate">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}
