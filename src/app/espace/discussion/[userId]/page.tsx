import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { SendDmForm } from "@/components/espace/SendDmForm";

export const metadata: Metadata = {
  title: "Discussion",
};

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId: otherId } = await params;
  const { supabase, userId } = await requireUser();

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", otherId)
    .single();
  if (!otherProfile) notFound();
  const otherName = otherProfile.full_name || otherProfile.email || "Membre";

  // Vérifie l'amitié.
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`
    )
    .eq("status", "accepted")
    .maybeSingle();
  const areFriends = Boolean(friendship);

  let messages: {
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }[] = [];
  if (areFriends) {
    const { data } = await supabase
      .from("direct_messages")
      .select("id, sender_id, body, created_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`
      )
      .order("created_at");
    messages = data ?? [];
    // Marque comme lus les messages reçus.
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("sender_id", otherId)
      .is("read_at", null);
  }

  return (
    <section className="min-h-[70vh] bg-ipmd-light">
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/espace/amis"
            className="text-sm font-semibold text-black/50 transition-colors hover:text-ipmd-red"
          >
            ← Communauté
          </Link>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ipmd-black">
            {otherName}
          </h1>

          {!areFriends ? (
            <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
              Vous n&apos;êtes pas amis. Envoie une demande d&apos;ami depuis la{" "}
              <Link href="/espace/amis" className="font-semibold text-ipmd-red">
                Communauté
              </Link>{" "}
              pour pouvoir discuter.
            </p>
          ) : (
            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="flex h-[26rem] flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-black/45">
                      Démarrez la conversation 👋
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === userId;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              mine
                                ? "bg-ipmd-red text-white"
                                : "bg-ipmd-light text-ipmd-black"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <SendDmForm recipientId={otherId} />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
