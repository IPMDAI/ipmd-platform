"use client";

import { useMemo, useState, useTransition } from "react";
import { sendFriendRequest } from "@/lib/social-actions";
import { roleLabels } from "@/lib/dashboards";

export type Member = { id: string; name: string; role: string };

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function FriendDirectory({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return members.slice(0, 20);
    return members.filter((m) => normalize(m.name).includes(q)).slice(0, 30);
  }, [members, query]);

  const add = (id: string) => {
    start(async () => {
      const r = await sendFriendRequest(id);
      if (r.ok) setSent((s) => new Set(s).add(id));
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un membre…"
        className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ipmd-black outline-none ring-ipmd-red/20 transition-shadow focus:ring-2"
      />
      {results.length === 0 ? (
        <p className="mt-4 text-sm text-black/45">Aucun membre trouvé.</p>
      ) : (
        <ul className="mt-4 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {results.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-ipmd-black">
                  {m.name}
                </p>
                <p className="text-xs text-black/50">
                  {roleLabels[m.role] ?? m.role}
                </p>
              </div>
              {sent.has(m.id) ? (
                <span className="shrink-0 text-xs font-semibold text-green-600">
                  ✓ Envoyée
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => add(m.id)}
                  disabled={pending}
                  className="shrink-0 rounded-full bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  + Ajouter
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
