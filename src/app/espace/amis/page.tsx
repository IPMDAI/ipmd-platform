import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";

/** Réseau social désactivé pour le moment (messagerie officielle uniquement). */
const SOCIAL_ENABLED = false;
import { Container } from "@/components/ui/Container";
import {
  FriendDirectory,
  type Member,
} from "@/components/espace/FriendDirectory";
import { acceptFriend, removeFriend } from "@/lib/social-actions";

export const metadata: Metadata = {
  title: "Communauté",
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
};

export default async function AmisPage() {
  if (!SOCIAL_ENABLED) redirect("/espace");
  const { supabase, userId } = await requireUser();

  const [{ data: friendRows }, { data: people }] = await Promise.all([
    supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    supabase.from("profiles").select("id, full_name, email, role"),
  ]);

  const friendships = (friendRows ?? []) as Friendship[];
  const name = new Map<string, string>();
  const roleOf = new Map<string, string>();
  for (const p of people ?? []) {
    name.set(p.id, p.full_name || p.email || "Membre");
    roleOf.set(p.id, p.role);
  }
  const other = (f: Friendship) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id;

  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === userId
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === userId
  );
  const friends = friendships.filter((f) => f.status === "accepted");

  const related = new Set<string>([userId]);
  for (const f of friendships) related.add(other(f));
  const directory: Member[] = (people ?? [])
    .filter((p) => !related.has(p.id))
    .map((p) => ({
      id: p.id,
      name: p.full_name || p.email || "Membre",
      role: p.role,
    }));

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
            Communauté
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Ajoute des amis et discute en privé avec les membres de l&apos;IPMD.
          </p>

          {/* Demandes reçues */}
          {incoming.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
                Demandes reçues ({incoming.length})
              </h2>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {incoming.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 p-4">
                    <span className="font-semibold text-ipmd-black">
                      {name.get(f.requester_id) ?? "Membre"}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <form action={acceptFriend.bind(null, f.id)}>
                        <button className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white">
                          Accepter
                        </button>
                      </form>
                      <form action={removeFriend.bind(null, f.id)}>
                        <button className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-black/60">
                          Refuser
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mes amis */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
              Mes amis ({friends.length})
            </h2>
            {friends.length === 0 ? (
              <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                Tu n&apos;as pas encore d&apos;amis. Ajoute des membres ci-dessous.
              </p>
            ) : (
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {friends.map((f) => {
                  const oid = other(f);
                  return (
                    <li key={f.id} className="flex items-center justify-between gap-3 p-4">
                      <Link
                        href={`/espace/discussion/${oid}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate font-semibold text-ipmd-black">
                          {name.get(oid) ?? "Membre"}
                        </p>
                        <p className="text-xs font-semibold text-ipmd-red">
                          💬 Discuter
                        </p>
                      </Link>
                      <form action={removeFriend.bind(null, f.id)}>
                        <button className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-ipmd-red hover:bg-ipmd-red/10">
                          Retirer
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Demandes envoyées */}
          {outgoing.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
                Demandes envoyées
              </h2>
              <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                {outgoing.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 p-4">
                    <span className="text-black/70">
                      {name.get(f.addressee_id) ?? "Membre"}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-black/40">En attente</span>
                      <form action={removeFriend.bind(null, f.id)}>
                        <button className="text-xs font-semibold text-ipmd-red hover:underline">
                          Annuler
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Annuaire */}
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-black/40">
              Trouver des membres
            </h2>
            <FriendDirectory members={directory} />
          </div>
        </div>
      </Container>
    </section>
  );
}
