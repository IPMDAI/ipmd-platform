import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { deleteFeedItem, toggleFeedFlag } from "@/lib/feed-actions";
import { FeedItemForm, type FeedRow } from "@/components/espace/FeedItemForm";
import { FEED_KIND_META, feedCategories, type FeedKind } from "@/data/feed";

const KINDS: FeedKind[] = ["news", "jobs", "opportunities"];

export default async function ContenusPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; edit?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const kind: FeedKind = (KINDS as string[]).includes(sp.kind ?? "") ? (sp.kind as FeedKind) : "news";

  const { data } = await supabase
    .from("feed_items")
    .select("*")
    .eq("kind", kind)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as FeedRow[];
  const editing = sp.edit ? rows.find((r) => r.id === sp.edit) ?? null : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ipmd-black">Actu & Opportunités</h1>
        <p className="mt-1 text-sm text-black/55">
          Gérez IPMD News, Jobs et Opportunities affichés sur le site (accueil + pages dédiées).
        </p>
      </div>

      {/* Onglets par type */}
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Link
            key={k}
            href={`/espace/contenus?kind=${k}`}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              k === kind ? "bg-ipmd-red text-white" : "bg-ipmd-light text-black/60 hover:bg-black/5"
            }`}
          >
            {FEED_KIND_META[k].icon} {FEED_KIND_META[k].label}
          </Link>
        ))}
      </div>

      <FeedItemForm kind={kind} categories={feedCategories(kind)} item={editing} />

      {/* Liste */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-black/50">
          {rows.length} élément{rows.length > 1 ? "s" : ""}
        </h2>
        {rows.length === 0 && (
          <p className="rounded-2xl bg-ipmd-light p-6 text-center text-sm text-black/55">
            Aucun élément. Le site affiche le contenu par défaut tant que rien n&apos;est publié ici.
          </p>
        )}
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
          >
            <span className="text-xl">{r.icon ?? "•"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ipmd-black">{r.title}</p>
              <p className="truncate text-xs text-black/50">
                {[r.category, r.subtitle, r.date_label, r.status].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.published ? "bg-green-100 text-green-700" : "bg-black/10 text-black/50"}`}>
                {r.published ? "Publié" : "Brouillon"}
              </span>
              {r.featured && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">En avant</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/espace/contenus?kind=${kind}&edit=${r.id}`} className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black hover:bg-black/5">
                Modifier
              </Link>
              <form action={toggleFeedFlag.bind(null, r.id, "published", !r.published)}>
                <button type="submit" className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black hover:bg-black/5">
                  {r.published ? "Dépublier" : "Publier"}
                </button>
              </form>
              <form action={toggleFeedFlag.bind(null, r.id, "featured", !r.featured)}>
                <button type="submit" className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black hover:bg-black/5">
                  {r.featured ? "Retirer" : "Mettre en avant"}
                </button>
              </form>
              <form action={deleteFeedItem.bind(null, r.id)}>
                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-ipmd-red ring-1 ring-ipmd-red/30 hover:bg-ipmd-red/10">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
