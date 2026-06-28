"use client";

import { useState, type ReactNode } from "react";
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
  if (panels.length === 0) return null;
  const current = panels.find((p) => p.id === active) ?? panels[0];

  return (
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
        Parcourez les rubriques à gauche : cliquez pour afficher le détail à droite.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Liste (style boîte mail) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0">
            {panels.map((p) => {
              const isActive = p.id === current.id;
              return (
                <li key={p.id} className="shrink-0 lg:shrink">
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
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                        isActive ? "bg-ipmd-red/10" : "bg-white"
                      }`}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm font-bold ${isActive ? "text-ipmd-red" : "text-ipmd-black"}`}>
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
        <div className="min-w-0">{current.render()}</div>
      </div>
    </Section>
  );
}
