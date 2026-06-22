import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { EditModuleForm } from "@/components/espace/EditModuleForm";
import { AddSupportForm } from "@/components/espace/AddSupportForm";
import { deleteModuleSupport } from "@/lib/module-actions";

export const metadata: Metadata = {
  title: "Fiche module",
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const { supabase } = await requireAdmin();

  const { data: module } = await supabase
    .from("modules")
    .select(
      "id, name, level, semester, teacher_id, hours, coefficient, syllabus, filiere_id"
    )
    .eq("id", moduleId)
    .single();
  if (!module) notFound();

  const [{ data: filiere }, { data: teachers }, { data: supports }] =
    await Promise.all([
      supabase.from("filieres").select("name").eq("id", module.filiere_id).single(),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "enseignant")
        .order("full_name"),
      supabase
        .from("module_supports")
        .select("id, label, url")
        .eq("module_id", moduleId)
        .order("created_at"),
    ]);

  const teacherList = (teachers ?? []).map((t) => ({
    id: t.id,
    name: t.full_name || t.email,
  }));
  const teacherName =
    teacherList.find((t) => t.id === module.teacher_id)?.name ?? null;
  const supportList = supports ?? [];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href={`/espace/classes/${module.filiere_id}`}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← {filiere?.name ?? "Filière"}
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {module.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {module.level && (
              <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 font-semibold text-ipmd-red">
                {module.level}
              </span>
            )}
            {module.semester && (
              <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60 ring-1 ring-black/5">
                {module.semester}
              </span>
            )}
            {teacherName && (
              <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60 ring-1 ring-black/5">
                👤 {teacherName}
              </span>
            )}
            {module.hours != null && (
              <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60 ring-1 ring-black/5">
                {Number(module.hours)} h
              </span>
            )}
            {module.coefficient != null && (
              <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60 ring-1 ring-black/5">
                Coef. {Number(module.coefficient)}
              </span>
            )}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            {/* Édition + supports + évaluations */}
            <div className="order-2 space-y-8 lg:order-1">
              {/* Supports de cours */}
              <div>
                <h2 className="mb-3 text-lg font-bold text-ipmd-black">
                  Supports de cours
                </h2>
                {supportList.length === 0 ? (
                  <p className="rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                    Aucun support. Ajoutez-en un →
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                    {supportList.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        {s.url ? (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-ipmd-black hover:text-ipmd-red"
                          >
                            {s.label} ↗
                          </a>
                        ) : (
                          <span className="font-medium text-ipmd-black">
                            {s.label}
                          </span>
                        )}
                        <form action={deleteModuleSupport.bind(null, moduleId, s.id)}>
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

              {/* Évaluations liées */}
              <div>
                <h2 className="mb-3 text-lg font-bold text-ipmd-black">
                  Évaluations
                </h2>
                <p className="rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Les notes et examens de ce module apparaîtront ici une fois les
                  cours rattachés au module.{" "}
                  <span className="font-semibold text-black/40">À venir.</span>
                </p>
              </div>
            </div>

            {/* Formulaires */}
            <div className="order-1 space-y-6 lg:order-2">
              <EditModuleForm
                module={module}
                filiereId={module.filiere_id}
                teachers={teacherList}
              />
              <AddSupportForm moduleId={moduleId} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
