/** Lundi (UTC) de la semaine d'une date donnée. */
function mondayOf(d: Date): Date {
  const day = d.getUTCDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setUTCDate(d.getUTCDate() + diff);
  return m;
}

/**
 * Dates de la semaine en cours (décalage en semaines), par jour 1..6
 * (Lundi..Samedi) au format YYYY-MM-DD. Abidjan = UTC.
 */
export function weekDates(offsetWeeks = 0): Record<number, string> {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + offsetWeeks * 7);
  const mon = mondayOf(base);
  const map: Record<number, string> = {};
  for (let i = 0; i < 6; i++) {
    const dt = new Date(mon);
    dt.setUTCDate(mon.getUTCDate() + i);
    map[i + 1] = dt.toISOString().slice(0, 10);
  }
  return map;
}

/** "2026-06-23" → "23/06". */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** Libellé de la semaine : « 22 – 27 juin 2026 ». */
export function weekLabel(dates: Record<number, string>): string {
  const start = dates[1];
  const end = dates[6];
  if (!start || !end) return "";
  const fmt = (iso: string, withMY: boolean) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
      day: "numeric",
      ...(withMY ? { month: "long", year: "numeric" } : {}),
      timeZone: "UTC",
    });
  return `${fmt(start, false)} – ${fmt(end, true)}`;
}
