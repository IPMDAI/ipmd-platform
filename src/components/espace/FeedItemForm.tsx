"use client";

import { useActionState } from "react";
import { upsertFeedItem } from "@/lib/feed-actions";
import { ActionButton } from "@/components/ui/Button";
import type { FeedKind } from "@/data/feed";
import type { FormResult } from "@/types";

export type FeedRow = {
  id: string;
  kind: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  summary: string | null;
  icon: string | null;
  image_url: string | null;
  href: string | null;
  date_label: string | null;
  reading_time: string | null;
  deadline: string | null;
  status: string | null;
  meta: string[] | null;
  tags: string[] | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
};

const STATUS_OPTIONS = ["Candidatures ouvertes", "Bientôt clôturé", "Terminé"];
const input = "w-full rounded-lg border border-black/15 px-3 py-2 text-sm";
const labelCls = "block text-xs font-bold uppercase tracking-wide text-black/50";

export function FeedItemForm({
  kind,
  categories,
  item,
}: {
  kind: FeedKind;
  categories: string[];
  item?: FeedRow | null;
}) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(upsertFeedItem, null);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-ipmd-black">
        {item ? "✏️ Modifier l'élément" : "➕ Ajouter un élément"}
      </h3>
      <input type="hidden" name="kind" value={kind} />
      {item && <input type="hidden" name="id" value={item.id} />}

      <div>
        <label className={labelCls}>Titre *</label>
        <input name="title" required defaultValue={item?.title ?? ""} className={input} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{kind === "jobs" ? "Entreprise" : "Sous-titre"}</label>
          <input name="subtitle" defaultValue={item?.subtitle ?? ""} className={input} />
        </div>
        <div>
          <label className={labelCls}>Catégorie</label>
          <select name="category" defaultValue={item?.category ?? ""} className={input}>
            <option value="">— Choisir —</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Résumé</label>
        <textarea name="summary" rows={2} defaultValue={item?.summary ?? ""} className={input} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Icône (emoji)</label>
          <input name="icon" defaultValue={item?.icon ?? ""} placeholder="📰" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Image (URL, optionnel)</label>
          <input name="image_url" defaultValue={item?.image_url ?? ""} className={input} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Date affichée</label>
          <input name="date_label" defaultValue={item?.date_label ?? ""} placeholder="Juin 2026" className={input} />
        </div>
        {kind === "news" && (
          <div>
            <label className={labelCls}>Temps de lecture</label>
            <input name="reading_time" defaultValue={item?.reading_time ?? ""} placeholder="3 min" className={input} />
          </div>
        )}
        {kind !== "news" && (
          <div>
            <label className={labelCls}>Date limite</label>
            <input name="deadline" defaultValue={item?.deadline ?? ""} placeholder="Clôture août 2026" className={input} />
          </div>
        )}
      </div>

      <div>
        <label className={labelCls}>Statut (optionnel)</label>
        <input name="status" defaultValue={item?.status ?? ""} list="feed-status-options" placeholder={kind === "opportunities" ? "Candidatures ouvertes" : "À la une, Nouveau…"} className={input} />
        <datalist id="feed-status-options">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Étiquettes affichées (séparées par des virgules)</label>
          <input name="meta" defaultValue={(item?.meta ?? []).join(", ")} placeholder="CDI, Abidjan, Hybride" className={input} />
        </div>
        <div>
          <label className={labelCls}>Mots-clés de filtrage (virgules)</label>
          <input name="tags" defaultValue={(item?.tags ?? []).join(", ")} placeholder="Emploi, Hybride, Développement" className={input} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Lien externe (optionnel)</label>
          <input name="href" defaultValue={item?.href ?? ""} className={input} />
        </div>
        <div>
          <label className={labelCls}>Ordre</label>
          <input name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} className={input} />
        </div>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={item ? item.published : true} className="h-4 w-4" />
            Publié
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={item?.featured ?? false} className="h-4 w-4" />
            En avant
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ActionButton type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : item ? "Enregistrer les modifications" : "Ajouter"}
        </ActionButton>
        {item && (
          <a href={`/espace/contenus?kind=${kind}`} className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            Annuler
          </a>
        )}
        {state && (
          <span className={`text-sm font-medium ${state.ok ? "text-green-600" : "text-ipmd-red"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
