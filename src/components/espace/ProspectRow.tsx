"use client";

import { useActionState, useState, useTransition } from "react";
import {
  setProspectStatus,
  sendProspectInfo,
  logProspectWhatsApp,
  addProspectNote,
  convertProspectToCandidature,
  deleteProspect,
  draftProspectReply,
  sendProspectCustomEmail,
} from "@/lib/prospect-actions";
import { PROSPECT_STATUS, PROSPECT_STATUS_LIST, FORMAT_LABEL } from "@/lib/prospect";
import { Field, inputBase } from "@/components/forms/FormField";
import type { FormResult } from "@/types";

export type Prospect = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  program_interest: string | null;
  level_interest: string | null;
  format: string | null;
  source: string | null;
  message: string | null;
  status: string;
  note: string | null;
  created_at: string;
};

export function ProspectRow({ p }: { p: Prospect }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [noteState, noteAction] = useActionState<FormResult | null, FormData>(
    addProspectNote.bind(null, p.id),
    null
  );

  const wa = (p.whatsapp || p.phone || "").replace(/\D/g, "");
  const waText = encodeURIComponent(`Bonjour ${p.full_name}, ici l'équipe des admissions de l'IPMD.`);
  const st = PROSPECT_STATUS[p.status] ?? { label: p.status, cls: "bg-black/5 text-black/60" };

  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-ipmd-black">{p.full_name}</p>
          <p className="text-xs text-black/55">
            {[p.email, p.phone || p.whatsapp].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="mt-0.5 text-xs text-black/45">
            {[p.program_interest, p.level_interest, p.format ? FORMAT_LABEL[p.format] ?? p.format : null]
              .filter(Boolean)
              .join(" · ") || "Programme non précisé"}
            {p.source ? ` · source : ${p.source}` : ""}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
      </div>

      {p.message && <p className="mt-2 rounded-lg bg-ipmd-light px-3 py-2 text-xs italic text-black/60">« {p.message} »</p>}
      {p.note && <p className="mt-1 text-xs text-black/50">📝 {p.note}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Statut */}
        <select
          defaultValue={p.status}
          disabled={pending}
          onChange={(e) => start(() => setProspectStatus(p.id, e.target.value))}
          className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold text-ipmd-black"
        >
          {PROSPECT_STATUS_LIST.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>

        {/* Email d'info */}
        <button
          type="button"
          disabled={pending || !p.email}
          onClick={() => start(async () => setMsg((await sendProspectInfo(p.id)).message))}
          className="rounded-full bg-ipmd-black px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          ✉️ Email d&apos;info
        </button>

        {/* WhatsApp */}
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logProspectWhatsApp(p.id)}
            className="rounded-full bg-[#25D366] px-3 py-1 text-xs font-semibold text-white"
          >
            WhatsApp
          </a>
        ) : null}

        {/* Réponse IA (brouillon à valider) */}
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            setMsg(null);
            const r = await draftProspectReply(p.id);
            if (r.ok && r.draft) setDraft(r.draft);
            else setMsg(r.message ?? "Erreur IA.");
          })}
          className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          ✨ Réponse IA
        </button>

        {/* Conversion */}
        <button
          type="button"
          disabled={pending || !p.email}
          onClick={() => start(async () => setMsg((await convertProspectToCandidature(p.id)).message))}
          className="rounded-full bg-ipmd-red px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          → Candidature
        </button>

        <button
          type="button"
          onClick={() => { if (confirm(`Supprimer le prospect ${p.full_name} ?`)) start(() => deleteProspect(p.id)); }}
          className="ml-auto rounded-full px-2 py-1 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10"
        >
          Suppr.
        </button>
      </div>

      {msg && <p className="mt-2 text-xs font-medium text-green-700">{msg}</p>}

      {draft !== null && (
        <div className="mt-3 rounded-xl bg-purple-50 p-3 ring-1 ring-purple-200">
          <p className="mb-1.5 text-xs font-bold text-purple-700">
            ✨ Brouillon IA — relis et modifie avant d&apos;envoyer (les <span className="font-mono">[…]</span> sont à compléter)
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-purple-200 bg-white p-3 text-xs text-ipmd-black focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={pending || !p.email || !draft.trim()}
              onClick={() => start(async () => {
                const r = await sendProspectCustomEmail(p.id, draft);
                setMsg(r.message);
                if (r.ok) setDraft(null);
              })}
              className="rounded-full bg-ipmd-red px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {pending ? "…" : "✉️ Envoyer cet email"}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-black/50 hover:bg-black/5">
              Annuler
            </button>
            {!p.email && <span className="text-[11px] text-ipmd-red">Pas d&apos;email pour ce prospect</span>}
          </div>
        </div>
      )}

      <details className="mt-2 text-xs">
        <summary className="cursor-pointer font-semibold text-black/55">Ajouter une note de suivi</summary>
        <form action={noteAction} className="mt-2 flex gap-2">
          <input name="note" defaultValue={p.note ?? ""} placeholder="Relance prévue, remarque…" className={inputBase} />
          <button type="submit" className="shrink-0 rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white">OK</button>
        </form>
        {noteState && <p className={`mt-1 ${noteState.ok ? "text-green-700" : "text-ipmd-red"}`}>{noteState.message}</p>}
      </details>
    </li>
  );
}
