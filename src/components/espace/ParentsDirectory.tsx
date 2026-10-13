"use client";

import { useMemo, useState } from "react";
import { ParentMessageForm } from "@/components/espace/ParentMessageForm";

export type DirectoryParent = {
  id: string;
  full_name: string | null;
  email: string;
  profession: string | null;
  fonction: string | null;
  entreprise: string | null;
  ville: string | null;
  pays: string | null;
  comm_opt_commercial: boolean;
  childCount: number;
};

type Filter = "tous" | "opt_in" | "avec_enfant" | "sans_enfant";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "avec_enfant", label: "Avec enfant lié" },
  { value: "sans_enfant", label: "Sans enfant" },
  { value: "opt_in", label: "Opt-in offres" },
];

export function ParentsDirectory({ parents }: { parents: DirectoryParent[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("tous");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return parents.filter((p) => {
      if (filter === "opt_in" && !p.comm_opt_commercial) return false;
      if (filter === "avec_enfant" && p.childCount === 0) return false;
      if (filter === "sans_enfant" && p.childCount > 0) return false;
      if (!needle) return true;
      const hay = [
        p.full_name,
        p.email,
        p.profession,
        p.fonction,
        p.entreprise,
        p.ville,
        p.pays,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [parents, q, filter]);

  return (
    <div className="mt-10">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-ipmd-black">Annuaire des parents</h2>
        <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-xs font-bold text-white">
          {filtered.length}
          {filtered.length !== parents.length ? ` / ${parents.length}` : ""}
        </span>
      </div>

      {/* Recherche + filtres */}
      <div className="mb-4 space-y-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un parent (nom, email, profession, entreprise, ville…)"
          className="w-full rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-ipmd-red/40"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "bg-ipmd-red text-white"
                  : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
          Aucun parent ne correspond.
        </p>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {filtered.map((p) => {
            const pro = [p.fonction, p.entreprise].filter(Boolean).join(" · ");
            const loc = [p.ville, p.pays].filter(Boolean).join(", ");
            return (
              <li key={p.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ipmd-black">
                      {p.full_name || p.email}
                      <span className="ml-2 rounded-full bg-ipmd-light px-2 py-0.5 text-[10px] font-bold text-black/55">
                        {p.childCount} enfant{p.childCount > 1 ? "s" : ""}
                      </span>
                    </p>
                    <p className="text-xs text-black/50">
                      {p.email}
                      {p.profession ? ` · ${p.profession}` : ""}
                      {pro ? ` · ${pro}` : ""}
                      {loc ? ` · ${loc}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.comm_opt_commercial
                        ? "bg-green-600/10 text-green-700"
                        : "bg-black/5 text-black/45"
                    }`}
                    title="Consentement aux communications commerciales / opportunités"
                  >
                    {p.comm_opt_commercial ? "Opt-in offres" : "Pas d'offres"}
                  </span>
                </div>
                <ParentMessageForm parentId={p.id} parentName={p.full_name || p.email} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
