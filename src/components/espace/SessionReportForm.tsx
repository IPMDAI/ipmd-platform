"use client";

import { useActionState } from "react";
import { saveSessionReport } from "@/lib/report-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import type { FormResult } from "@/types";

export type ReportData = {
  content?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  supports?: string | null;
  homework?: string | null;
  observations?: string | null;
  present_count?: number | null;
  absent_count?: number | null;
  validated?: boolean;
};

export function SessionReportForm({
  sessionId,
  report,
  editable = true,
}: {
  sessionId: string;
  report: ReportData;
  /** Faux quand on n'est pas le jour du cours (anti-triche). */
  editable?: boolean;
}) {
  const bound = saveSessionReport.bind(null, sessionId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const validated = report.validated === true;
  const locked = validated || !editable;

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-black/5 pt-3">
      {!editable && !validated && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          🔒 La fiche de suivi se remplit <strong>uniquement le jour du cours</strong>.
        </p>
      )}
      <Field label="Thèmes abordés" htmlFor={`c-${sessionId}`}>
        <textarea
          id={`c-${sessionId}`}
          name="content"
          rows={2}
          defaultValue={report.content ?? ""}
          disabled={locked}
          placeholder="Notions, chapitres traités…"
          className={inputBase}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Début réel" htmlFor={`as-${sessionId}`}>
          <input id={`as-${sessionId}`} name="actual_start" type="time" defaultValue={report.actual_start?.slice(0, 5) ?? ""} disabled={locked} className={inputBase} />
        </Field>
        <Field label="Fin réelle" htmlFor={`ae-${sessionId}`}>
          <input id={`ae-${sessionId}`} name="actual_end" type="time" defaultValue={report.actual_end?.slice(0, 5) ?? ""} disabled={locked} className={inputBase} />
        </Field>
        <Field label="Présents" htmlFor={`pc-${sessionId}`}>
          <input id={`pc-${sessionId}`} name="present_count" type="number" min="0" defaultValue={report.present_count ?? ""} disabled={locked} className={inputBase} />
        </Field>
        <Field label="Absents" htmlFor={`ac-${sessionId}`}>
          <input id={`ac-${sessionId}`} name="absent_count" type="number" min="0" defaultValue={report.absent_count ?? ""} disabled={locked} className={inputBase} />
        </Field>
      </div>
      <Field label="Documents distribués" htmlFor={`su-${sessionId}`}>
        <input id={`su-${sessionId}`} name="supports" defaultValue={report.supports ?? ""} disabled={locked} placeholder="Documents, supports, liens partagés…" className={inputBase} />
      </Field>
      <Field label="Travaux demandés (écrit / oral)" htmlFor={`hw-${sessionId}`}>
        <textarea id={`hw-${sessionId}`} name="homework" rows={2} defaultValue={report.homework ?? ""} disabled={locked} placeholder="Devoirs, exposés, exercices à rendre…" className={inputBase} />
      </Field>
      <Field label="Observations" htmlFor={`o-${sessionId}`}>
        <input id={`o-${sessionId}`} name="observations" defaultValue={report.observations ?? ""} disabled={locked} className={inputBase} />
      </Field>

      {validated ? (
        <p className="text-sm font-semibold text-green-700">
          ✅ Fiche validée par la Pédagogie (non modifiable).
        </p>
      ) : !editable ? null : (
        <ActionButton type="submit" disabled={pending}>
          {pending ? "…" : "Enregistrer la fiche"}
        </ActionButton>
      )}
      {state && (
        <p className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
