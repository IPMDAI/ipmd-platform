import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { ParentMessageForm } from "@/components/espace/ParentMessageForm";
import { LinkStudentToParent } from "@/components/espace/LinkStudentToParent";
import { PARENT_RELATIONSHIP_LABEL } from "@/lib/academic";
import { SERVICE_LABEL } from "@/lib/messaging";

export const metadata: Metadata = { title: "Fiche parent" };

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: parent } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, whatsapp, role, profession, fonction, entreprise, ville, pays, comm_opt_commercial, invited_at, activated_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (!parent || parent.role !== "parent") notFound();

  // Enfants liés.
  const { data: links } = await supabase
    .from("parent_links")
    .select("student_id, relationship")
    .eq("parent_id", id);
  const studentIds = (links ?? []).map((l) => l.student_id);
  const relOf = new Map<string, string | null>();
  for (const l of links ?? []) relOf.set(l.student_id, l.relationship);
  let children: { id: string; full_name: string | null; email: string; matricule: string | null }[] = [];
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, matricule")
      .in("id", studentIds);
    children = data ?? [];
  }

  // Historique des messages (tickets envoyés + messages directs reçus).
  const { data: msgs } = await supabase
    .from("internal_messages")
    .select("id, sender_id, recipient_id, subject, body, admin_reply, status, created_at, recipient_role")
    .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
    .order("created_at", { ascending: false })
    .limit(50);

  const activation = parent.activated_at
    ? { label: "Activé ✓", cls: "bg-green-600/10 text-green-700" }
    : parent.invited_at
      ? { label: "Invité · en attente", cls: "bg-amber-50 text-amber-800" }
      : { label: "Compte auto-inscrit", cls: "bg-black/5 text-black/50" };

  const proLine = [parent.profession, parent.fonction, parent.entreprise]
    .filter(Boolean)
    .join(" · ");
  const locLine = [parent.ville, parent.pays].filter(Boolean).join(", ");

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/espace/parents"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Parents &amp; élèves
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {parent.full_name || parent.email}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${activation.cls}`}>
              {activation.label}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                parent.comm_opt_commercial
                  ? "bg-green-600/10 text-green-700"
                  : "bg-black/5 text-black/45"
              }`}
            >
              {parent.comm_opt_commercial ? "Opt-in offres" : "Pas d'offres"}
            </span>
          </div>

          {/* Profil */}
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h2 className="font-bold text-ipmd-black">Profil</h2>
            <dl className="mt-2 space-y-1 text-sm text-black/70">
              <div><span className="text-black/45">Email : </span>{parent.email}</div>
              {parent.phone && <div><span className="text-black/45">Téléphone : </span>{parent.phone}</div>}
              {proLine && <div><span className="text-black/45">Profession : </span>{proLine}</div>}
              {locLine && <div><span className="text-black/45">Localisation : </span>{locLine}</div>}
              {parent.invited_at && (
                <div><span className="text-black/45">Invité le : </span>{frDate(parent.invited_at)}</div>
              )}
              {parent.activated_at && (
                <div><span className="text-black/45">Activé le : </span>{frDate(parent.activated_at)}</div>
              )}
            </dl>
          </div>

          {/* Enfants liés */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ipmd-black">
              Enfants liés ({children.length})
            </h2>
            <LinkStudentToParent parentId={parent.id} />
          </div>
          {children.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun enfant rattaché.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {children.map((c) => {
                const rel = relOf.get(c.id);
                return (
                  <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-ipmd-black">
                          {c.full_name || c.email}
                          {rel && (
                            <span className="ml-2 rounded-full bg-ipmd-light px-2 py-0.5 text-[10px] font-bold text-black/55">
                              {PARENT_RELATIONSHIP_LABEL[rel] ?? rel}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-black/45">
                          {c.email}
                          {c.matricule ? ` · ${c.matricule}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Link
                          href={`/espace/finance/${c.id}`}
                          className="rounded-lg bg-ipmd-black px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          💳 Finances & reçus
                        </Link>
                        <Link
                          href={`/espace/bulletin/${c.id}`}
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ipmd-black ring-1 ring-black/10 transition-colors hover:ring-ipmd-red/40"
                        >
                          📄 Bulletin
                        </Link>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Envoyer un message */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">Contacter ce parent</h2>
          <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <ParentMessageForm parentId={parent.id} parentName={parent.full_name || parent.email} />
          </div>

          {/* Historique des messages */}
          <h2 className="mt-8 text-lg font-bold text-ipmd-black">
            Historique des messages ({(msgs ?? []).length})
          </h2>
          {(msgs ?? []).length === 0 ? (
            <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun message échangé.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {(msgs ?? []).map((m) => {
                const inbound = m.recipient_id === id && m.sender_id !== id;
                return (
                  <li key={m.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-ipmd-black">{m.subject}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            inbound ? "bg-ipmd-red/10 text-ipmd-red" : "bg-ipmd-black text-white"
                          }`}
                        >
                          {inbound ? "📨 IPMD → parent" : `Parent → ${SERVICE_LABEL[m.recipient_role] ?? "service"}`}
                        </span>
                        <span className="text-xs text-black/40">{frDate(m.created_at)}</span>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-black/70">{m.body}</p>
                    {m.admin_reply && (
                      <div className="mt-2 rounded-xl bg-ipmd-light px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ipmd-red">
                          Réponse du service
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-black/75">{m.admin_reply}</p>
                      </div>
                    )}
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
