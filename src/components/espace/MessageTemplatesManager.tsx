"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  type MessageTemplateRow,
} from "@/lib/dossier-actions";
import { MessageComposer } from "@/components/ui/MessageComposer";
import { MessageText } from "@/components/ui/MessageText";

const inputCls =
  "w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ipmd-red focus:ring-2 focus:ring-ipmd-red/20";

/** Gestion des modèles de messages personnalisés (CRUD). Réservé aux admins. */
export function MessageTemplatesManager({ initial }: { initial: MessageTemplateRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Création
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  // Édition
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  function run(fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Création */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <h2 className="text-sm font-bold text-ipmd-black">Nouveau modèle</h2>
        <p className="mt-1 text-xs text-black/50">
          Variables : <code>{"{prenom}"}</code> et <code>{"{programme}"}</code> seront remplacés
          automatiquement.
        </p>
        <div className="mt-3 space-y-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre (ex. Bulletins manquants)"
            className={inputCls}
          />
          <MessageComposer value={newBody} onChange={setNewBody} placeholder="Message du modèle…" maxLength={4000} draftKey="ipmd-tpl-new" />
          <button
            type="button"
            disabled={pending || !newTitle.trim() || !newBody.trim()}
            onClick={() =>
              run(() => createMessageTemplate(newTitle.trim(), newBody.trim()), () => {
                setNewTitle("");
                setNewBody("");
              })
            }
            className="rounded-full bg-ipmd-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Créer le modèle
          </button>
        </div>
      </div>

      {/* Liste */}
      <div>
        <h2 className="text-sm font-bold text-ipmd-black">Mes modèles ({initial.length})</h2>
        {initial.length === 0 ? (
          <p className="mt-2 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
            Aucun modèle personnalisé pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {initial.map((t) => (
              <li key={t.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                {editId === t.id ? (
                  <div className="space-y-2">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
                    <MessageComposer value={editBody} onChange={setEditBody} maxLength={4000} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() => updateMessageTemplate(t.id, editTitle, editBody), () => setEditId(null))
                        }
                        className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
                      >
                        Enregistrer
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="text-xs font-semibold text-black/45 hover:underline">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-ipmd-black">{t.title}</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditId(t.id);
                            setEditTitle(t.title);
                            setEditBody(t.body);
                          }}
                          className="text-xs font-semibold text-ipmd-red hover:underline"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (confirm(`Supprimer le modèle « ${t.title} » ?`)) {
                              run(() => deleteMessageTemplate(t.id));
                            }
                          }}
                          className="text-xs font-semibold text-black/40 hover:text-ipmd-red"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                    <MessageText body={t.body} className="mt-2 text-sm text-black/70" />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {msg && (
        <p className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-ipmd-red"}`}>{msg.text}</p>
      )}
    </div>
  );
}
