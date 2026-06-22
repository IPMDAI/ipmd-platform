import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatFCFA } from "@/lib/finance";

type Notif = { icon: string; text: string; href: string; tone: "info" | "alert" };

/**
 * Notifications « dérivées » de l'étudiant : calculées à la volée à partir
 * des données existantes (notes récentes, devoirs à venir, solde) — sans
 * table dédiée. RLS : l'étudiant ne voit que ses propres données.
 */
export async function NotificationsPanel({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in14 = new Date(now.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  const gradeCutoff = new Date(now.getTime() - 14 * 86400000).toISOString();

  // Cours suivis (pour les devoirs).
  const { data: enr } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", userId);
  const courseIds = [...new Set((enr ?? []).map((e) => e.course_id))];

  // Notes récentes.
  const { data: grades } = await supabase
    .from("grades")
    .select("course_id, title, score, max_score, created_at")
    .eq("student_id", userId)
    .gte("created_at", gradeCutoff)
    .order("created_at", { ascending: false })
    .limit(4);

  // Devoirs à venir.
  let assignments: { title: string; course_id: string; due_date: string }[] = [];
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from("assignments")
      .select("title, course_id, due_date")
      .in("course_id", courseIds)
      .gte("due_date", todayStr)
      .lte("due_date", in14)
      .order("due_date");
    assignments = (data ?? []) as typeof assignments;
  }

  // Titres des cours concernés.
  const allCids = [
    ...new Set([
      ...(grades ?? []).map((g) => g.course_id),
      ...assignments.map((a) => a.course_id),
    ]),
  ];
  const courseTitle = new Map<string, string>();
  if (allCids.length > 0) {
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title")
      .in("id", allCids);
    for (const c of courses ?? []) courseTitle.set(c.id, c.title);
  }

  // Solde.
  const { data: finance } = await supabase
    .from("student_finance")
    .select("total_due")
    .eq("student_id", userId)
    .maybeSingle();
  const { data: payRows } = await supabase
    .from("payments")
    .select("amount")
    .eq("student_id", userId);
  const balance =
    Number(finance?.total_due ?? 0) -
    (payRows ?? []).reduce((a, p) => a + Number(p.amount), 0);

  const notifs: Notif[] = [];

  for (const a of assignments) {
    notifs.push({
      icon: "📝",
      text: `Devoir à rendre : ${a.title} — ${courseTitle.get(a.course_id) ?? "cours"} (échéance ${new Date(a.due_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })})`,
      href: "/espace/mes-cours",
      tone: "alert",
    });
  }
  for (const g of grades ?? []) {
    notifs.push({
      icon: "📊",
      text: `Note publiée : ${courseTitle.get(g.course_id) ?? "cours"} — ${Number(g.score)}/${Number(g.max_score)}`,
      href: "/espace/mes-notes",
      tone: "info",
    });
  }
  if (balance > 0) {
    notifs.push({
      icon: "💳",
      text: `Solde à régler : ${formatFCFA(balance)}`,
      href: "/espace/mes-paiements",
      tone: "alert",
    });
  }

  if (notifs.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="flex items-center gap-2 font-bold text-ipmd-black">
        🔔 À ne pas manquer
        <span className="rounded-full bg-ipmd-red px-2 py-0.5 text-xs font-bold text-white">
          {notifs.length}
        </span>
      </h3>
      <ul className="mt-3 space-y-2">
        {notifs.slice(0, 6).map((n, i) => (
          <li key={i}>
            <Link
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/5 ${
                n.tone === "alert" ? "bg-ipmd-red/5" : "bg-ipmd-light"
              }`}
            >
              <span className="text-base leading-none">{n.icon}</span>
              <span className="min-w-0 flex-1 text-black/75">{n.text}</span>
              <span className="shrink-0 text-xs font-semibold text-ipmd-red">
                Voir →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
