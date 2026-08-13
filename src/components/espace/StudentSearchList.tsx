"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type StudentSearchItem = {
  id: string;
  name: string;
  email: string;
  href: string;
};

/**
 * Liste d'étudiants avec recherche instantanée (nom ou email).
 * Évite de scroller tout l'annuaire pour trouver un étudiant.
 */
export function StudentSearchList({
  items,
  cta,
}: {
  items: StudentSearchItem[];
  cta: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.email.toLowerCase().includes(needle)
    );
  }, [q, items]);

  return (
    <div className="mt-6">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un étudiant (nom ou email)…"
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm shadow-sm outline-none ring-ipmd-red/20 transition focus:border-ipmd-red/40 focus:ring-2"
      />
      <p className="mt-2 text-xs text-black/45">
        {filtered.length} étudiant{filtered.length > 1 ? "s" : ""}
        {q.trim() ? ` sur ${items.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
          Aucun étudiant ne correspond à « {q} ».
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {filtered.map((s) => (
            <li key={s.id}>
              <Link
                href={s.href}
                className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-ipmd-light"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ipmd-black">
                    {s.name || "—"}
                  </p>
                  <p className="truncate text-sm text-black/50">{s.email}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ipmd-red">
                  {cta}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
