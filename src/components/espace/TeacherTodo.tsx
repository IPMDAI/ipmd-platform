import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Todo = { icon: string; text: string; href: string; tone: "info" | "alert" };

function frDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
  });
}

/** Panneau « À faire » de l'enseignant : signaux dérivés de ses cours. */
export async function TeacherTodo({ userId }: { userId: string }) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title")
    .eq("teacher_id", userId);
  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return null;
  const courseTitle = new Map((courses ?? []).map((c) => [c.id, c.title]));

  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: assigns }, { data: enr }] = await Promise.all([
    supabase
      .from("assignments")
      .select("title, course_id, due_date")
      .in("course_id", courseIds),
    supabase.from("enrollments").select("course_id").in("course_id", courseIds),
  ]);

  const enrolled = new Set((enr ?? []).map((e) => e.course_id));

  const todos: Todo[] = [];

  // Devoirs dont l'échéance est passée → à évaluer.
  for (const a of assigns ?? []) {
    if (a.due_date && a.due_date < today) {
      todos.push({
        icon: "📝",
        text: `À évaluer : ${a.title} — ${courseTitle.get(a.course_id) ?? "cours"} (échéance ${frDate(a.due_date)})`,
        href: `/espace/cours/${a.course_id}`,
        tone: "alert",
      });
    }
  }
  // Devoirs à venir (7 jours).
  for (const a of assigns ?? []) {
    if (a.due_date && a.due_date >= today && a.due_date <= in7) {
      todos.push({
        icon: "⏳",
        text: `Devoir à rendre bientôt : ${a.title} — ${courseTitle.get(a.course_id) ?? "cours"} (${frDate(a.due_date)})`,
        href: `/espace/cours/${a.course_id}`,
        tone: "info",
      });
    }
  }
  // Cours sans étudiant inscrit.
  for (const c of courses ?? []) {
    if (!enrolled.has(c.id)) {
      todos.push({
        icon: "👥",
        text: `Aucun étudiant inscrit : ${c.title}`,
        href: `/espace/cours/${c.id}`,
        tone: "info",
      });
    }
  }

  if (todos.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h3 className="flex items-center gap-2 font-bold text-ipmd-black">
        ✅ À faire
        <span className="rounded-full bg-ipmd-red px-2 py-0.5 text-xs font-bold text-white">
          {todos.length}
        </span>
      </h3>
      <ul className="mt-3 space-y-2">
        {todos.slice(0, 8).map((t, i) => (
          <li key={i}>
            <Link
              href={t.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/5 ${
                t.tone === "alert" ? "bg-ipmd-red/5" : "bg-ipmd-light"
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span className="min-w-0 flex-1 text-black/75">{t.text}</span>
              <span className="shrink-0 text-xs font-semibold text-ipmd-red">
                Ouvrir →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
