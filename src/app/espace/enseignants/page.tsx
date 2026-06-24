import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { TeacherProfileForm } from "@/components/espace/TeacherProfileForm";
import { ContactEditForm } from "@/components/espace/ContactEditForm";
import { TEACHER_STATUS_LABEL, teacherStatusClass } from "@/lib/teacher";

export const metadata: Metadata = {
  title: "Enseignants",
};

const STAFF = ["admin", "super_admin", "pedagogie"];

export default async function EnseignantsPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const [{ data: teachers }, { data: sheets }, { data: slots }, { data: classes }, { data: filieres }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, phone, whatsapp, personal_email, school_email")
        .eq("role", "enseignant")
        .order("full_name"),
      supabase.from("teacher_profiles").select("*"),
      supabase.from("timetable_slots").select("teacher_id, subject, class_id"),
      supabase.from("classes").select("id, name, level, filiere_id"),
      supabase.from("filieres").select("id, name"),
    ]);

  const sheetMap = new Map((sheets ?? []).map((s) => [s.teacher_id, s]));
  const classInfo = new Map(
    (classes ?? []).map((c) => [c.id, { name: c.name, level: c.level, filiere_id: c.filiere_id }])
  );
  const filiereName = new Map((filieres ?? []).map((f) => [f.id, f.name]));

  // Dérive modules / classes / niveaux / filières par enseignant.
  const derived = new Map<
    string,
    { modules: Set<string>; classes: Set<string>; niveaux: Set<string>; filieres: Set<string> }
  >();
  for (const s of slots ?? []) {
    if (!s.teacher_id) continue;
    const d =
      derived.get(s.teacher_id) ??
      { modules: new Set<string>(), classes: new Set<string>(), niveaux: new Set<string>(), filieres: new Set<string>() };
    if (s.subject) d.modules.add(s.subject);
    const ci = classInfo.get(s.class_id);
    if (ci) {
      d.classes.add(ci.name);
      if (ci.level) d.niveaux.add(ci.level);
      if (ci.filiere_id) d.filieres.add(filiereName.get(ci.filiere_id) ?? "");
    }
    derived.set(s.teacher_id, d);
  }

  const chips = (items: string[]) =>
    items.filter(Boolean).map((x) => (
      <span
        key={x}
        className="rounded-full bg-ipmd-light px-2.5 py-1 text-[11px] font-semibold text-black/60"
      >
        {x}
      </span>
    ));

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
            Enseignants
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Fiche complète de chaque enseignant (fonction, dossier, statut).
          </p>

          {!teachers || teachers.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun enseignant. Attribue le rôle « Enseignant » dans Gestion des
              utilisateurs.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {teachers.map((t) => {
                const sheet = sheetMap.get(t.id) ?? {};
                const d = derived.get(t.id);
                const status = sheet.status ?? "en_attente";
                return (
                  <li
                    key={t.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <details>
                      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-ipmd-black">
                            {t.full_name || t.email}
                          </p>
                          {sheet.function && (
                            <p className="text-xs text-black/55">
                              {sheet.title ? `${sheet.title} · ` : ""}
                              {sheet.function}
                            </p>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${teacherStatusClass(status)}`}
                        >
                          {TEACHER_STATUS_LABEL[status] ?? status}
                        </span>
                      </summary>

                      {d && (
                        <div className="mt-3 space-y-2 text-xs">
                          {d.modules.size > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-black/40">Modules :</span>
                              {chips([...d.modules])}
                            </div>
                          )}
                          {d.filieres.size > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-black/40">Filières :</span>
                              {chips([...d.filieres])}
                            </div>
                          )}
                          {(d.classes.size > 0 || d.niveaux.size > 0) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-black/40">Classes :</span>
                              {chips([...d.classes, ...d.niveaux])}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3">
                        <Link
                          href={`/espace/contrat/${t.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black transition-colors hover:bg-black/5"
                        >
                          📄 Générer le contrat de vacataire
                        </Link>
                      </div>

                      <ContactEditForm
                        userId={t.id}
                        contacts={{
                          phone: t.phone ?? null,
                          whatsapp: t.whatsapp ?? null,
                          personal_email: t.personal_email ?? null,
                          school_email: t.school_email ?? null,
                        }}
                      />

                      <TeacherProfileForm teacherId={t.id} sheet={sheet} />
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
