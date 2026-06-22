import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { SendMessageForm } from "@/components/espace/SendMessageForm";
import { AdminMessageReply } from "@/components/espace/AdminMessageReply";
import { archiveInternalMessage } from "@/lib/messaging-actions";
import {
  MESSAGE_CATEGORY_LABEL,
  SERVICE_LABEL,
  servicesForRole,
  STAFF_ROLES,
} from "@/lib/messaging";

export const metadata: Metadata = {
  title: "Messagerie",
};

type Msg = {
  id: string;
  sender_id: string;
  category: string;
  subject: string;
  body: string;
  admin_reply: string | null;
  status: string;
  created_at: string;
  recipient_role: string;
};

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function MessageriePage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue } = await searchParams;
  const { supabase, userId } = await requireUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  const role = me?.role ?? "etudiant";
  const isStaff = STAFF_ROLES.includes(role);
  const archivedView = isStaff && vue === "archives";

  let query = supabase
    .from("internal_messages")
    .select(
      "id, sender_id, category, subject, body, admin_reply, status, created_at, recipient_role"
    )
    .order("created_at", { ascending: false });
  if (isStaff) query = query.eq("archived", archivedView);
  const { data: rows } = await query;
  const messages = (rows ?? []) as Msg[];

  // Noms des expéditeurs (services).
  const senderName = new Map<string, string>();
  if (isStaff && messages.length > 0) {
    const ids = [...new Set(messages.map((m) => m.sender_id))];
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids);
    for (const p of people ?? [])
      senderName.set(p.id, p.full_name || "Membre");
  }

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
            Messagerie
          </h1>
          <p className="mt-1 text-sm text-black/55">
            {isStaff
              ? "Messages reçus pour votre service."
              : "Écris à un service de l'IPMD (administration, scolarité, pédagogie)."}
          </p>

          {/* Onglets Actifs / Archivées (staff) */}
          {isStaff && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/espace/messagerie"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  !archivedView
                    ? "bg-ipmd-red text-white"
                    : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
                }`}
              >
                Actifs
              </Link>
              <Link
                href="/espace/messagerie?vue=archives"
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  archivedView
                    ? "bg-ipmd-red text-white"
                    : "bg-white text-black/60 ring-1 ring-black/10 hover:text-ipmd-red"
                }`}
              >
                Archivées
              </Link>
            </div>
          )}

          {/* Formulaire d'envoi (non-staff) */}
          {!isStaff && (
            <div className="mt-8">
              <SendMessageForm services={servicesForRole(role)} />
            </div>
          )}

          {/* Liste */}
          <div className="mt-8 space-y-4">
            {messages.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                {isStaff
                  ? "Aucun message reçu."
                  : "Tu n'as pas encore écrit à un service."}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-bold text-ipmd-black">{m.subject}</h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          m.status === "repondu"
                            ? "bg-green-50 text-green-700"
                            : "bg-ipmd-red/10 text-ipmd-red"
                        }`}
                      >
                        {m.status === "repondu" ? "Répondu" : "En attente"}
                      </span>
                      <span className="text-xs text-black/40">
                        {frDate(m.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-ipmd-red/10 px-2.5 py-1 font-semibold text-ipmd-red">
                      {isStaff ? "Pour : " : "À : "}
                      {SERVICE_LABEL[m.recipient_role] ?? m.recipient_role}
                    </span>
                    <span className="rounded-full bg-ipmd-black px-2.5 py-1 font-semibold text-white">
                      {MESSAGE_CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                    {isStaff && (
                      <span className="rounded-full bg-ipmd-light px-2.5 py-1 font-semibold text-black/60">
                        👤 {senderName.get(m.sender_id) ?? "—"}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
                    {m.body}
                  </p>

                  {/* Réponse */}
                  {m.admin_reply && (
                    <div className="mt-3 rounded-xl bg-ipmd-light px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-ipmd-red">
                        Réponse du service
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-black/75">
                        {m.admin_reply}
                      </p>
                    </div>
                  )}

                  {isStaff && (
                    <>
                      <AdminMessageReply messageId={m.id} current={m.admin_reply} />
                      <form
                        action={archiveInternalMessage.bind(
                          null,
                          m.id,
                          !archivedView
                        )}
                        className="mt-2"
                      >
                        <button className="text-xs font-semibold text-black/40 hover:text-ipmd-red">
                          {archivedView ? "↩ Désarchiver" : "🗄 Archiver"}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
