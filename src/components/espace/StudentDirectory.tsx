"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ContactEditForm, type Contacts } from "@/components/espace/ContactEditForm";
import { StudentCivilForm, type ClassOption } from "@/components/espace/StudentCivilForm";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  className: string | null;
  filiereName: string | null;
  academicYear: string | null;
  contacts: Contacts;
  birthDate: string | null;
  birthPlace: string | null;
  classId: string | null;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function StudentDirectory({
  students,
  classes,
}: {
  students: StudentRow[];
  classes: ClassOption[];
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");

  const years = useMemo(
    () => [...new Set(students.map((s) => s.academicYear).filter(Boolean) as string[])].sort().reverse(),
    [students]
  );

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return students.filter((s) => {
      if (year && s.academicYear !== year) return false;
      if (!q) return true;
      return normalize(
        `${s.name} ${s.email} ${s.className ?? ""} ${s.filiereName ?? ""} ${s.contacts.phone ?? ""} ${s.contacts.whatsapp ?? ""} ${s.contacts.personal_email ?? ""} ${s.contacts.school_email ?? ""}`
      ).includes(q);
    });
  }, [students, query, year]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un étudiant, une classe…"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-ipmd-black outline-none ring-ipmd-red/20 transition-shadow focus:ring-2 sm:max-w-sm"
        />
        <div className="flex items-center gap-2">
          {years.length > 0 && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-ipmd-black"
            >
              <option value="">Toutes les années</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          <span className="text-sm text-black/45">
            {results.length} / {students.length}
          </span>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
          Aucun étudiant ne correspond.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {results.map((s) => (
            <li key={s.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ipmd-light ring-1 ring-black/10">
                    {s.avatarUrl ? (
                      <Image src={s.avatarUrl} alt={s.name} width={44} height={44} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <span className="text-xs font-bold text-black/35">{initialsOf(s.name) || "👤"}</span>
                    )}
                  </span>
                  <div className="min-w-0">
                  <p className="truncate font-semibold text-ipmd-black">
                    {s.name}
                  </p>
                  <p className="truncate text-sm text-black/50">{s.email}</p>
                  <p className="mt-0.5 text-xs text-black/45">
                    {s.className || s.filiereName ? (
                      <>
                        {s.filiereName ? `${s.filiereName} · ` : ""}
                        {s.className ?? "—"}
                      </>
                    ) : (
                      <span className="text-ipmd-red/70">
                        Aucune classe affectée
                      </span>
                    )}
                  </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link
                    href={`/espace/bulletin/${s.id}`}
                    className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black transition-colors hover:bg-black/5"
                  >
                    📄 Bulletin
                  </Link>
                  <Link
                    href={`/espace/documents?student=${s.id}`}
                    className="rounded-full bg-ipmd-light px-3 py-1.5 text-xs font-semibold text-ipmd-black transition-colors hover:bg-black/5"
                  >
                    🪪 Documents
                  </Link>
                </div>
              </div>
              <ContactEditForm userId={s.id} contacts={s.contacts} />
              <StudentCivilForm
                userId={s.id}
                name={s.name}
                birthDate={s.birthDate}
                birthPlace={s.birthPlace}
                classId={s.classId}
                classes={classes}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
