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

      <div className="mt-8 grid grid-cols-[92px_1fr] gap-4 sm:grid-cols-[220px_1fr] sm:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Liste (style boîte mail) — toujours à gauche, compacte sur mobile */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-col gap-2">
            {panels.map((p) => {
              const isActive = p.id === current.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setActive(p.id)}
                    aria-current={isActive}
                    className={`flex w-full flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition-colors sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:text-left ${
                      isActive
                        ? "border-ipmd-red/30 bg-white shadow-sm"
                        : "border-black/5 bg-ipmd-light hover:bg-white"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg sm:h-10 sm:w-10 ${
                        isActive ? "bg-ipmd-red/10" : "bg-white"
                      }`}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[11px] font-bold leading-tight sm:truncate sm:text-sm ${isActive ? "text-ipmd-red" : "text-ipmd-black"}`}>
                        {p.label}
                      </span>
                      <span className="hidden truncate text-xs text-black/50 sm:block">{p.sublabel}</span>
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
