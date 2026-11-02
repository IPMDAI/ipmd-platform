"use client";

import { useEffect, useRef } from "react";

export type ComposerTemplate = { label: string; text: string };

/**
 * Zone de saisie de message AUTO-EXTENSIBLE (rien ne se cache) avec mise en forme
 * légère (gras **…**, italique *…*, puces, numérotation), retours à la ligne / listes
 * préservés, modèles en 1 clic, brouillon automatique (par `draftKey`) et envoi
 * rapide Ctrl/⌘ + Entrée. `value` est stocké par le parent.
 */
export function MessageComposer({
  value,
  onChange,
  placeholder,
  maxLength,
  templates,
  onSubmit,
  draftKey,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  templates?: ComposerTemplate[];
  onSubmit?: () => void;
  /** Clé de brouillon (localStorage) : restaure le message en cours par fiche. */
  draftKey?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);

  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`;
  }

  useEffect(grow, [value]);

  // Brouillon : au montage, restaure si le champ est vide ; ensuite, sauvegarde/efface.
  useEffect(() => {
    if (!draftKey || hydrated.current) return;
    hydrated.current = true;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && !value) onChange(saved);
    } catch {
      /* localStorage indisponible */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey || !hydrated.current) return;
    try {
      if (value) localStorage.setItem(draftKey, value);
      else localStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
  }, [value, draftKey]);

  function clamp(s: string) {
    return maxLength ? s.slice(0, maxLength) : s;
  }

  /** Entoure la sélection d'un marqueur (** gras, * italique). */
  function wrap(marker: string) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    const sel = value.slice(s, e) || "texte";
    const next = `${value.slice(0, s)}${marker}${sel}${marker}${value.slice(e)}`;
    onChange(clamp(next));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + marker.length, s + marker.length + sel.length);
      grow();
    });
  }

  /** Préfixe chaque ligne de la sélection (puce « • » ou numérotation « 1. »). */
  function prefixLines(kind: "bullet" | "number") {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    let lineEnd = value.indexOf("\n", e);
    if (lineEnd === -1) lineEnd = value.length;
    const block = value.slice(lineStart, lineEnd) || "élément";
    const lines = block.split("\n");
    const out = lines
      .map((l, i) => (kind === "bullet" ? `• ${l}` : `${i + 1}. ${l}`))
      .join("\n");
    const next = value.slice(0, lineStart) + out + value.slice(lineEnd);
    onChange(clamp(next));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + out.length);
      grow();
    });
  }

  const toolBtn =
    "rounded-md bg-ipmd-light px-2 py-1 text-xs text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40";

  return (
    <div>
      {templates && templates.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {templates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onChange(clamp(t.text))}
              className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
              title="Insérer ce modèle (éditable ensuite)"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => wrap("**")} className={`${toolBtn} font-bold`} title="Gras">
          B
        </button>
        <button type="button" onClick={() => wrap("*")} className={`${toolBtn} italic`} title="Italique">
          I
        </button>
        <button type="button" onClick={() => prefixLines("bullet")} className={toolBtn} title="Puces">
          • Liste
        </button>
        <button type="button" onClick={() => prefixLines("number")} className={toolBtn} title="Numérotation">
          1. Liste
        </button>
        <span className="text-[10px] text-black/40">
          **gras** · *italique*{onSubmit ? " · Ctrl+Entrée = envoyer" : ""}
        </span>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={grow}
        onKeyDown={(e) => {
          if (onSubmit && (e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={3}
        className="block min-h-[80px] w-full resize-y overflow-hidden rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20"
      />
    </div>
  );
}
