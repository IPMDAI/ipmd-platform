"use client";

import { useState } from "react";

/** Minuscule + sans accents (recherche tolérante aux accents/casse). */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Champ de recherche des candidatures (nom, email, téléphone, filière).
 *
 * Filtre EN DIRECT la liste déjà rendue côté serveur : chaque `<li data-search>`
 * est masqué/affiché selon la correspondance. Se combine donc naturellement avec
 * les filtres existants (type / univers / statut), qui déterminent la liste rendue.
 * Ne touche ni au workflow ni aux données.
 */
export function CandidatureSearch() {
  const [q, setQ] = useState("");
  const [empty, setEmpty] = useState(false);

  const apply = (value: string) => {
    setQ(value);
    const query = norm(value.trim());
    const items = document.querySelectorAll<HTMLElement>("li[data-search]");
    let visible = 0;
    items.forEach((el) => {
      const hay = el.getAttribute("data-search") || "";
      const show = !query || hay.includes(query);
      el.style.display = show ? "" : "none";
      if (show) visible += 1;
    });
    setEmpty(query.length > 0 && items.length > 0 && visible === 0);
  };

  return (
    <div className="mt-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/35">
          🔎
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => apply(e.target.value)}
          placeholder="Rechercher un candidat — nom, email, téléphone, filière…"
          aria-label="Rechercher une candidature"
          className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-9 pr-4 text-sm text-ipmd-black shadow-sm outline-none transition-colors focus:border-ipmd-red/40 focus:ring-2 focus:ring-ipmd-red/10"
        />
      </div>
      {empty && (
        <p className="mt-2 text-xs text-black/50">
          Aucun résultat pour «&nbsp;{q}&nbsp;» dans la sélection actuelle.
        </p>
      )}
    </div>
  );
}
