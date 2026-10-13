import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { FormerAccessGrantForm } from "@/components/espace/FormerAccessGrantForm";

export const metadata: Metadata = { title: "Donner l'accès à un ancien" };

const LEARNER_ROLES = ["etudiant", "professionnel", "dirigeant"];
const ACCESS_BADGE: Record<string, { label: string; cls: string }> = {
  actif: { label: "Accès actif", cls: "bg-green-50 text-green-700" },
  pause: { label: "Accès en pause", cls: "bg-amber-50 text-amber-800" },
  bloque: { label: "Accès bloqué", cls: "bg-ipmd-red/10 text-ipmd-red" },
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  matricule: string | null;
  phone: string | null;
  birth_date: string | null;
};

export default async function AccesAncienPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (me?.role !== "super_admin") redirect("/espace");

  const { q } = await searchParams;
  const needle = (q ?? "").trim();
  let results: Profile[] = [];
  const financeOf = new Map<string, { level: string | null; program: string | null; access_state: string | null }>();
  const classOf = new Map<string, string>();
  const authOf = new Map<string, { has_identity: boolean; email_confirmed: boolean }>();

  if (needle.length >= 2) {
    const safe = needle.replace(/[,()%*]/g, " ").trim();
    const like = `%${safe}%`;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, matricule, phone, birth_date")
      .in("role", LEARNER_ROLES)
      .or(
        `full_name.ilike.${like},matricule.ilike.${like},email.ilike.${like},phone.ilike.${like},whatsapp.ilike.${like}`
      )
      .order("full_name")
      .limit(20);
    results = (data ?? []) as Profile[];

    const ids = results.map((r) => r.id);
    if (ids.length > 0) {
      const [{ data: fin }, { data: members }, { data: auth }] = await Promise.all([
        supabase.from("student_finance").select("student_id, level, program, access_state").in("student_id", ids),
        supabase.from("class_members").select("student_id, class_id").in("student_id", ids),
        supabase.rpc("former_auth_status", { p_ids: ids }),
      ]);
      for (const f of fin ?? [])
        financeOf.set(f.student_id, { level: f.level, program: f.program, access_state: f.access_state });
      const classIds = [...new Set((members ?? []).map((m) => m.class_id))];
      if (classIds.length > 0) {
        const { data: classes } = await supabase.from("classes").select("id, name, academic_year").in("id", classIds);
        const cname = new Map((classes ?? []).map((c) => [c.id, `${c.name}${c.academic_year ? ` — ${c.academic_year}` : ""}`]));
        for (const m of members ?? []) if (cname.get(m.class_id)) classOf.set(m.student_id, cname.get(m.class_id)!);
      }
      for (const a of (auth ?? []) as { id: string; has_identity: boolean; email_confirmed: boolean }[])
        authOf.set(a.id, { has_identity: a.has_identity, email_confirmed: a.email_confirmed });
    }
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace/reprise" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Reprise des anciens
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Donner l&apos;accès à un ancien
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-black/55">
            Travaille sur le <strong>compte existant</strong> : met son vrai email, répare son
            identité de connexion si besoin, et envoie un lien « définir mon mot de passe ».
            Aucun doublon, aucune modification de sa scolarité, finance ou matricule.
          </p>

          {/* Recherche */}
          <form className="mt-6" action="/espace/acces-ancien" method="get">
            <input
              name="q"
              defaultValue={needle}
              placeholder="Rechercher par nom, matricule, téléphone ou email…"
              className="w-full rounded-xl bg-white px-4 py-2.5 text-sm shadow-sm ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-ipmd-red/40"
            />
          </form>

          {needle.length >= 2 && (
            <p className="mt-3 text-xs text-black/45">{results.length} résultat(s)</p>
          )}

          <ul className="mt-4 space-y-3">
            {results.map((p) => {
              const f = financeOf.get(p.id);
              const a = authOf.get(p.id);
              const access = f?.access_state ? ACCESS_BADGE[f.access_state] : null;
              return (
                <li key={p.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-ipmd-black">{p.full_name || "—"}</p>
                      <p className="text-xs text-black/50">
                        {p.matricule ? `${p.matricule} · ` : ""}
                        {classOf.get(p.id) ?? f?.level ?? "Parcours non renseigné"}
                        {f?.program ? ` · ${f.program}` : ""}
                        {p.birth_date ? ` · né(e) le ${p.birth_date}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-black/45">
                        Email actuel : {p.email}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {access && (
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${access.cls}`}>
                          {access.label}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          a?.has_identity ? "bg-green-50 text-green-700" : "bg-ipmd-red/10 text-ipmd-red"
                        }`}
                      >
                        {a?.has_identity ? "Connexion OK" : "Identité à réparer"}
                      </span>
                    </div>
                  </div>
                  <FormerAccessGrantForm profileId={p.id} currentEmail={p.email} />
                </li>
              );
            })}
          </ul>

          {needle.length >= 2 && results.length === 0 && (
            <p className="mt-4 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun ancien trouvé pour « {needle} ».
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
