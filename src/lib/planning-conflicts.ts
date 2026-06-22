import { DAY_LABELS, formatTime } from "@/lib/schedule";

export type Slot = {
  id: string;
  class_id: string;
  subject: string;
  teacher_id: string | null;
  room_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type Conflict = {
  kind: "salle" | "enseignant" | "classe";
  day: number;
  detail: string;
};

/** Deux créneaux du même jour se chevauchent-ils ? */
function overlap(a: Slot, b: Slot): boolean {
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

/**
 * Détecte les conflits du planning hebdomadaire : une salle, un enseignant
 * ou une classe ne peut pas être à deux endroits au même moment.
 */
export function findConflicts(
  slots: Slot[],
  names: {
    classes: Map<string, string>;
    rooms: Map<string, string>;
    teachers: Map<string, string>;
  }
): Conflict[] {
  const conflicts: Conflict[] = [];
  const seen = new Set<string>();

  const push = (kind: Conflict["kind"], day: number, who: string, a: Slot, b: Slot) => {
    const key = [kind, day, [a.id, b.id].sort().join("-")].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    const when = `${DAY_LABELS[day] ?? "?"} ${formatTime(a.start_time)}–${formatTime(a.end_time)} / ${formatTime(b.start_time)}–${formatTime(b.end_time)}`;
    conflicts.push({ kind, day, detail: `${who} — ${when}` });
  };

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (a.day_of_week !== b.day_of_week || !overlap(a, b)) continue;

      if (a.room_id && a.room_id === b.room_id) {
        push("salle", a.day_of_week, `Salle « ${names.rooms.get(a.room_id) ?? "?"} »`, a, b);
      }
      if (a.teacher_id && a.teacher_id === b.teacher_id) {
        push("enseignant", a.day_of_week, `Enseignant « ${names.teachers.get(a.teacher_id) ?? "?"} »`, a, b);
      }
      if (a.class_id === b.class_id) {
        push("classe", a.day_of_week, `Classe « ${names.classes.get(a.class_id) ?? "?"} »`, a, b);
      }
    }
  }

  conflicts.sort((x, y) => x.day - y.day);
  return conflicts;
}

export const CONFLICT_LABEL: Record<Conflict["kind"], string> = {
  salle: "Salle occupée deux fois",
  enseignant: "Enseignant en double",
  classe: "Classe en double cours",
};
