"use client";

import { useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { createUploadTicket } from "@/lib/upload-actions";
import {
  recordConventionPrinciple,
  uploadConventionScan,
} from "@/lib/admission-actions";
import {
  CONVENTION_TITLE,
  CONVENTION_ARTICLES,
} from "@/data/convention";

const MAX_FILE = 15 * 1024 * 1024;

/**
 * Étape « Convention de formation » (C4).
 * ⚠️ « nom + case + date » ne vaut PAS signature juridique : la signature réelle
 * se fait par dépôt d'un scan signé (ou, plus tard, via un prestataire).
 * L'accord de principe en ligne est explicitement NON CONTRAIGNANT.
 */
export function ConventionStep({
  token,
  packId,
  conventionStatus = "non_envoyee",
  signatureMethod = null,
  academicYear = null,
}: {
  token: string;
  packId: string;
  conventionStatus?: string;
  signatureMethod?: string | null;
  /** Année académique issue du snapshot du pack (jamais une constante codée en dur). */
  academicYear?: string | null;
}) {
  const [status, setStatus] = useState(conventionStatus);
  const [method, setMethod] = useState<string | null>(signatureMethod);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const signed = status === "signee";
  const principle = method === "accord_principe_non_contraignant";

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) return;
    if (file.size > MAX_FILE) {
      setMsg({ ok: false, text: "Fichier trop lourd (15 Mo max)." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("service");
      const ext = (file.name.split(".").pop() || "pdf")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const path = `${packId}/convention-signee.${ext}`;
      const ticket = await createUploadTicket(path);
      if (!ticket) throw new Error("ticket");
      const { error } = await supabase.storage
        .from("candidature-docs")
        .uploadToSignedUrl(path, ticket, file, { upsert: true });
      if (error) throw new Error("upload");
      const res = await uploadConventionScan(token, path);
      if (res.ok) {
        setStatus("signee");
        setMethod("scan_manuscrit");
        setMsg({ ok: true, text: res.message });
      } else setMsg({ ok: false, text: res.message });
    } catch {
      setMsg({ ok: false, text: "Échec du dépôt du fichier. Réessayez (PDF, JPG ou PNG)." });
    } finally {
      setBusy(false);
    }
  };

  const givePrinciple = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await recordConventionPrinciple(token);
    if (res.ok) {
      setMethod("accord_principe_non_contraignant");
      setMsg({ ok: true, text: res.message });
    } else setMsg({ ok: false, text: res.message });
    setBusy(false);
  };

  return (
    <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-black/10">
      <p className="text-sm font-bold text-ipmd-black">{CONVENTION_TITLE}</p>
      {academicYear && <p className="text-xs text-black/50">Année {academicYear}</p>}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-xs font-semibold text-ipmd-red hover:underline"
      >
        {open ? "▲ Masquer la convention" : "▼ Lire la convention"}
      </button>
      {open && (
        <div className="mt-2 max-h-72 overflow-y-auto rounded-lg bg-ipmd-light px-3 py-3 text-[13px] leading-relaxed text-black/75">
          {CONVENTION_ARTICLES.map((a) => (
            <div key={a.n} className="mb-3">
              <p className="font-semibold text-ipmd-black">
                Article {a.n} — {a.title}
              </p>
              {a.body.map((p, i) => (
                <p key={i} className="mt-1">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {signed ? (
        <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          ✅ Convention <strong>signée</strong> (document reçu). Merci !
        </div>
      ) : (
        <>
          {/* Disclaimer juridique */}
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-800 ring-1 ring-amber-200">
            ⚠️ La signature officielle de la convention se fait par un
            <strong> document signé (scan)</strong>. Une simple validation en
            ligne ne vaut <strong>pas</strong> signature juridique.
          </p>

          {/* Dépôt du scan signé */}
          <label
            className={`mt-3 flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ipmd-black px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
              busy ? "opacity-50" : ""
            }`}
          >
            {busy ? "Envoi…" : "⬆ Déposer ma convention signée (PDF/scan)"}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFile}
              disabled={busy}
              className="hidden"
            />
          </label>

          {/* Accord de principe (non contraignant) */}
          <div className="mt-3 border-t border-black/5 pt-3">
            {principle ? (
              <p className="text-xs text-black/55">
                ✔ Accord de principe donné <em>(non contraignant)</em> — en
                attente de la signature officielle.
              </p>
            ) : (
              <button
                type="button"
                onClick={givePrinciple}
                disabled={busy}
                className="text-xs font-semibold text-black/60 underline decoration-black/20 underline-offset-2 hover:text-ipmd-red disabled:opacity-50"
              >
                Donner un accord de principe (non contraignant)
              </button>
            )}
          </div>
        </>
      )}

      {msg && (
        <p className={`mt-2 text-xs font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
