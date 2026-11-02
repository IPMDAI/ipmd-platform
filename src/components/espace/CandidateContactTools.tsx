"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  requestDocuments,
  sendDossierLinkEmail,
  revokeDossierLink,
  sendCandidateMessage,
  markCandidateMessagesRead,
  markDocsReviewed,
  type ThreadMessage,
} from "@/lib/dossier-actions";
import {
  CANDIDATE_DOCS,
  buildDocsWhatsappText,
  buildHelloWhatsappText,
  waLink,
  type DocKey,
  type DocStatusEntry,
} from "@/lib/candidate-docs";
import { CandidateDocRecap } from "@/components/espace/CandidateDocRecap";
import { MessageComposer } from "@/components/ui/MessageComposer";
import { MessageText } from "@/components/ui/MessageText";
import { teamMessageTemplates } from "@/lib/message-templates";

function time(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  candidatureId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  program: string | null;
  link: string;
  provided: Record<DocKey, boolean>;
  requestedDocs: string[];
  docStatus: Record<string, DocStatusEntry>;
  messages: ThreadMessage[];
  unread: number;
  newDeposit: boolean;
  submittedAt: string | null;
};

export function CandidateContactTools(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(props.unread > 0 || props.newDeposit);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  // Pré-coché = pièce manquante. Une pièce fournie peut être cochée pour remplacement.
  const [checked, setChecked] = useState<Record<DocKey, boolean>>(() => {
    const init = {} as Record<DocKey, boolean>;
    for (const d of CANDIDATE_DOCS) init[d.key] = !props.provided[d.key];
    return init;
  });
  const selectedKeys = CANDIDATE_DOCS.filter((d) => checked[d.key]).map((d) => d.key);

  const [reply, setReply] = useState("");

  const firstName = (props.name || "").split(" ")[0] || "";
  const waText =
    selectedKeys.length > 0
      ? buildDocsWhatsappText({ firstName, program: props.program, docKeys: selectedKeys, link: props.link })
      : buildHelloWhatsappText({ firstName, program: props.program });
  const waHref = waLink(props.whatsapp || props.phone, waText);

  function run(fn: () => Promise<{ ok: boolean; message: string }>, closeOnOk = false) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        router.refresh();
        if (closeOnOk) setReply("");
      }
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(props.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMsg({ ok: false, text: "Copie impossible — sélectionnez le lien manuellement." });
    }
  }

  const btn =
    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40";

  return (
    <div className="mt-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-bold text-ipmd-black">💬 Communication &amp; pièces</span>
        <span className="flex items-center gap-1.5">
          {props.unread > 0 && (
            <span className="rounded-full bg-ipmd-red px-2 py-0.5 text-[10px] font-bold text-white">
              {props.unread} non lu{props.unread > 1 ? "s" : ""}
            </span>
          )}
          {props.newDeposit && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
              Nouveau dépôt
            </span>
          )}
          <span className="text-black/40">{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          {/* 1. Demander des pièces */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">
              Demander des pièces
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CANDIDATE_DOCS.map((d) => (
                <label
                  key={d.key}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ${
                    checked[d.key]
                      ? "bg-ipmd-red/10 text-ipmd-red ring-ipmd-red/25"
                      : "bg-white text-black/60 ring-black/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked[d.key]}
                    onChange={(e) => setChecked((c) => ({ ...c, [d.key]: e.target.checked }))}
                    className="accent-ipmd-red"
                  />
                  {d.short}
                  {props.provided[d.key] && (
                    <span className="text-[9px] text-black/40">(fourni)</span>
                  )}
                </label>
              ))}
            </div>
            <button
              type="button"
              disabled={pending || selectedKeys.length === 0}
              onClick={() => run(() => requestDocuments(props.candidatureId, selectedKeys))}
              className={`${btn} mt-2 bg-ipmd-black text-white hover:opacity-90`}
            >
              📎 Enregistrer la demande
            </button>
          </div>

          {/* Récapitulatif des pièces (statut par document) */}
          <CandidateDocRecap
            candidatureId={props.candidatureId}
            provided={props.provided}
            status={props.docStatus}
            requested={props.requestedDocs}
          />

          {/* 2. Partager le lien sécurisé */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">
              Lien sécurisé (dépôt + échange, sans compte)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className={`${btn} bg-ipmd-light text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/40`}>
                {copied ? "Copié ✓" : "📋 Copier le lien"}
              </button>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btn} bg-green-600 text-white hover:opacity-90`}
                >
                  🟢 WhatsApp
                </a>
              ) : (
                <span className={`${btn} bg-black/5 text-black/35`}>🟢 WhatsApp (pas de numéro)</span>
              )}
              <button
                type="button"
                disabled={pending || !props.email}
                onClick={() => run(() => sendDossierLinkEmail(props.candidatureId))}
                className={`${btn} bg-ipmd-black text-white hover:opacity-90`}
              >
                ✉️ Envoyer par email
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm("Révoquer le lien ? Les liens déjà envoyés cesseront de fonctionner.")) {
                    run(() => revokeDossierLink(props.candidatureId));
                  }
                }}
                className={`${btn} bg-white text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/5`}
              >
                ⟲ Révoquer
              </button>
            </div>
            <p className="mt-1.5 break-all text-[10px] text-black/35">{props.link}</p>
            <p className="mt-0.5 text-[10px] text-black/40">
              Sans email : copiez le lien et envoyez-le par SMS, ou partagez-le sur WhatsApp. Lien valable 30 jours, révocable.
            </p>
          </div>

          {/* 3. Conversation */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">
                Conversation
              </p>
              {props.unread > 0 && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => markCandidateMessagesRead(props.candidatureId))}
                  className="text-[11px] font-semibold text-ipmd-red hover:underline"
                >
                  Marquer comme lu
                </button>
              )}
            </div>
            {props.messages.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {props.messages.map((m) => {
                  const fromTeam = m.sender === "admin";
                  const isUnread = m.sender === "candidate";
                  return (
                    <li key={m.id} className={`flex ${fromTeam ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                          fromTeam
                            ? "bg-ipmd-light text-ipmd-black ring-1 ring-black/5"
                            : "bg-ipmd-black text-white"
                        }`}
                      >
                        <MessageText body={m.body} className="leading-relaxed" />
                        <p className={`mt-1 text-[9px] ${fromTeam ? "text-black/40" : "text-white/50"}`}>
                          {fromTeam ? m.author_name || "IPMD" : "Candidat"} · {time(m.created_at)}
                          {fromTeam && (m.read_at ? " · ✓ Lu" : " · Envoyé")}
                          {isUnread && " · 🔴"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-black/40">Aucun message pour l&apos;instant.</p>
            )}

            <div className="mt-2">
              <MessageComposer
                value={reply}
                onChange={setReply}
                placeholder="Répondre au candidat…"
                maxLength={4000}
                draftKey={`ipmd-msgdraft-${props.candidatureId}`}
                templates={teamMessageTemplates({ firstName, program: props.program })}
                onSubmit={() => {
                  if (reply.trim())
                    run(() => sendCandidateMessage(props.candidatureId, reply.trim()), true);
                }}
              />
              <button
                type="button"
                disabled={pending || reply.trim().length === 0}
                onClick={() => run(() => sendCandidateMessage(props.candidatureId, reply.trim()), true)}
                className={`${btn} mt-1.5 bg-ipmd-red text-white hover:opacity-90`}
              >
                Envoyer le message
              </button>
            </div>
          </div>

          {/* 4. Pièces reçues → vérifier */}
          {props.newDeposit && (
            <div className="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <p className="text-xs font-semibold text-amber-900">
                📎 Nouvelles pièces reçues{props.submittedAt ? ` le ${time(props.submittedAt)}` : ""}.
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => markDocsReviewed(props.candidatureId))}
                className={`${btn} mt-2 bg-amber-600 text-white hover:opacity-90`}
              >
                ✓ Marquer comme vérifiées
              </button>
            </div>
          )}

          {msg && (
            <p className={`text-xs font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>
              {msg.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
