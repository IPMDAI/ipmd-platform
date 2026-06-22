"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type CommandItem = {
  label: string;
  href: string;
  icon: string;
  group?: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier (⌘K / Ctrl+K) + ouverture via événement.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ipmd:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ipmd:open-search", onOpen);
    };
  }, []);

  // Réinitialise à l'ouverture.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (it) =>
        normalize(it.label).includes(q) ||
        (it.group ? normalize(it.group).includes(q) : false)
    );
  }, [items, query]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[active];
      if (item) go(item.href);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-black/10 px-4">
          <span className="text-lg text-black/40">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page, un module…"
            className="w-full bg-transparent py-4 text-sm text-ipmd-black outline-none placeholder:text-black/35"
          />
          <kbd className="hidden rounded border border-black/15 px-1.5 py-0.5 text-[10px] text-black/40 sm:block">
            Échap
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-black/45">
              Aucun résultat pour « {query} ».
            </li>
          ) : (
            results.map((it, i) => (
              <li key={it.href + it.label}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(it.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    i === active
                      ? "bg-ipmd-red text-white"
                      : "text-ipmd-black hover:bg-ipmd-light"
                  }`}
                >
                  <span className="text-base leading-none">{it.icon}</span>
                  <span className="flex-1 truncate font-medium">{it.label}</span>
                  {it.group && (
                    <span
                      className={`shrink-0 text-xs ${
                        i === active ? "text-white/70" : "text-black/35"
                      }`}
                    >
                      {it.group}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
