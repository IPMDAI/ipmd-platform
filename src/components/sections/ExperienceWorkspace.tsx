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
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
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
        <span className="lg:hidden">Choisissez une rubrique pour afficher son détail.</span>
        <span className="hidden lg:inline">Parcourez les rubriques à gauche : cliquez pour afficher le détail à droite.</span>
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Liste (style boîte mail) — plein écran sur mobile, rail à gauche sur desktop */}
        <aside
          className={`${mobileView === "detail" ? "hidden lg:block" : "block"} lg:sticky lg:top-24 lg:self-start`}
        >
          <ul className="flex flex-col gap-2">
            {panels.map((p) => {
              const isActive = p.id === current.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(p.id);
                      setMobileView("detail");
                    }}
                    aria-current={isActive}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "border-ipmd-red/30 bg-white shadow-sm lg:bg-white"
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
                      <span className={`block text-sm font-bold ${isActive ? "text-ipmd-red lg:text-ipmd-red" : "text-ipmd-black"}`}>
                        {p.label}
                      </span>
                      <span className="block truncate text-xs text-black/50">{p.sublabel}</span>
                    </span>
                    <span className="shrink-0 text-lg text-black/25 lg:hidden">›</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Contenu */}
        <div className={`${mobileView === "list" ? "hidden lg:block" : "block"} min-w-0`}>
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-ipmd-light px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/5 transition-colors hover:bg-white lg:hidden"
          >
            ← Toutes les rubriques
          </button>
          {current.render()}
        </div>
      </div>
    </Section>
  );
}
