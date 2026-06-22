"use client";

import { useMemo, useState } from "react";

export type FicheRow = {
  id: string;
  course: string;
  date: string;
  theme: string | null;
  resources: string | null;
  present: number;
  total: number;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function FichesList({ fiches }: { fiches: FicheRow[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return fiches;
    return fiches.filter((f) =>
      normalize(`${f.course} ${f.theme ?? ""} ${f.resources ?? ""}`).includes(q)
    );
  }, [fiches, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un thème, un cours…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ipmd-black outline-none ring-ipmd-red/20 transition-shadow focus:ring-2 sm:max-w-sm"
        />
        <span className="text-sm text-black/45">
          {results.length} / {fiches.length} séance{fiches.length > 1 ? "s" : ""}
        </span>
      </div>

      {results.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
          Aucune fiche ne correspond.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {results.map((f) => {
            const rate =
              f.total > 0 ? Math.round((f.present / f.total) * 100) : null;
            return (
              <li
                key={f.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white">
                    {f.course}
                  </span>
                  <span className="text-xs text-black/45">
                    {formatDate(f.date)}
                  </span>
                </div>

                <p className="mt-3 font-bold text-ipmd-black">
                  {f.theme || "Séance"}
                </p>

                {f.resources && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-black/40">
                      Ressources distribuées
                    </p>
                    <p className="mt-1 whitespace-pre-line rounded-xl bg-ipmd-light px-4 py-3 text-sm leading-relaxed text-black/70">
                      {f.resources}
                    </p>
                  </div>
                )}

                {f.total > 0 && (
                  <p className="mt-3 text-sm text-black/55">
                    Présence : <span className="font-semibold text-ipmd-black">{f.present}/{f.total}</span>
                    {rate !== null && (
                      <span
                        className={`ml-2 font-bold ${
                          rate >= 90
                            ? "text-green-700"
                            : rate >= 75
                            ? "text-amber-600"
                            : "text-ipmd-red"
                        }`}
                      >
                        {rate}%
                      </span>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
