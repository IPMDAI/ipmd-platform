"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createAnnouncement } from "@/lib/announcement-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { AUDIENCES, TARGET_TYPES } from "@/lib/announcements";
import { NIVEAUX } from "@/lib/referentiel";
import { UNIVERSE_OPTIONS } from "@/data/universes";
import type { FormResult } from "@/types";

export function NewAnnouncementForm({
  filieres,
}: {
  filieres: string[];
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    createAnnouncement,
    null
  );
  const [target, setTarget] = useState("all");
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setTarget("all");
    }
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Nouvelle annonce</h2>
      <Field label="Titre" htmlFor="a-title" required>
        <input
          id="a-title"
          name="title"
          required
          placeholder="Ex. Fermeture exceptionnelle vendredi"
          className={inputBase}
        />
      </Field>
      <Field label="Message" htmlFor="a-body" required>
        <textarea
          id="a-body"
          name="body"
          required
          rows={4}
          placeholder="Votre message…"
          className={inputBase}
        />
      </Field>
      <Field label="Destinataires" htmlFor="a-audience">
        <select id="a-audience" name="audience" defaultValue="all" className={inputBase}>
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Cible" htmlFor="a-target">
        <select
          id="a-target"
          name="target_type"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={inputBase}
        >
          {TARGET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      {target === "filiere" && (
        <Field label="Filière" htmlFor="a-filiere" required>
          <select id="a-filiere" name="target_filiere" required className={inputBase}>
            {filieres.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>
      )}
      {target === "niveau" && (
        <Field label="Niveau" htmlFor="a-niveau" required>
          <select id="a-niveau" name="target_niveau" required className={inputBase}>
            {NIVEAUX.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </Field>
      )}
      {target === "univers" && (
        <Field label="Univers" htmlFor="a-univers" required>
          <select id="a-univers" name="target_univers" required className={inputBase}>
            {UNIVERSE_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <label className="flex items-center gap-2 text-sm text-black/70">
        <input
          type="checkbox"
          name="notify"
          defaultChecked
          className="h-4 w-4 rounded border-black/20 text-ipmd-red focus:ring-ipmd-red"
        />
        Envoyer aussi par email aux destinataires
      </label>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "Publication…" : "Publier l'annonce"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
