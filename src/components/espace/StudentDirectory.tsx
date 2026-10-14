"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ContactEditForm, type Contacts } from "@/components/espace/ContactEditForm";
import { StudentCivilForm, type ClassOption } from "@/components/espace/StudentCivilForm";
import { FINANCIAL_STANDING } from "@/lib/finance";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  matricule?: string | null;
  avatarUrl: string | null;
  className: string | null;
  filiereName: string | null;
  academicYear: string | null;
  contacts: Contacts;
  birthDate: string | null;
  birthPlace: string | null;
  classId: string | null;
  /** Standing financier (a_jour/en_retard/acces_en_pause/a_verifier) — sans montants. */
  standing?: string | null;
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

/**
 * Une fiche étudiant. Au chargement : lecture seule (identité, matricule,
 * filière/classe, badge standing, actions). Les formulaires d'édition lourds
 * (ContactEditForm / StudentCivilForm) ne sont montés QUE sur clic « Modifier »,
 * et UNIQUEMENT si `canEdit`.
 */
function StudentCard({
  s,
  classes,
  canEdit,
}: {
  s: StudentRow;
  classes: ClassOption[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const standing = s.standing && FINANCIAL_STANDING[s.standing];

  return (
    <li className="p-4">
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
            <p className="truncate font-semibold text-ipmd-black">{s.name}</p>
            <p className="truncate text-sm text-black/50">
              {s.matricule ? s.matricule : s.email}
            </p>
            <p className="mt-0.5 text-xs text-black/45">
              {s.className || s.filiereName ? (
                <>
                  {s.filiereName ? `${s.filiereName} · ` : ""}
                  {s.className ?? "—"}
                </>
              ) : (
                <span className="text-ipmd-red/70">Aucune classe affectée</span>
              )}
            </p>
            {standing && (
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${standing.cls}`}
                title="Standing financier (suivi académique, sans montant)"
              >
                {standing.label}
              </span>
            )}
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
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-black/10 transition-colors hover:bg-black/5"
            >
              {editing ? "Fermer" : "✏️ Modifier"}
            </button>
          )}
        </div>
      </div>

      {canEdit && editing && (
        <div className="mt-3 border-t border-black/5 pt-3">
          <ContactEditForm userId={s.id} contacts={s.contacts} />
          <StudentCivilForm
            userId={s.id}
            name={s.name}
            birthDate={s.birthDate}
            birthPlace={s.birthPlace}
            classId={s.classId}
            classes={classes}
          />
        </div>
      )}
    </li>
  );
}

/**
 * Liste des fiches étudiants d'UNE page (recherche + pagination gérées côté
 * serveur par la page). Ne monte aucun formulaire d'édition au rendu.
 */
export function StudentDirectory({
  students,
  classes,
  canEdit = false,
}: {
  students: StudentRow[];
  classes: ClassOption[];
  canEdit?: boolean;
}) {
  if (students.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-sm text-black/55 shadow-sm ring-1 ring-black/5">
        Aucun étudiant ne correspond.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      {students.map((s) => (
        <StudentCard key={s.id} s={s} classes={classes} canEdit={canEdit} />
      ))}
    </ul>
  );
}
