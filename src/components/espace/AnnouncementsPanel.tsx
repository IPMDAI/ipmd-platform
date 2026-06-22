import { createClient } from "@/lib/supabase/server";
import { isForRole } from "@/lib/announcements";

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
}

/** Annonces de l'administration pertinentes pour le rôle de l'utilisateur. */
export async function AnnouncementsPanel({ role }: { role: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const announcements = (data ?? [])
    .filter((a) => isForRole(a.audience, role))
    .slice(0, 4);

  if (announcements.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="flex items-center gap-2 font-bold text-ipmd-black">
        📢 Annonces de l&apos;administration
      </h3>
      <ul className="mt-3 space-y-3">
        {announcements.map((a) => (
          <li key={a.id} className="rounded-xl bg-ipmd-light px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-ipmd-black">{a.title}</p>
              <span className="shrink-0 text-xs text-black/45">
                {frDate(a.created_at)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/70">
              {a.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
