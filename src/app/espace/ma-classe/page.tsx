import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { PostClassForm } from "@/components/espace/PostClassForm";
import { deleteClassAnnouncement } from "@/lib/classroom-actions";

export const metadata: Metadata = {
  title: "Ma classe",
};

const AUTHORS = ["enseignant", "admin", "super_admin", "pedagogie"];

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MaClassePage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = me?.role ?? "etudiant";
  if (!AUTHORS.includes(role)) redirect("/espace");

  // Classes que l'auteur peut adresser.
  let classes: { id: string; name: string }[] = [];
  if (role === "enseignant") {
    const { data: slots } = await supabase
      .from("timetable_slots")
      .select("class_id")
      .eq("teacher_id", userId);
    const ids = [...new Set((slots ?? []).map((s) => s.class_id))];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", ids)
        .order("name");
      classes = data ?? [];
    }
  } else {
    const { data } = await supabase
      .from("classes")
      .select("id, name")
      .order("name");
    classes = data ?? [];
  }

  // Fil des annonces (RLS : limité au périmètre de l'auteur).
  const { data: posts } = await supabase
    .from("class_announcements")
    .select("id, class_id, author_id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(40);
  const className = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Ma classe
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Publie des annonces aux étudiants de tes classes.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              <h2 className="mb-4 text-lg font-bold text-ipmd-black">
                Annonces publiées
              </h2>
              {!posts || posts.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune annonce pour le moment.
                </p>
              ) : (
                <ul className="space-y-4">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-[11px] font-semibold text-white">
                            {className.get(p.class_id) ?? "Classe"}
                          </span>
                          <span className="text-xs text-black/40">
                            {frDate(p.created_at)}
                          </span>
                        </div>
                        <form action={deleteClassAnnouncement.bind(null, p.id)}>
                          <button className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10">
                            Suppr.
                          </button>
                        </form>
                      </div>
                      {p.title && (
                        <p className="mt-2 font-bold text-ipmd-black">{p.title}</p>
                      )}
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/70">
                        {p.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              {classes.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune classe ne t&apos;est affectée (via le planning).
                </p>
              ) : (
                <PostClassForm classes={classes} />
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
