import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getStaticFeed, type Feed, type FeedItem, type FeedKind } from "@/data/feed";

type Row = {
  id: string;
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
  featured: boolean | null;
};

function mapRow(r: Row): FeedItem {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    category: r.category ?? "",
    summary: r.summary ?? "",
    icon: r.icon ?? undefined,
    image: r.image_url ?? undefined,
    href: r.href ?? undefined,
    date: r.date_label ?? undefined,
    readingTime: r.reading_time ?? undefined,
    deadline: r.deadline ?? undefined,
    status: r.status ?? undefined,
    meta: r.meta ?? [],
    tags: r.tags ?? [],
    featured: r.featured ?? false,
  };
}

/**
 * Renvoie un fil (News/Jobs/Opportunities) avec les éléments PUBLIÉS de la
 * base. Si la base n'est pas configurée, absente ou vide, on retombe sur le
 * contenu statique par défaut (le site reste toujours rempli).
 */
export async function resolveFeed(kind: FeedKind): Promise<Feed> {
  const base = getStaticFeed(kind);
  const supabase = await createClient();
  if (!supabase) return base;

  const { data, error } = await supabase
    .from("feed_items")
    .select("id,title,subtitle,category,summary,icon,image_url,href,date_label,reading_time,deadline,status,meta,tags,featured")
    .eq("kind", kind)
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return base;
  return { ...base, items: (data as Row[]).map(mapRow) };
}
