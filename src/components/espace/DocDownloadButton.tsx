"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STUDENT_DOCS_BUCKET } from "@/lib/student-documents";

/** Télécharge un fichier privé via une URL signée courte (parent / étudiant / staff). */
export function DocDownloadButton({
  path,
  label = "Voir le fichier",
}: {
  path: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const open = async () => {
    const supabase = createClient();
    if (!supabase) {
      setErr("Service indisponible.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase.storage
        .from(STUDENT_DOCS_BUCKET)
        .createSignedUrl(path, 300);
      if (error || !data?.signedUrl) throw error ?? new Error("Lien indisponible.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErr("Accès refusé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40 disabled:opacity-40"
    >
      {busy ? "…" : err ?? `📄 ${label}`}
    </button>
  );
}
