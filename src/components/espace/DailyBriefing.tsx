"use client";

import { useState, useTransition } from "react";

type Result =
  | { ok: true; summary: string }
  | { ok: false; message: string };

export function DailyBriefing() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  const run = () => {
    start(async () => {
      try {
        const res = await fetch("/api/daily-summary", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.summary) {
          setResult({ ok: true, summary: data.summary });
        } else {
          setResult({
            ok: false,
            message: data.error || "Une erreur est survenue. Réessaie.",
          });
        }
      } catch {
        setResult({ ok: false, message: "Connexion impossible. Réessaie." });
      }
    });
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="font-bold text-ipmd-black">Synthèse IA du jour</h3>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Analyse…" : result ? "Régénérer" : "Générer"}
        </button>
      </div>

      {!result && !pending && (
        <p className="mt-3 text-sm text-black/55">
          Claude analyse l&apos;état de l&apos;établissement (validations,
          candidatures, conflits de planning) et te donne les priorités du jour.
        </p>
      )}

      {result?.ok ? (
        <div className="mt-4 whitespace-pre-line rounded-xl bg-ipmd-light p-4 text-sm leading-relaxed text-ipmd-black">
          {result.summary}
        </div>
      ) : result ? (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
