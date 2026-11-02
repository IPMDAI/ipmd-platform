"use client";

import { useEffect, useRef } from "react";

/**
 * Zone de saisie de message AUTO-EXTENSIBLE : le champ grandit pendant la frappe
 * (rien ne se cache), avec une barre d'outils minimale (Gras) et le support des
 * retours à la ligne / listes (1. 2. 3.). `value` est stocké par le parent.
 */
export function MessageComposer({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`;
  }

  // Ajuste la hauteur quand la valeur change (frappe, insertion de gras, reset).
  useEffect(grow, [value]);

  function insertBold() {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    const sel = value.slice(s, e) || "texte";
    const next = `${value.slice(0, s)}**${sel}**${value.slice(e)}`;
    onChange(maxLength ? next.slice(0, maxLength) : next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + 2, s + 2 + sel.length);
      grow();
    });
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={insertBold}
          className="rounded-md bg-ipmd-light px-2 py-1 text-xs font-bold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
          title="Mettre en gras"
        >
          B
        </button>
        <span className="text-[10px] text-black/40">
          **gras** · Entrée = nouvelle ligne (listes 1. 2. 3.)
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={grow}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={3}
        className="block min-h-[80px] w-full resize-y overflow-hidden rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
      />
    </div>
  );
}
