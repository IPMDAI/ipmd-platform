"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { Section } from "@/components/ui/Section";
import { UpcomingBootcampsGrid } from "@/components/ultraboost/UpcomingBootcamps";
import { AnnualAgenda } from "@/components/sections/AnnualAgenda";
import { HubSkills } from "@/components/sections/HubSkills";
import { Webinaires } from "@/components/sections/Webinaires";
import { FeedBoard } from "@/components/sections/FeedBoard";
import { getUpcoming } from "@/data/upcoming-bootcamps";
import { getAgenda } from "@/data/agenda";
import { getHubSkills } from "@/data/hubskills";
import { getWebinaires } from "@/data/webinaires";
import { getNews, getJobs, getOpportunities, type Feed } from "@/data/feed";

type Panel = { id: string; icon: string; label: string; short: string; sublabel: string; render: () => ReactNode };

/**
 * Espace type « boîte mail » : liste de rubriques à gauche, contenu à droite.
 * Les rubriques apparaissent selon les données disponibles pour l'univers
 * (sessions à venir, agenda annuel, …). Réutilisable pour tout univers/certificat.
 */
export function ExperienceWorkspace({
  universeId,
  eyebrow = "À ne pas manquer",
  title = "Sessions, agenda & événements",
  intro = "Choisissez une rubrique : le contenu s'affiche aussitôt. La barre des rubriques reste accessible pendant que vous faites défiler.",
  feeds,
}: {
  universeId: string;
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** Fils News/Jobs/Opportunities résolus côté serveur (sinon contenu statique). */
  feeds?: { news?: Feed | null; jobs?: Feed | null; opportunities?: Feed | null };
}) {
  const panels: Panel[] = [];

  const upcoming = getUpcoming(universeId);
  if (upcoming.length > 0) {
    panels.push({
      id: "prochains",
      icon: "📅",
      label: "Prochains bootcamps",
      short: "Bootcamps",
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
      short: "Agenda",
      sublabel: "Temps forts mensuels",
      render: () => <AnnualAgenda universeId={universeId} />,
    });
  }

  const webinaires = getWebinaires(universeId);
  if (webinaires) {
    panels.push({
      id: "webinaires",
      icon: "🎥",
      label: "Webinaires",
      short: "Webinaire",
      sublabel: "Sessions en ligne",
      render: () => <Webinaires universeId={universeId} />,
    });
  }

  const hubskills = getHubSkills(universeId);
  if (hubskills) {
    panels.push({
      id: "hubskills",
      icon: hubskills.icon ?? "💡",
      label: hubskills.eyebrow,
      short: hubskills.eyebrow,
      sublabel: "Réseau, compétences & accompagnement",
      render: () => <HubSkills universeId={universeId} />,
    });
  }

  const news = feeds?.news ?? getNews(universeId);
  if (news) {
    panels.push({ id: "news", icon: "📰", label: "IPMD News", short: "News", sublabel: "Actus digital & IA", render: () => <FeedBoard feed={news} filters={false} actions={false} limit={4} moreHref={news.pageHref} /> });
  }
  const jobs = feeds?.jobs ?? getJobs(universeId);
  if (jobs) {
    panels.push({ id: "jobs", icon: "💼", label: "IPMD Jobs", short: "Jobs", sublabel: "Emplois, stages, freelance", render: () => <FeedBoard feed={jobs} filters={false} actions={false} limit={4} moreHref={jobs.pageHref} /> });
  }
  const opportunities = feeds?.opportunities ?? getOpportunities(universeId);
  if (opportunities) {
    panels.push({ id: "opportunities", icon: "🌍", label: "IPMD Opportunities", short: "Opportunités", sublabel: "Bourses, concours, projets", render: () => <FeedBoard feed={opportunities} filters={false} actions={false} limit={4} moreHref={opportunities.pageHref} /> });
  }

  const [active, setActive] = useState(panels[0]?.id ?? "");
  const contentRef = useRef<HTMLDivElement>(null);
  const hasPanels = panels.length > 0;

  /** Onglet de la barre du bas (mobile) : change le contenu ET défile jusqu'à lui. */
  function selectAndScroll(id: string) {
    setActive(id);
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Réserve de l'espace en bas de page (mobile) pour la barre persistante.
  useEffect(() => {
    if (!hasPanels) return;
    document.body.classList.add("has-workspace-bar");
    return () => document.body.classList.remove("has-workspace-bar");
  }, [hasPanels]);

  if (!hasPanels) return null;
  const current = panels.find((p) => p.id === active) ?? panels[0];

  return (
    <>
    <Section variant="light">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-ipmd-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-ipmd-black sm:text-3xl">
          {title}
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-black/60">{intro}</p>

      <div className="mt-8 lg:grid lg:gap-6 lg:grid-cols-[280px_1fr]">
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
        <div ref={contentRef} className="min-w-0 scroll-mt-24 pb-20 lg:pb-0">{current.render()}</div>
      </div>
    </Section>

    {/* Menu du bas — pleine largeur, persistant, style application mobile (TikTok/Insta) */}
    <nav
      aria-label="Rubriques"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div className="flex items-stretch border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(0,0,0,0.10)] backdrop-blur">
        {panels.map((p) => {
          const isActive = p.id === current.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectAndScroll(p.id)}
              aria-current={isActive}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors ${
                isActive ? "text-ipmd-red" : "text-ipmd-black/55"
              }`}
            >
              {isActive && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-ipmd-red" />}
              <span className="text-xl leading-none">{p.icon}</span>
              <span>{p.short}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
