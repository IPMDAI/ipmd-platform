import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { documentTypesFor } from "@/lib/documents";
import { isDocReady } from "@/lib/doc-grants";
import { setDocumentGrant } from "@/lib/admin-actions";
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

  // Autorisations (activation par l'administration) pour cet étudiant.
  const { data: grantRows } = await supabase
    .from("document_grants")
    .select("doc_type, active")
    .eq("student_id", targetId);
  const grantedSet = new Set(
    (grantRows ?? []).filter((g) => g.active).map((g) => g.doc_type as string)
  );

  // Préparation (signature + cachet) de chaque document.
  const readiness: Record<string, boolean> = {};
  await Promise.all(
    docTypes.map(async (d) => {
      readiness[d.slug] = await isDocReady(d.slug, isBootcamp);
    })
  );

  // L'étudiant (non-admin) qui consulte SES documents ne voit que ceux
  // qui sont ACTIVÉS et PRÊTS (signature + cachet).
  const viewerIsOwnerLearner = isLearner && !isAdmin && targetId === userId;
  const visibleDocs = viewerIsOwnerLearner
    ? docTypes.filter((d) => grantedSet.has(d.slug) && readiness[d.slug])
    : docTypes;

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
            {viewerIsOwnerLearner
              ? "Documents activés par l'administration, prêts à consulter et à imprimer."
              : "Active un document pour le rendre visible à l'étudiant (nécessite signature + cachet)."}
          </p>

          {viewerIsOwnerLearner && visibleDocs.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/60 shadow-sm ring-1 ring-black/5">
              📄 Aucun document disponible pour le moment. Vos documents seront
              activés par l&apos;administration ; ils apparaîtront ici une fois prêts.
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {visibleDocs.map((d) => {
                const granted = grantedSet.has(d.slug);
                const ready = readiness[d.slug];
                return (
                  <div
                    key={d.slug}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                  >
                    <Link
                      href={`/espace/document/${d.slug}${qs}`}
                      className="group block"
                    >
                      <span className="text-2xl">{d.icon}</span>
                      <p className="mt-2 font-bold text-ipmd-black group-hover:text-ipmd-red">
                        {d.label}
                      </p>
                      <p className="mt-1 text-sm text-black/55">{d.desc}</p>
                    </Link>

                    {isAdmin && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span
                            className={`font-semibold ${
                              granted ? "text-green-600" : "text-black/45"
                            }`}
                          >
                            {granted ? "✅ Activé (visible)" : "⛔ Non activé (invisible)"}
                          </span>
                          {d.slug !== "carte" && !ready && (
                            <span className="text-ipmd-red/80">
                              ⚠ Signature ou cachet manquant
                            </span>
                          )}
                        </div>
                        <form action={setDocumentGrant}>
                          <input type="hidden" name="student_id" value={targetId} />
                          <input type="hidden" name="doc_type" value={d.slug} />
                          <input type="hidden" name="active" value={granted ? "false" : "true"} />
                          <button
                            type="submit"
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                              granted
                                ? "bg-black/5 text-black/60 hover:bg-black/10"
                                : "bg-ipmd-red text-white hover:opacity-90"
                            }`}
                          >
                            {granted ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
