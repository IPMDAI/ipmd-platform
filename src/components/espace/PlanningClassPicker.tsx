"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Cls = {
  id: string;
  name: string;
  level: string | null;
  academic_year: string | null;
};

const LEVEL_ORDER = ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2"];

export function PlanningClassPicker({
  classes,
  defaultYear,
}: {
  classes: Cls[];
  defaultYear: string;
}) {
  const years = useMemo(
    () =>
      [...new Set(classes.map((c) => c.academic_year).filter(Boolean) as string[])]
        .sort()
        .reverse(),
    [classes]
  );
  const levels = useMemo(() => {
    const present = new Set(
      classes.map((c) => c.level).filter(Boolean) as string[]
    );
    const ordered = LEVEL_ORDER.filter((l) => present.has(l));
    const others = [...present].filter((l) => !LEVEL_ORDER.includes(l)).sort();
    return [...ordered, ...others];
  }, [classes]);

  const [query, setQuery] = useState("");
  const [year, setYear] = useState<string>(
    years.includes(defaultYear) ? defaultYear : "all"
  );
  const [level, setLevel] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classes.filter(
      (c) =>
        (year === "all" || c.academic_year === year) &&
        (level === "all" || c.level === level) &&
        (q === "" || c.name.toLowerCase().includes(q))
    );
  }, [classes, query, year, level]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-bold ring-1 transition-colors ${
      active
        ? "bg-ipmd-black text-white ring-ipmd-black"
        : "bg-white text-black/60 ring-black/10 hover:ring-ipmd-red/40"
    }`;

  return (
    <div className="mt-6">
      {/* Recherche */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une classe (nom, filière)…"
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ipmd-black shadow-sm outline-none transition-colors focus:border-ipmd-red/50 focus:ring-2 focus:ring-ipmd-red/10"
      />

      {/* Filtre Année */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-black/45">Année :</span>
        <button type="button" onClick={() => setYear("all")} className={chip(year === "all")}>
          Toutes
        </button>
        {years.map((y) => (
          <button key={y} type="button" onClick={() => setYear(y)} className={chip(year === y)}>
            {y}
          </button>
        ))}
      </div>

      {/* Filtre Niveau */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-black/45">Niveau :</span>
        <button type="button" onClick={() => setLevel("all")} className={chip(level === "all")}>
          Tous
        </button>
        {levels.map((l) => (
          <button key={l} type="button" onClick={() => setLevel(l)} className={chip(level === l)}>
            {l}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-black/45">
        {filtered.length} classe{filtered.length > 1 ? "s" : ""} affichée
        {filtered.length > 1 ? "s" : ""}
        {year !== "all" ? ` · ${year}` : ""}
        {level !== "all" ? ` · ${level}` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
          Aucune classe ne correspond à ta recherche.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                href={`/espace/planning/${c.id}`}
                className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
              >
                <h2 className="text-base font-bold text-ipmd-black">{c.name}</h2>
                <p className="text-xs text-black/50">
                  {[c.level, c.academic_year].filter(Boolean).join(" · ") || "—"}
                </p>
                <span className="mt-2 inline-block text-xs font-semibold text-ipmd-red">
                  Construire le planning →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
