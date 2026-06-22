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
  observations?: string | null;
  present_count?: number | null;
  absent_count?: number | null;
  validated?: boolean;
};

export function SessionReportForm({
  sessionId,
  report,
}: {
  sessionId: string;
  report: ReportData;
}) {
  const bound = saveSessionReport.bind(null, sessionId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const locked = report.validated === true;

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-black/5 pt-3">
      <Field label="Contenu enseigné" htmlFor={`c-${sessionId}`}>
        <textarea
          id={`c-${sessionId}`}
          name="content"
          rows={2}
          defaultValue={report.content ?? ""}
          disabled={locked}
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
      <Field label="Supports / liens partagés" htmlFor={`su-${sessionId}`}>
        <input id={`su-${sessionId}`} name="supports" defaultValue={report.supports ?? ""} disabled={locked} placeholder="Documents, vidéos, liens…" className={inputBase} />
      </Field>
      <Field label="Observations" htmlFor={`o-${sessionId}`}>
        <input id={`o-${sessionId}`} name="observations" defaultValue={report.observations ?? ""} disabled={locked} className={inputBase} />
      </Field>

      {locked ? (
        <p className="text-sm font-semibold text-green-700">
          ✅ Fiche validée par la Pédagogie (non modifiable).
        </p>
      ) : (
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
