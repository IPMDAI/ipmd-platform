"use client";

import { useState, useTransition } from "react";
import {
  updateApplicationStatus,
  analyzeApplication,
  updateContractLink,
} from "@/lib/recruitment-actions";
import { APPLICATION_STATUSES } from "@/lib/recruitment";

export type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  availability: string | null;
  syllabus: string | null;
  cv_url: string | null;
  diploma_url: string | null;
  authorization_url: string | null;
  message: string | null;
  status: string;
  ai_summary: string | null;
  contract_url: string | null;
  created_at: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DocLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full bg-ipmd-light px-2.5 py-1 text-xs font-semibold text-ipmd-black hover:text-ipmd-red"
    >
      {label} ↗
    </a>
  );
}

export function RecruitmentList({ applications }: { applications: Application[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; ok: boolean; text: string } | null>(
    null
  );
  const [contractVals, setContractVals] = useState<Record<string, string>>(
    Object.fromEntries(applications.map((a) => [a.id, a.contract_url ?? ""]))
  );

  function saveContract(id: string) {
    startTransition(async () => {
      await updateContractLink(id, contractVals[id] ?? "");
    });
  }

  function changeStatus(id: string, status: string) {
    startTransition(async () => {
      await updateApplicationStatus(id, status);
    });
  }

  function analyze(id: string) {
    setBusyId(id);
    setMsg(null);
    startTransition(async () => {
      const res = await analyzeApplication(id);
      setMsg({ id, ok: res.ok, text: res.message });
      setBusyId(null);
    });
  }

  if (applications.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Aucune candidature pour le moment.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {applications.map((a) => (
        <li
          key={a.id}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-ipmd-black">{a.full_name}</h3>
              <p className="text-sm text-black/55">
                {a.subject || "Matière non précisée"} · {formatDate(a.created_at)}
              </p>
            </div>
            <select
              defaultValue={a.status}
              onChange={(e) => changeStatus(a.id, e.target.value)}
              disabled={pending}
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-medium text-ipmd-black outline-none focus:border-ipmd-red disabled:opacity-50"
            >
              {APPLICATION_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <a href={`mailto:${a.email}`} className="font-medium text-ipmd-black hover:text-ipmd-red">
              ✉️ {a.email}
            </a>
            {a.phone && (
              <a href={`tel:${a.phone}`} className="font-medium text-ipmd-black hover:text-ipmd-red">
                📞 {a.phone}
              </a>
            )}
            {a.availability && (
              <span className="text-black/55">🗓️ {a.availability}</span>
            )}
          </div>

          {(a.cv_url || a.diploma_url || a.authorization_url) && (
            <div className="mt-3 flex flex-wrap gap-2">
              <DocLink href={a.cv_url} label="CV" />
              <DocLink href={a.diploma_url} label="Diplômes" />
              <DocLink href={a.authorization_url} label="Autorisation" />
            </div>
          )}

          {/* Contrat */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-black/45">Contrat :</span>
            <input
              value={contractVals[a.id] ?? ""}
              onChange={(e) =>
                setContractVals((v) => ({ ...v, [a.id]: e.target.value }))
              }
              placeholder="Lien du contrat (https://…)"
              className="min-w-[200px] flex-1 rounded-lg border border-black/15 px-3 py-1.5 text-sm outline-none focus:border-ipmd-red"
            />
            <button
              type="button"
              onClick={() => saveContract(a.id)}
              disabled={pending}
              className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Enregistrer
            </button>
            {a.contract_url && (
              <a
                href={a.contract_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-ipmd-red"
              >
                Voir ↗
              </a>
            )}
          </div>

          {a.syllabus && (
            <details className="mt-3 rounded-xl bg-ipmd-light p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ipmd-black">
                Syllabus proposé
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/70">
                {a.syllabus}
              </p>
            </details>
          )}

          {a.message && (
            <p className="mt-3 whitespace-pre-line text-sm italic text-black/55">
              « {a.message} »
            </p>
          )}

          {/* Analyse IA */}
          <div className="mt-4 border-t border-black/5 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => analyze(a.id)}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busyId === a.id ? "🤖 Analyse en cours…" : "🤖 Analyser avec l'IA"}
              </button>
              {msg?.id === a.id && !msg.ok && (
                <span className="text-sm font-medium text-ipmd-red">
                  {msg.text}
                </span>
              )}
            </div>

            {a.ai_summary && (
              <div className="mt-3 rounded-xl bg-ipmd-red/5 p-4 ring-1 ring-ipmd-red/10">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ipmd-red">
                  Analyse IA
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-black/75">
                  {a.ai_summary}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
