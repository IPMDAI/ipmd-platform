import { createClient } from "@/lib/supabase/server";
import { isForRole, matchesTarget } from "@/lib/announcements";

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
}

const LEARNERS = ["etudiant", "professionnel", "dirigeant"];

/** Annonces de l'administration pertinentes pour l'utilisateur (rôle + ciblage). */
export async function AnnouncementsPanel({
  role,
  userId,
}: {
  role: string;
  userId: string;
}) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, created_at, target_type, target_value")
    .order("created_at", { ascending: false })
    .limit(30);
  if (!data || data.length === 0) return null;

  const isLearner = LEARNERS.includes(role);

  // Attributs de l'apprenant pour le ciblage.
  let attrs = { filiere: null as string | null, niveau: null as string | null, universe: null as string | null };
  if (isLearner) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("universe")
      .eq("id", userId)
      .single();
    attrs.universe = prof?.universe ?? null;
    const { data: member } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("student_id", userId)
      .maybeSingle();
    if (member?.class_id) {
      const { data: klass } = await supabase
        .from("classes")
        .select("level, filiere_id")
        .eq("id", member.class_id)
        .single();
      attrs.niveau = klass?.level ?? null;
      if (klass?.filiere_id) {
        const { data: fil } = await supabase
          .from("filieres")
          .select("name")
          .eq("id", klass.filiere_id)
          .single();
        attrs.filiere = fil?.name ?? null;
      }
    }
  }

  const announcements = data
    .filter((a) => isForRole(a.audience, role))
    .filter((a) => {
      const tt = a.target_type ?? "all";
      if (tt === "all") return true;
      if (role === "admin" || role === "super_admin") return true;
      return isLearner && matchesTarget(tt, a.target_value, attrs);
    })
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
