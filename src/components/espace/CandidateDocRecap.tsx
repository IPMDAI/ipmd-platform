"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDocStatus } from "@/lib/dossier-actions";
import {
  CANDIDATE_DOCS,
  DOC_STATUS_META,
  DOC_SETTABLE_STATUSES,
  effectiveDocStatus,
  type DocKey,
  type DocStatusEntry,
} from "@/lib/candidate-docs";

/**
 * Récapitulatif des pièces : statut par document (Reçue / À vérifier / Validée /
 * À remplacer + motif). Les changements passent par `setDocStatus` (admin, jamais de
 * suppression de fichier ; « à remplacer » re-demande la pièce + motif obligatoire).
 */
export function CandidateDocRecap({
  candidatureId,
  provided,
  status,
  requested,
}: {
  candidatureId: string;
  provided: Record<DocKey, boolean>;
  status: Record<string, DocStatusEntry>;
  requested: string[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState<DocKey | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>("recue");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function openEdit(key: DocKey, eff: string, currentReason: string) {
    setEdit(key);
    setDraftStatus((DOC_SETTABLE_STATUSES as string[]).includes(eff) ? eff : "recue");
    setReason(currentReason || "");
    setMsg(null);
  }

  function save(key: DocKey) {
    setMsg(null);
    start(async () => {
      const res = await setDocStatus(candidatureId, key, draftStatus, reason);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setEdit(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">
        Récapitulatif des pièces
      </p>
      <ul className="mt-2 space-y-1.5">
        {CANDIDATE_DOCS.map((d) => {
          const entry = status[d.key] ?? {};
          const eff = effectiveDocStatus({
            explicit: entry.status,
            provided: provided[d.key],
            requested: requested.includes(d.key),
          });
          const meta = DOC_STATUS_META[eff] ?? DOC_STATUS_META.absente;
          const isEditing = edit === d.key;
          return (
            <li key={d.key} className="rounded-xl ring-1 ring-black/5 p-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ipmd-black">{d.short}</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${meta.cls}`}>
                    {meta.label}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      isEditing ? setEdit(null) : openEdit(d.key, eff, entry.reason ?? "")
                    }
                    className="text-[11px] font-semibold text-ipmd-red hover:underline"
                  >
                    {isEditing ? "Fermer" : "Modifier"}
                  </button>
                </div>
              </div>

              {entry.status === "a_remplacer" && entry.reason && !isEditing && (
                <p className="mt-1 text-[11px] text-ipmd-red">Motif : {entry.reason}</p>
              )}

              {isEditing && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value)}
                    className="rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-ipmd-red"
                  >
                    {DOC_SETTABLE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {DOC_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                  {draftStatus === "a_remplacer" && (
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Motif (ex. document illisible)"
                      className="min-w-[160px] flex-1 rounded-lg border border-black/15 bg-white px-2 py-1 text-xs outline-none focus:border-ipmd-red"
                    />
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => save(d.key)}
                    className="rounded-lg bg-ipmd-black px-3 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
                  >
                    Enregistrer
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {msg && (
        <p className={`mt-1 text-[11px] font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
