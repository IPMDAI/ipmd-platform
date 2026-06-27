import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { documentTypesFor } from "@/lib/documents";
import { LEARNER_ROLES } from "@/lib/dashboards";
import { universes } from "@/data/universes";

const universeKindById: Record<string, string> = Object.fromEntries(
  universes.map((u) => [u.id, u.kind])
);

export const metadata: Metadata = {
  title: "Mes documents",
};

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student } = await searchParams;
  const { supabase, userId } = await requireUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = me?.role ?? "";
  const isAdmin = ADMIN_ROLES.has(role);
  const isLearner = LEARNER_ROLES.has(role);

  // Cible : un étudiant choisi (admin/parent) ou soi-même (apprenant).
  const targetId = student || (isLearner ? userId : null);

  // Admin sans cible → sélecteur d'étudiant.
  if (!targetId) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "etudiant")
      .order("full_name");
    const list = students ?? [];

    return (
      <section className="min-h-[70vh] bg-ipmd-light">
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/espace"
              className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
            >
              ← Retour à l&apos;espace
            </Link>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
              Documents officiels
            </h1>
            <p className="mt-1 text-sm text-black/55">
              Choisissez un étudiant pour générer ses documents.
            </p>

            {list.length === 0 ? (
              <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Aucun étudiant.
              </p>
            ) : (
              <ul className="mt-8 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {list.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/espace/documents?student=${s.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-ipmd-light"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ipmd-black">
                          {s.full_name || "—"}
                        </p>
                        <p className="truncate text-sm text-black/50">
                          {s.email}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-ipmd-red">
                        Documents →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Container>
      </section>
    );
  }

  // Nom de la cible (RLS : self / parent / admin).
  const { data: target } = await supabase
    .from("profiles")
    .select("full_name, email, universe")
    .eq("id", targetId)
    .single();
  const targetName = target?.full_name || target?.email || "Étudiant";
  const isBootcamp = target?.universe ? universeKindById[target.universe] === "certificat" : false;
  const docTypes = documentTypesFor(isBootcamp);

  const qs = student ? `?student=${student}` : "";

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href={isAdmin ? "/espace/documents" : "/espace"}
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← {isAdmin ? "Tous les étudiants" : "Retour à l'espace"}
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {isLearner && targetId === userId
              ? "Mes documents officiels"
              : `Documents — ${targetName}`}
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Générés à ton nom, prêts à consulter et à imprimer.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {docTypes.map((d) => (
              <Link
                key={d.slug}
                href={`/espace/document/${d.slug}${qs}`}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-ipmd-red/30"
              >
                <span className="text-2xl">{d.icon}</span>
                <p className="mt-2 font-bold text-ipmd-black group-hover:text-ipmd-red">
                  {d.label}
                </p>
                <p className="mt-1 text-sm text-black/55">{d.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
