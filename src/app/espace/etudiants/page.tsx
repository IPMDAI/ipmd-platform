import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  StudentDirectory,
  type StudentRow,
} from "@/components/espace/StudentDirectory";

export const metadata: Metadata = {
  title: "Étudiants",
};

export default async function EtudiantsPage() {
  const { supabase } = await requireAdmin();

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, phone, whatsapp, personal_email, school_email")
    .eq("role", "etudiant")
    .order("full_name");
  const list = students ?? [];
  const ids = list.map((s) => s.id);

  // Année scolaire de chaque étudiant (dossier financier).
  const yearOf = new Map<string, string>();
  if (ids.length > 0) {
    const { data: fins } = await supabase
      .from("student_finance")
      .select("student_id, academic_year")
      .in("student_id", ids);
    for (const f of fins ?? []) if (f.academic_year) yearOf.set(f.student_id, f.academic_year);
  }

  // Classe + filière de chaque étudiant.
  const studentClass = new Map<string, string>();
  const classInfo = new Map<string, { name: string; filiere_id: string | null }>();
  const filiereName = new Map<string, string>();
  if (ids.length > 0) {
    const { data: members } = await supabase
      .from("class_members")
      .select("student_id, class_id")
      .in("student_id", ids);
    for (const m of members ?? []) {
      if (m.class_id) studentClass.set(m.student_id, m.class_id);
    }
    const classIds = [...new Set([...studentClass.values()])];
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name, filiere_id")
        .in("id", classIds);
      for (const c of classes ?? [])
        classInfo.set(c.id, { name: c.name, filiere_id: c.filiere_id });
      const filIds = [
        ...new Set(
          [...classInfo.values()].map((c) => c.filiere_id).filter(Boolean) as string[]
        ),
      ];
      if (filIds.length > 0) {
        const { data: fils } = await supabase
          .from("filieres")
          .select("id, name")
          .in("id", filIds);
        for (const f of fils ?? []) filiereName.set(f.id, f.name);
      }
    }
  }

  const rows: StudentRow[] = list.map((s) => {
    const cid = studentClass.get(s.id);
    const cls = cid ? classInfo.get(cid) : undefined;
    return {
      id: s.id,
      name: s.full_name || "—",
      email: s.email,
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
    };
  });

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            Étudiants
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Annuaire des étudiants — bulletin et documents en un clic.
          </p>

          <div className="mt-8">
            {rows.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun étudiant. Affecte des rôles « Étudiant » dans Gestion des
                utilisateurs.
              </p>
            ) : (
              <StudentDirectory students={rows} />
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
