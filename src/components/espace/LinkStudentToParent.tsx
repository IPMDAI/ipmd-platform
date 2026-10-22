"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchStudentsForLink, linkStudentToParent } from "@/lib/admin-actions";
import { PARENT_RELATIONSHIPS } from "@/lib/academic";

type Student = { id: string; full_name: string | null; email: string; matricule: string | null };

/**
 * Bouton « + Lier un étudiant » sur une fiche parent : recherche un étudiant
 * EXISTANT (nom/prénom, email, matricule), choisit la relation, confirme le lien.
 * Ne crée aucun compte, ne modifie aucune donnée académique. Anti-doublon : les
 * étudiants déjà rattachés sont exclus des résultats, et la base rejette un lien
 * en double (contrainte d'unicité).
 */
export function LinkStudentToParent({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[] | null>(null);
  const [rel, setRel] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [searching, startSearch] = useTransition();
  const [linking, startLink] = useTransition();

  function runSearch() {
    setMsg(null);
    startSearch(async () => {
      const r = await searchStudentsForLink(parentId, query);
      setResults(r);
    });
  }

  function doLink(s: Student) {
    setMsg(null);
    startLink(async () => {
      const res = await linkStudentToParent(parentId, s.id, rel[s.id] || null);
      if (res.ok) {
        setMsg({ ok: true, text: `${s.full_name || s.email} rattaché(e).` });
        setResults((prev) => (prev ? prev.filter((x) => x.id !== s.id) : prev));
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.message });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        + Lier un étudiant
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-ipmd-black">Lier un étudiant existant</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-semibold text-black/45 hover:text-ipmd-red"
        >
          Fermer
        </button>
      </div>
      <p className="mt-1 text-[12px] text-black/50">
        Recherche par nom, prénom, email ou matricule. Le rattachement ne modifie pas
        l&apos;inscription académique de l&apos;étudiant.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Nom, prénom, email ou matricule…"
          className="w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
        />
        <button
          type="button"
          onClick={runSearch}
          disabled={searching || query.trim().length < 2}
          className="shrink-0 rounded-xl bg-ipmd-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {searching ? "…" : "Rechercher"}
        </button>
      </div>

      {msg && (
        <p className={`mt-3 text-sm font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}

      {results != null && (
        <div className="mt-3">
          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/15 bg-black/[0.015] p-3 text-[13px] text-black/50">
              Aucun étudiant trouvé (ou déjà rattaché à ce parent).
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl ring-1 ring-black/10 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ipmd-black">{s.full_name || s.email}</p>
                    <p className="text-xs text-black/45">
                      {s.email}
                      {s.matricule ? ` · ${s.matricule}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={rel[s.id] ?? ""}
                      onChange={(e) => setRel((p) => ({ ...p, [s.id]: e.target.value }))}
                      className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-ipmd-red"
                    >
                      <option value="">Relation (optionnel)</option>
                      {PARENT_RELATIONSHIPS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => doLink(s)}
                      disabled={linking}
                      className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    >
                      {linking ? "…" : "Lier"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
