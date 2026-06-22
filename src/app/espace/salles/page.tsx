import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/require-admin";
import { Container } from "@/components/ui/Container";
import { NewRoomForm } from "@/components/espace/referentiel-forms";
import { deleteRoom } from "@/lib/referentiel-actions";

export const metadata: Metadata = {
  title: "Salles",
};

export default async function SallesPage() {
  const { supabase } = await requireAdmin();

  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name, capacity")
    .order("name");

  const roomList = rooms ?? [];

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
            Salles
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Les salles disponibles, utilisées ensuite pour le planning.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {roomList.length === 0 ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucune salle.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {roomList.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <span className="font-semibold text-ipmd-black">
                          {r.name}
                        </span>
                        {r.capacity != null && (
                          <span className="ml-2 text-sm text-black/50">
                            {r.capacity} places
                          </span>
                        )}
                      </div>
                      <form action={deleteRoom.bind(null, r.id)}>
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
              <NewRoomForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
