"use client";

import { useActionState } from "react";
import { prepareConventionDocument, signConvention } from "@/lib/convention-actions";
import { DocumentUpload } from "@/components/espace/DocumentUpload";
import type { FormResult } from "@/types";

const field =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

export type Submission = { id: string; original_name: string | null; uploaded_at: string | null; status: string };

function fmt(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function Msg({ state }: { state: FormResult | null }) {
  if (!state) return null;
  return <p className={`mt-1 text-xs font-medium ${state.ok ? "text-emerald-600" : "text-ipmd-red"}`}>{state.message}</p>;
}

/**
 * Flux de signature d'une convention a_signer (AG) :
 * 1) préparer le dépôt (dossier documentaire 'convention_stage') ;
 * 2) téléverser la copie signée (uploader EXISTANT, même bucket) ;
 * 3) sélectionner la version EXACTE signée + signer (convention_sign).
 */
export function ConventionSignPanel({
  conventionId,
  studentId,
  documentId,
  submissions,
}: {
  conventionId: string;
  studentId: string;
  documentId: string | null;
  submissions: Submission[];
}) {
  const [prepState, prepAction, prepPending] = useActionState<FormResult | null, FormData>(
    prepareConventionDocument.bind(null, studentId), null
  );
  const [signState, signAction, signPending] = useActionState<FormResult | null, FormData>(
    documentId ? signConvention.bind(null, conventionId, documentId) : async () => ({ ok: false, message: "Préparez d'abord le dépôt." }),
    null
  );

  if (!documentId) {
    return (
      <form action={prepAction} className="mt-2">
        <button type="submit" disabled={prepPending} className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {prepPending ? "…" : "Préparer le dépôt de la copie signée"}
        </button>
        <Msg state={prepState} />
      </form>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <div>
        <p className="text-xs font-semibold text-black/60">1. Téléverser la copie signée (PDF)</p>
        <div className="mt-1">
          <DocumentUpload studentId={studentId} studentDocumentId={documentId} label="convention signée" />
        </div>
      </div>

      <form action={signAction} className="space-y-2">
        <p className="text-xs font-semibold text-black/60">2. Sélectionner la version signée exacte et signer</p>
        {submissions.length === 0 ? (
          <p className="text-xs text-black/45">Aucun fichier déposé pour l&apos;instant.</p>
        ) : (
          <ul className="space-y-1">
            {submissions.map((s, i) => (
              <li key={s.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="submission_id" value={s.id} defaultChecked={i === 0} />
                  <span className="truncate">{s.original_name ?? "fichier"}</span>
                  <span className="text-xs text-black/40">{fmt(s.uploaded_at)}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <input name="reason" className={field} placeholder="Motif / référence (optionnel)" />
        <button
          type="submit"
          disabled={signPending || submissions.length === 0}
          className="rounded-lg bg-ipmd-red px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          onClick={(e) => {
            if (!window.confirm("Signer la convention avec le fichier sélectionné ? Action définitive.")) e.preventDefault();
          }}
        >
          {signPending ? "…" : "Signer la convention"}
        </button>
        <Msg state={signState} />
      </form>
    </div>
  );
}
