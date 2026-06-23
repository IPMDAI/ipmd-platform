"use client";

import { useActionState } from "react";
import { saveTeacherProfile } from "@/lib/teacher-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import { TEACHER_STATUSES } from "@/lib/teacher";
import type { FormResult } from "@/types";

export type TeacherSheet = {
  phone?: string | null;
  function?: string | null;
  title?: string | null;
  specialty?: string | null;
  availability?: string | null;
  cv_url?: string | null;
  diplomas?: string | null;
  authorization?: string | null;
  status?: string | null;
  civilite?: string | null;
  prenoms?: string | null;
  type_piece?: string | null;
  num_piece?: string | null;
  nationalite?: string | null;
  date_naissance?: string | null;
  situation_matrimoniale?: string | null;
  pays_residence?: string | null;
  ville_residence?: string | null;
  diploma_date?: string | null;
  diploma_school?: string | null;
  emergency_name?: string | null;
  emergency_phone?: string | null;
};

export function TeacherProfileForm({
  teacherId,
  sheet,
}: {
  teacherId: string;
  sheet: TeacherSheet;
}) {
  const bound = saveTeacherProfile.bind(null, teacherId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-black/5 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Fonction réelle" htmlFor={`f-${teacherId}`}>
          <input
            id={`f-${teacherId}`}
            name="function"
            defaultValue={sheet.function ?? ""}
            placeholder="Consultant en Marketing digital"
            className={inputBase}
          />
        </Field>
        <Field label="Titre / qualité" htmlFor={`t-${teacherId}`}>
          <input
            id={`t-${teacherId}`}
            name="title"
            defaultValue={sheet.title ?? ""}
            placeholder="Dr, Enseignant-chercheur…"
            className={inputBase}
          />
        </Field>
        <Field label="Spécialité" htmlFor={`s-${teacherId}`}>
          <input
            id={`s-${teacherId}`}
            name="specialty"
            defaultValue={sheet.specialty ?? ""}
            className={inputBase}
          />
        </Field>
        <Field label="Téléphone" htmlFor={`p-${teacherId}`}>
          <input
            id={`p-${teacherId}`}
            name="phone"
            defaultValue={sheet.phone ?? ""}
            className={inputBase}
          />
        </Field>
        <Field label="Disponibilité" htmlFor={`a-${teacherId}`}>
          <input
            id={`a-${teacherId}`}
            name="availability"
            defaultValue={sheet.availability ?? ""}
            placeholder="Ex. Mar–Jeu, après-midi"
            className={inputBase}
          />
        </Field>
        <Field label="Statut" htmlFor={`st-${teacherId}`}>
          <select
            id={`st-${teacherId}`}
            name="status"
            defaultValue={sheet.status ?? "en_attente"}
            className={inputBase}
          >
            {TEACHER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lien CV" htmlFor={`cv-${teacherId}`}>
          <input
            id={`cv-${teacherId}`}
            name="cv_url"
            defaultValue={sheet.cv_url ?? ""}
            placeholder="https://…"
            className={inputBase}
          />
        </Field>
        <Field label="Autorisation d'enseigner" htmlFor={`au-${teacherId}`}>
          <input
            id={`au-${teacherId}`}
            name="authorization"
            defaultValue={sheet.authorization ?? ""}
            className={inputBase}
          />
        </Field>
      </div>
      <Field label="Diplômes" htmlFor={`d-${teacherId}`}>
        <textarea
          id={`d-${teacherId}`}
          name="diplomas"
          rows={2}
          defaultValue={sheet.diplomas ?? ""}
          placeholder="Master en marketing, Certifications…"
          className={inputBase}
        />
      </Field>

      <details>
        <summary className="cursor-pointer text-xs font-semibold text-ipmd-red">
          État civil & contrat (pour pré-remplir le contrat)
        </summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Field label="Civilité (M./Mme/Mlle)" htmlFor={`civ-${teacherId}`}>
            <input id={`civ-${teacherId}`} name="civilite" defaultValue={sheet.civilite ?? ""} className={inputBase} />
          </Field>
          <Field label="Prénoms" htmlFor={`pre-${teacherId}`}>
            <input id={`pre-${teacherId}`} name="prenoms" defaultValue={sheet.prenoms ?? ""} className={inputBase} />
          </Field>
          <Field label="Type de pièce" htmlFor={`tp-${teacherId}`}>
            <input id={`tp-${teacherId}`} name="type_piece" defaultValue={sheet.type_piece ?? ""} placeholder="CNI, Passeport…" className={inputBase} />
          </Field>
          <Field label="N° pièce" htmlFor={`np-${teacherId}`}>
            <input id={`np-${teacherId}`} name="num_piece" defaultValue={sheet.num_piece ?? ""} className={inputBase} />
          </Field>
          <Field label="Nationalité" htmlFor={`na-${teacherId}`}>
            <input id={`na-${teacherId}`} name="nationalite" defaultValue={sheet.nationalite ?? ""} className={inputBase} />
          </Field>
          <Field label="Date de naissance" htmlFor={`dn-${teacherId}`}>
            <input id={`dn-${teacherId}`} name="date_naissance" type="date" defaultValue={sheet.date_naissance ?? ""} className={inputBase} />
          </Field>
          <Field label="Situation matrimoniale" htmlFor={`sm-${teacherId}`}>
            <input id={`sm-${teacherId}`} name="situation_matrimoniale" defaultValue={sheet.situation_matrimoniale ?? ""} className={inputBase} />
          </Field>
          <Field label="Pays de résidence" htmlFor={`pr-${teacherId}`}>
            <input id={`pr-${teacherId}`} name="pays_residence" defaultValue={sheet.pays_residence ?? ""} className={inputBase} />
          </Field>
          <Field label="Ville de résidence" htmlFor={`vr-${teacherId}`}>
            <input id={`vr-${teacherId}`} name="ville_residence" defaultValue={sheet.ville_residence ?? ""} className={inputBase} />
          </Field>
          <Field label="Date d'obtention du diplôme" htmlFor={`dd-${teacherId}`}>
            <input id={`dd-${teacherId}`} name="diploma_date" type="date" defaultValue={sheet.diploma_date ?? ""} className={inputBase} />
          </Field>
          <Field label="École du diplôme" htmlFor={`ds-${teacherId}`}>
            <input id={`ds-${teacherId}`} name="diploma_school" defaultValue={sheet.diploma_school ?? ""} className={inputBase} />
          </Field>
          <Field label="Personne à prévenir (nom)" htmlFor={`en-${teacherId}`}>
            <input id={`en-${teacherId}`} name="emergency_name" defaultValue={sheet.emergency_name ?? ""} className={inputBase} />
          </Field>
          <Field label="Personne à prévenir (tél)" htmlFor={`ep-${teacherId}`}>
            <input id={`ep-${teacherId}`} name="emergency_phone" defaultValue={sheet.emergency_phone ?? ""} className={inputBase} />
          </Field>
        </div>
      </details>
      <ActionButton type="submit" disabled={pending}>
        {pending ? "…" : "Enregistrer la fiche"}
      </ActionButton>
      {state && (
        <p
          className={`text-sm font-medium ${
            state.ok ? "text-green-600" : "text-ipmd-red"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
