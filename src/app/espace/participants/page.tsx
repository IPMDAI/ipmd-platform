import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { StudentDirectory, type StudentRow } from "@/components/espace/StudentDirectory";

export const metadata: Metadata = { title: "Participants (bootcamps)" };

const PER_PAGE = 25;
type SP = Record<string, string | undefined>;

/**
 * Annuaire des participants aux bootcamps (role = participant) — paginé côté
 * serveur (25/page) + recherche. Admin : édition inline conservée (canEdit).
 */
export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { supabase } = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PER_PAGE;

  let qb = supabase
    .from("profiles")
    .select(
      "id, full_name, first_names, last_name, email, matricule, avatar_url, phone, whatsapp, personal_email, school_email, birth_date, birth_place",
      { count: "exact" }
    )
    .eq("role", "participant");
  if (q) {
    const esc = q.replace(/[,()%*]/g, " ").trim();
    if (esc)
      qb = qb.or(
        `full_name.ilike.%${esc}%,last_name.ilike.%${esc}%,first_names.ilike.%${esc}%,matricule.ilike.%${esc}%,email.ilike.%${esc}%`
      );
  }
  const { data: people, count } = await qb.order("full_name").order("id").range(from, from + PER_PAGE - 1);
  const list = people ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const ids = list.map((s) => s.id);

  const yearOf = new Map<string, string>();
  if (ids.length > 0) {
    const { data: fins } = await supabase
      .from("student_finance")
      .select("student_id, academic_year")
      .in("student_id", ids);
    for (const f of fins ?? []) if (f.academic_year) yearOf.set(f.student_id, f.academic_year);
  }

  const studentClass = new Map<string, string>();
  const classInfo = new Map<string, { name: string; filiere_id: string | null }>();
  const filiereName = new Map<string, string>();
  if (ids.length > 0) {
    const { data: members } = await supabase
      .from("class_members")
      .select("student_id, class_id")
      .in("student_id", ids);
    for (const m of members ?? []) if (m.class_id) studentClass.set(m.student_id, m.class_id);
    const classIds = [...new Set([...studentClass.values()])];
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, filiere_id")
        .in("id", classIds);
      for (const c of classes ?? []) classInfo.set(c.id, { name: c.name, filiere_id: c.filiere_id });
      const filIds = [...new Set([...classInfo.values()].map((c) => c.filiere_id).filter(Boolean) as string[])];
      if (filIds.length > 0) {
        const { data: fils } = await supabase.from("filieres").select("id, name").in("id", filIds);
        for (const f of fils ?? []) filiereName.set(f.id, f.name);
      }
    }
  }

  const { data: allClasses } = await supabase
    .from("classes")
    .select("id, name, filiere_id")
    .order("name");
  const allFilIds = [...new Set((allClasses ?? []).map((c) => c.filiere_id).filter(Boolean) as string[])];
  const allFiliereName = new Map<string, string>();
  if (allFilIds.length > 0) {
    const { data: fils } = await supabase.from("filieres").select("id, name").in("id", allFilIds);
    for (const f of fils ?? []) allFiliereName.set(f.id, f.name);
  }
  const classOptions = (allClasses ?? []).map((c) => ({
    id: c.id,
    label: c.filiere_id ? `${c.name} — ${allFiliereName.get(c.filiere_id) ?? "?"}` : c.name,
  }));

  const rows: StudentRow[] = list.map((s) => {
    const cid = studentClass.get(s.id);
    const cls = cid ? classInfo.get(cid) : undefined;
    return {
      id: s.id,
      name: s.full_name || "—",
      email: s.email,
      matricule: s.matricule ?? null,
      avatarUrl: s.avatar_url ?? null,
      className: cls?.name ?? null,
      filiereName: cls?.filiere_id ? filiereName.get(cls.filiere_id) ?? null : null,
      academicYear: yearOf.get(s.id) ?? null,
      contacts: {
        phone: s.phone ?? null,
        whatsapp: s.whatsapp ?? null,
        personal_email: s.personal_email ?? null,
        school_email: s.school_email ?? null,
      },
      birthDate: s.birth_date ?? null,
      birthPlace: s.birth_place ?? null,
      classId: cid ?? null,
    };
  });

  const pageHref = (p: number) =>
    `/espace/participants?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`;
  const input =
    "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ipmd-black outline-none ring-ipmd-red/20 focus:ring-2 sm:max-w-sm";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Participants <span className="text-ipmd-red">— bootcamps</span>
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Annuaire des participants aux bootcamps (UltraJobs, UltraBoost, UltraExecutive,
            SeniorsHub), séparé des étudiants diplôme.
          </p>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input name="q" defaultValue={q} placeholder="Rechercher un participant, un matricule…" className={input} />
            <div className="flex items-center gap-2">
              <button type="submit" className="rounded-xl bg-ipmd-black px-4 py-2.5 text-sm font-semibold text-white">
                Rechercher
              </button>
              {q && (
                <a href="/espace/participants" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black/60 ring-1 ring-black/10">
                  Effacer
                </a>
              )}
            </div>
          </form>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-black/40">
            {total} participant{total > 1 ? "s" : ""}{q ? " trouvé(s)" : ""} · page {page}/{totalPages}
          </p>

          <div className="mt-3">
            {total === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                {q
                  ? "Aucun participant ne correspond à cette recherche."
                  : "Aucun participant pour l'instant. Ils apparaissent après acceptation d'une candidature bootcamp (cible « Participant »)."}
              </p>
            ) : (
              <StudentDirectory students={rows} classes={classOptions} canEdit />
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/30">
                  ← Précédent
                </Link>
              ) : (
                <span className="text-sm text-black/30">← Précédent</span>
              )}
              <span className="text-sm text-black/50">Page {page} / {totalPages}</span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ipmd-black ring-1 ring-black/10 hover:ring-ipmd-red/30">
                  Suivant →
                </Link>
              ) : (
                <span className="text-sm text-black/30">Suivant →</span>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
