"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitDocument } from "@/lib/student-document-actions";
import {
  STUDENT_DOCS_BUCKET,
  ALLOWED_DOC_TYPES,
  ALLOWED_DOC_HINT,
  MAX_DOC_SIZE,
  extForType,
} from "@/lib/student-documents";

/** Dépôt d'une nouvelle version d'un document (parent / étudiant). */
export function DocumentUpload({
  studentId,
  studentDocumentId,
  label,
}: {
  studentId: string;
  studentDocumentId: string;
  label: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;
    if (!ALLOWED_DOC_TYPES.includes(file.type)) {
      setMsg(`Format non accepté (${ALLOWED_DOC_HINT}).`);
      return;
    }
    if (file.size > MAX_DOC_SIZE) {
      setMsg("Fichier trop lourd (10 Mo max).");
      return;
    }
    const supabase = createClient();
    if (!supabase) {
      setMsg("Service indisponible.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const submissionId = crypto.randomUUID();
      const path = `${studentId}/${studentDocumentId}/${submissionId}.${extForType(file.type)}`;
      const { error } = await supabase.storage
        .from(STUDENT_DOCS_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const res = await submitDocument(studentDocumentId, submissionId, path, file.name);
      if (!res.ok) throw new Error(res.message);
      setMsg("Document déposé ✓");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec du dépôt.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90">
        {busy ? "Dépôt…" : "📎 Téléverser"}
      </span>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={onPick}
        disabled={busy}
        className="hidden"
        aria-label={`Téléverser ${label}`}
      />
      {msg && (
        <span className="text-[11px] font-medium text-black/55">{msg}</span>
      )}
    </label>
  );
}
