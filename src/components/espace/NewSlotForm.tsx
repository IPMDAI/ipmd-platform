"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { addTimetableSlot } from "@/lib/planning-actions";
import { Field, inputBase } from "@/components/forms/FormField";
import { ActionButton } from "@/components/ui/Button";
import {
  DAY_OPTIONS,
  SESSION_TYPES,
  MODALITIES,
  moduleRequirement,
} from "@/lib/schedule";
import type { FormResult } from "@/types";

type Named = { id: string; name: string };
type ModuleItem = { id: string; name: string; semester: string | null };

export function NewSlotForm({
  classId,
  teachers,
  rooms,
  modules,
  hasFiliere,
}: {
  classId: string;
  teachers: Named[];
  rooms: Named[];
  modules: ModuleItem[];
  hasFiliere: boolean;
}) {
  const bound = addTimetableSlot.bind(null, classId);
  const [state, action, pending] = useActionState<FormResult | null, FormData>(
    bound,
    null
  );
  const ref = useRef<HTMLFormElement>(null);

  const [type, setType] = useState("");
  const [moduleId, setModuleId] = useState("");

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setType("");
      setModuleId("");
    }
  }, [state]);

  // Modules groupés par semestre (S1 avant S2).
  const bySemester = useMemo(() => {
    const g = new Map<string, ModuleItem[]>();
    for (const m of modules) {
      const k = m.semester ?? "Autres";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(m);
    }
    return [...g.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [modules]);

  const req = type ? moduleRequirement(type) : null; // null tant que type non choisi
  const showModule = req === "required" || req === "optional";
  const moduleMandatory = req === "required";
  const noModulePossible = showModule && (!hasFiliere || modules.length === 0);
  // Intitulé libre : type hors module, OU type facultatif sans module choisi.
  const showFreeSubject =
    req === "none" || (req === "optional" && !moduleId);
  const blocked = moduleMandatory && noModulePossible;

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-ipmd-black">Ajouter un créneau</h2>

      {/* Type + modalité d'abord : ils pilotent le choix du module. */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" htmlFor="p-type" required>
          <select
            id="p-type"
            name="type"
            required
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setModuleId("");
            }}
            className={inputBase}
          >
            <option value="" disabled>
              — Choisir —
            </option>
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Modalité" htmlFor="p-modality" required>
          <select id="p-modality" name="modality" required defaultValue="" className={inputBase}>
            <option value="" disabled>
              — Choisir —
            </option>
            {MODALITIES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Module officiel (selon le type). */}
      {showModule &&
        (noModulePossible ? (
          <div className="rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
            {!hasFiliere
              ? "Cette classe n'est rattachée à aucune filière : impossible de sélectionner un module officiel."
              : "Aucun module actif dans la maquette de cette classe pour cette année."}
            {moduleMandatory && " Ce type de séance exige un module."}
          </div>
        ) : (
          <Field
            label={moduleMandatory ? "Module (officiel)" : "Module (optionnel)"}
            htmlFor="p-module"
            required={moduleMandatory}
          >
            <select
              id="p-module"
              name="module_id"
              required={moduleMandatory}
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className={inputBase}
            >
              <option value="">
                {moduleMandatory ? "— Choisir un module —" : "— Aucun (transversal) —"}
              </option>
              {bySemester.map(([sem, mods]) => (
                <optgroup key={sem} label={sem}>
                  {mods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        ))}

      {/* Intitulé libre (hors module, ou facultatif sans module). */}
      {showFreeSubject && (
        <Field
          label={req === "none" ? "Intitulé" : "Intitulé (hors module)"}
          htmlFor="p-subject"
          required
        >
          <input
            id="p-subject"
            name="subject"
            required
            placeholder="Ex. Journée portes ouvertes"
            className={inputBase}
          />
        </Field>
      )}

      <Field label="Professeur" htmlFor="p-teacher">
        <select id="p-teacher" name="teacher_id" defaultValue="" className={inputBase}>
          <option value="">— Aucun —</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Salle" htmlFor="p-room">
        <select id="p-room" name="room_id" defaultValue="" className={inputBase}>
          <option value="">— Aucune —</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Jour" htmlFor="p-day" required>
        <select id="p-day" name="day_of_week" required className={inputBase}>
          {DAY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Début" htmlFor="p-start" required>
          <input id="p-start" name="start_time" type="time" required className={inputBase} />
        </Field>
        <Field label="Fin" htmlFor="p-end" required>
          <input id="p-end" name="end_time" type="time" required className={inputBase} />
        </Field>
      </div>

      <ActionButton type="submit" disabled={pending || blocked}>
        {pending ? "Ajout…" : "Ajouter au planning"}
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
