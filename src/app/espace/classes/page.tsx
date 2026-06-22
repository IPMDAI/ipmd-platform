import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import {
  NewFiliereForm,
  NewClasseForm,
} from "@/components/espace/referentiel-forms";
import { ClassAssigner } from "@/components/espace/ClassAssigner";
import { StatusSelect } from "@/components/espace/StatusSelect";
import { statusBadgeClass, STATUS_LABEL } from "@/lib/academic";
import {
  deleteFiliere,
  deleteClasse,
  seedFilieres,
  seedModules,
} from "@/lib/referentiel-actions";

export const metadata: Metadata = {
  title: "Classes & filières",
};

export default async function ClassesPage() {
  const { supabase, role } = await requireAdmin();
  const isSuper = role === "super_admin";

  const [
    { data: filieres },
    { data: classes },
    { data: students },
    { data: members },
    { data: modules },
  ] = await Promise.all([
    supabase.from("filieres").select("id, name, status").order("name"),
    supabase
      .from("classes")
      .select("id, name, level, academic_year, filiere_id")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "etudiant")
      .order("full_name"),
    supabase.from("class_members").select("student_id, class_id"),
    supabase.from("modules").select("filiere_id"),
  ]);

  const moduleCount = new Map<string, number>();
  for (const m of modules ?? []) {
    moduleCount.set(m.filiere_id, (moduleCount.get(m.filiere_id) ?? 0) + 1);
  }

  const filiereName = new Map((filieres ?? []).map((f) => [f.id, f.name]));
  const memberMap = new Map(
    (members ?? []).map((m) => [m.student_id, m.class_id])
  );
  const studentsWithClass = (students ?? []).map((s) => ({
    ...s,
    class_id: memberMap.get(s.id) ?? null,
  }));
  const classList = classes ?? [];
  const classesSimple = classList.map((c) => ({ id: c.id, name: c.name }));

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
            Classes &amp; filières
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Structurez l&apos;école par filière et par promotion, puis affectez
            les étudiants.
          </p>

          {/* Filières */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Filières</h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              <div className="mb-3 flex flex-wrap gap-2">
                <form action={seedFilieres}>
                  <button
                    type="submit"
                    className="rounded-full bg-ipmd-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    ✨ Importer les filières IPMD
                  </button>
                </form>
                <form action={seedModules}>
                  <button
                    type="submit"
                    className="rounded-full border border-ipmd-black/15 bg-white px-4 py-2 text-sm font-semibold text-ipmd-black transition-colors hover:border-ipmd-red hover:text-ipmd-red"
                  >
                    ✨ Pré-remplir les modules
                  </button>
                </form>
              </div>
              {(filieres ?? []).length === 0 ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune filière.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {(filieres ?? []).map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <Link
                        href={`/espace/classes/${f.id}`}
                        className="min-w-0 flex-1"
                      >
                        <span className="font-semibold text-ipmd-black">
                          {f.name}
                        </span>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(
                            f.status
                          )}`}
                        >
                          {STATUS_LABEL[f.status] ?? f.status}
                        </span>
                        <span className="ml-2 text-xs font-semibold text-ipmd-red">
                          {moduleCount.get(f.id) ?? 0} module(s) →
                        </span>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        {isSuper && (
                          <StatusSelect
                            kind="filiere"
                            id={f.id}
                            current={f.status}
                          />
                        )}
                        <form action={deleteFiliere.bind(null, f.id)}>
                          <button
                            type="submit"
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <NewFiliereForm />
            </div>
          </div>

          {/* Classes */}
          <h2 className="mt-10 text-lg font-bold text-ipmd-black">
            Classes / promotions
          </h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {classList.length === 0 ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune classe.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {classList.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ipmd-black">
                          {c.name}
                        </p>
                        <p className="truncate text-xs text-black/50">
                          {[
                            c.filiere_id ? filiereName.get(c.filiere_id) : null,
                            c.level,
                            c.academic_year,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      <form action={deleteClasse.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10"
                        >
                          Supprimer
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <NewClasseForm filieres={filieres ?? []} />
            </div>
          </div>

          {/* Affectation */}
          <h2 className="mt-10 text-lg font-bold text-ipmd-black">
            Affecter les étudiants
          </h2>
          <p className="mb-3 mt-1 text-sm text-black/55">
            Choisissez la classe de chaque étudiant.
          </p>
          <ClassAssigner students={studentsWithClass} classes={classesSimple} />
        </div>
      </Container>
    </section>
  );
}
