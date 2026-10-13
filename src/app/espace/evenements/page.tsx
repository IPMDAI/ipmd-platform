import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { EventForm } from "@/components/espace/EventForm";
import { EventInviteForm } from "@/components/espace/EventInviteForm";
import { setEventStatus, deleteEvent } from "@/lib/event-actions";
import {
  EVENT_KIND,
  EVENT_STATUS,
  EVENT_AUDIENCE_LABEL,
  eventWhen,
  deadlinePassed,
  type EventItem,
} from "@/lib/events";

export const metadata: Metadata = { title: "Événements" };

function frDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default async function EvenementsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: events }, { data: rsvps }, { data: invites }, { data: people }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, title, description, kind, starts_at, ends_at, location, audience, status, registration_deadline, capacity")
        .order("starts_at", { ascending: false }),
      supabase.from("event_rsvps").select("event_id, response"),
      supabase.from("event_invitations").select("event_id"),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["parent", "etudiant"])
        .order("full_name"),
    ]);

  const counts = new Map<string, { oui: number; peut_etre: number; non: number }>();
  for (const r of rsvps ?? []) {
    const c = counts.get(r.event_id) ?? { oui: 0, peut_etre: 0, non: 0 };
    if (r.response === "oui") c.oui++;
    else if (r.response === "peut_etre") c.peut_etre++;
    else if (r.response === "non") c.non++;
    counts.set(r.event_id, c);
  }
  const inviteCount = new Map<string, number>();
  for (const i of invites ?? []) inviteCount.set(i.event_id, (inviteCount.get(i.event_id) ?? 0) + 1);

  const list = (events ?? []) as EventItem[];

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">Événements</h1>
          <p className="mt-1 text-sm text-black/55">
            Créez les événements de la Vie IPMD — audience large ou invitations ciblées.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[24rem_1fr]">
            <div className="order-1">
              <EventForm />
            </div>

            <div className="order-2">
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-ipmd-black">Tous les événements</h2>
                <span className="rounded-full bg-ipmd-black px-2.5 py-1 text-xs font-bold text-white">
                  {list.length}
                </span>
              </div>
              {list.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun événement pour le moment.
                </p>
              ) : (
                <ul className="space-y-3">
                  {list.map((e) => {
                    const k = EVENT_KIND[e.kind] ?? EVENT_KIND.autre;
                    const st = EVENT_STATUS[e.status] ?? EVENT_STATUS.brouillon;
                    const c = counts.get(e.id) ?? { oui: 0, peut_etre: 0, non: 0 };
                    const remaining = e.capacity != null ? Math.max(0, e.capacity - c.oui) : null;
                    return (
                      <li key={e.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-ipmd-black">{k.icon} {e.title}</p>
                            <p className="text-xs text-black/50">
                              🗓️ {eventWhen(e.starts_at, e.ends_at)}
                              {e.location ? ` · 📍 ${e.location}` : ""}
                              {` · ${EVENT_AUDIENCE_LABEL[e.audience] ?? e.audience}`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-black/45">
                              {e.registration_deadline
                                ? `Limite : ${frDateTime(e.registration_deadline)}${deadlinePassed(e) ? " (dépassée)" : ""}`
                                : "Sans date limite"}
                              {e.capacity != null ? ` · Capacité ${e.capacity} · ${remaining} place(s) restante(s)` : ""}
                              {(inviteCount.get(e.id) ?? 0) > 0 ? ` · ${inviteCount.get(e.id)} invité(s) ciblé(s)` : ""}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full bg-green-600/10 px-2 py-0.5 font-bold text-green-700">✓ {c.oui} oui</span>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-800">? {c.peut_etre} peut-être</span>
                          <span className="rounded-full bg-black/5 px-2 py-0.5 font-bold text-black/50">✗ {c.non} non</span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          {e.status !== "publie" && e.status !== "annule" && (
                            <form action={setEventStatus.bind(null, e.id, "publie")}>
                              <button className="text-xs font-semibold text-green-700 hover:underline">Publier</button>
                            </form>
                          )}
                          {e.status === "publie" && (
                            <form action={setEventStatus.bind(null, e.id, "brouillon")}>
                              <button className="text-xs font-semibold text-ipmd-black hover:text-ipmd-red">Repasser en brouillon</button>
                            </form>
                          )}
                          {e.status !== "annule" && (
                            <form action={setEventStatus.bind(null, e.id, "annule")}>
                              <button className="text-xs font-semibold text-ipmd-red hover:underline">Annuler</button>
                            </form>
                          )}
                          {e.status === "annule" && (
                            <form action={setEventStatus.bind(null, e.id, "brouillon")}>
                              <button className="text-xs font-semibold text-ipmd-black hover:text-ipmd-red">Réactiver (brouillon)</button>
                            </form>
                          )}
                          <form action={deleteEvent.bind(null, e.id)}>
                            <button className="text-xs font-semibold text-black/40 hover:text-ipmd-red">Supprimer</button>
                          </form>
                        </div>

                        <EventInviteForm eventId={e.id} people={people ?? []} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
