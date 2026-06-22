import { createClient } from "@/lib/supabase/server";
import { ReportButton } from "@/components/espace/ReportButton";

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
}

/** Annonces de la classe de l'étudiant (publiées par ses enseignants). */
export async function ClassFeed({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: member } = await supabase
    .from("class_members")
    .select("class_id")
    .eq("student_id", userId)
    .maybeSingle();
  if (!member?.class_id) return null;

  const { data: posts } = await supabase
    .from("class_announcements")
    .select("id, title, body, created_at")
    .eq("class_id", member.class_id)
    .order("created_at", { ascending: false })
    .limit(4);
  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="flex items-center gap-2 font-bold text-ipmd-black">
        📣 Annonces de ma classe
      </h3>
      <ul className="mt-3 space-y-3">
        {posts.map((p) => (
          <li key={p.id} className="rounded-xl bg-ipmd-light px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-semibold text-ipmd-black">
                {p.title || "Annonce"}
              </p>
              <span className="shrink-0 text-xs text-black/45">
                {frDate(p.created_at)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/70">
              {p.body}
            </p>
            <div className="mt-2">
              <ReportButton contentType="class_announcement" contentId={p.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
