import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { RsvpButtons } from "@/components/espace/RsvpButtons";
import {
  EVENT_KIND,
  eventWhen,
  deadlinePassed,
  type EventItem,
} from "@/lib/events";

export const metadata: Metadata = { title: "Vie IPMD" };

export default async function VieIpmdPage() {
  const { supabase, userId } = await requireUser();

  // Événements visibles (RLS : publiés + audience). On garde les à venir.
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("events")
    .select("id, title, description, kind, starts_at, ends_at, location, audience, status, registration_deadline, capacity")
    .gte("starts_at", since)
    .order("starts_at", { ascending: true });
  const events = (rows ?? []) as EventItem[];

  let myRsvp = new Map<string, string>();
  const remaining = new Map<string, number>();
  if (events.length > 0) {
    const { data: r } = await supabase
      .from("event_rsvps")
      .select("event_id, response")
      .eq("user_id", userId)
      .in("event_id", events.map((e) => e.id));
    myRsvp = new Map((r ?? []).map((x) => [x.event_id, x.response]));

    // Places restantes (via fonction SECURITY DEFINER) pour les événements à capacité.
    await Promise.all(
      events
        .filter((e) => e.capacity != null && e.status === "publie")
        .map(async (e) => {
          const { data: n } = await supabase.rpc("event_oui_count", { p_event: e.id });
          remaining.set(e.id, Math.max(0, (e.capacity ?? 0) - (typeof n === "number" ? n : 0)));
        })
    );
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Link href="/espace" className="text-sm font-semibold text-black/50 hover:text-ipmd-red">
            ← Retour à l&apos;espace
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            🎉 Vie IPMD
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Les prochains rendez-vous de l&apos;IPMD — indiquez si vous participez.
          </p>

          {events.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Aucun événement à venir pour le moment.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {events.map((e) => {
                const k = EVENT_KIND[e.kind] ?? EVENT_KIND.autre;
                const cancelled = e.status === "annule";
                const closed = cancelled || deadlinePassed(e);
                const mine = myRsvp.get(e.id) ?? null;
                const left = remaining.get(e.id);
                const full = left != null && left <= 0 && mine !== "oui";
                return (
                  <li
                    key={e.id}
                    className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ${
                      cancelled ? "ring-ipmd-red/20 opacity-80" : "ring-black/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>{k.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-ipmd-black">{e.title}</p>
                          {cancelled && (
                            <span className="rounded-full bg-ipmd-red/10 px-2.5 py-0.5 text-[10px] font-bold text-ipmd-red">
                              Annulé
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-black/55">
                          🗓️ {eventWhen(e.starts_at, e.ends_at)}
                          {e.location ? ` · 📍 ${e.location}` : ""}
                        </p>
                        {!cancelled && e.capacity != null && (
                          <p className="mt-0.5 text-[11px] font-semibold text-black/50">
                            {full ? "Complet" : `${left} place(s) restante(s)`}
                          </p>
                        )}
                        {!cancelled && deadlinePassed(e) && (
                          <p className="mt-0.5 text-[11px] font-semibold text-ipmd-red">
                            Inscriptions closes
                          </p>
                        )}
                      </div>
                    </div>
                    {e.description && (
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-black/70">
                        {e.description}
                      </p>
                    )}
                    {!cancelled && (
                      <div className="mt-3">
                        <RsvpButtons
                          eventId={e.id}
                          current={mine}
                          disabled={closed}
                          ouiDisabled={full}
                        />
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
