"use client";

import { useActionState } from "react";
import { setHostCompanyArchived } from "@/lib/internship-actions";
import type { FormResult } from "@/types";

export type HostCompany = {
  id: string;
  name: string;
  sector: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  status: string;
};

/** Carte entreprise : infos publiques + bouton archiver/réactiver (RPC gardée). */
export function HostCompanyCard({ company }: { company: HostCompany }) {
  const archived = company.status === "archive";
  const action = setHostCompanyArchived.bind(null, company.id, !archived);
  const [state, formAction, pending] = useActionState<FormResult | null, FormData>(action, null);

  return (
    <li className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-ipmd-black">{company.name}</p>
          <p className="mt-0.5 text-sm text-black/55">
            {[company.sector, company.city, company.country].filter(Boolean).join(" · ") || "—"}
          </p>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-xs text-sky-700 underline"
            >
              {company.website}
            </a>
          )}
        </div>
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            archived
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
              : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          }`}
        >
          {archived ? "Archivée" : "Active"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
        <form
          action={formAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                archived
                  ? "Réactiver cette entreprise ? Elle redeviendra sélectionnable pour de nouveaux stages."
                  : "Archiver cette entreprise ? Elle ne sera plus proposée pour de nouveaux stages (les stages existants restent liés)."
              )
            )
              e.preventDefault();
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-black/15 transition-colors hover:bg-black/5 disabled:opacity-60"
          >
            {pending ? "…" : archived ? "♻️ Réactiver" : "🗄️ Archiver"}
          </button>
        </form>
        {state && !state.ok && (
          <p className="w-full text-xs font-medium text-ipmd-red">{state.message}</p>
        )}
      </div>
    </li>
  );
}
