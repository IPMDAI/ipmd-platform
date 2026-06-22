import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { Container } from "@/components/ui/Container";
import { AddHolidayForm } from "@/components/espace/AddHolidayForm";
import { deleteHoliday } from "@/lib/holiday-actions";

export const metadata: Metadata = {
  title: "Jours fériés",
};

const STAFF = ["admin", "super_admin", "pedagogie"];

function frDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function JoursFeriesPage() {
  const { supabase, userId } = await requireUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (!STAFF.includes(me?.role ?? "")) redirect("/espace");

  const { data: rows } = await supabase
    .from("holidays")
    .select("id, day, label")
    .order("day");
  const holidays = rows ?? [];

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
            Jours fériés
          </h1>
          <p className="mt-1 text-sm text-black/55">
            Les jours sans cours apparaissent marqués dans les emplois du temps.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="order-2 lg:order-1">
              {holidays.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
                  Aucun jour férié enregistré.
                </p>
              ) : (
                <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                  {holidays.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-ipmd-black">{h.label}</p>
                        <p className="text-xs capitalize text-black/50">
                          {frDate(h.day)}
                        </p>
                      </div>
                      <form action={deleteHoliday.bind(null, h.id)}>
                        <button className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-ipmd-red transition-colors hover:bg-ipmd-red/10">
                          Suppr.
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <AddHolidayForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
