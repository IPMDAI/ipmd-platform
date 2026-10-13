import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSlotModule, type SlotModuleRow } from "./slot-module.ts";

const CLASS = {
  classFiliereId: "fil-comm",
  classLevel: "Licence 1",
  classYear: "2026-2027",
};
const goodModule: SlotModuleRow = {
  id: "mod-1",
  name: "Art Oratoire",
  status: "actif",
  filiere_id: "fil-comm",
  level: "Licence 1",
  academic_year: "2026-2027",
};

test("Cours sans module → rejet", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: null, module: null, freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Cours avec module de la bonne classe → accepté, subject imposé = nom du module", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: "mod-1", module: goodModule,
    freeSubject: "n'importe quoi", ...CLASS,
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.subject, "Art Oratoire"); // le texte libre est ignoré
    assert.equal(r.moduleId, "mod-1");
  }
});

test("Module d'une autre filière → rejet", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: "mod-x",
    module: { ...goodModule, id: "mod-x", filiere_id: "fil-autre" },
    freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Module d'un autre niveau/année → rejet", () => {
  const r = resolveSlotModule({
    type: "examen", moduleId: "mod-x",
    module: { ...goodModule, level: "Licence 2" },
    freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Module reserve → rejet", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: "mod-x",
    module: { ...goodModule, status: "reserve" },
    freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Module en_attente → rejet", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: "mod-x",
    module: { ...goodModule, status: "en_attente" },
    freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Type académique mais classe sans filière → rejet", () => {
  const r = resolveSlotModule({
    type: "cours", moduleId: null, module: null, freeSubject: "",
    classFiliereId: null, classLevel: "Licence 1", classYear: "2026-2027",
  });
  assert.equal(r.ok, false);
});

test("Journée IPMD sans module → accepté (intitulé libre)", () => {
  const r = resolveSlotModule({
    type: "journee_ipmd", moduleId: null, module: null,
    freeSubject: "Journée portes ouvertes", ...CLASS,
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.subject, "Journée portes ouvertes");
    assert.equal(r.moduleId, null);
  }
});

test("Journée IPMD sans intitulé → rejet", () => {
  const r = resolveSlotModule({
    type: "journee_ipmd", moduleId: null, module: null, freeSubject: "  ", ...CLASS,
  });
  assert.equal(r.ok, false);
});

test("Atelier sans module → accepté (intitulé libre)", () => {
  const r = resolveSlotModule({
    type: "atelier", moduleId: null, module: null,
    freeSubject: "Atelier CV", ...CLASS,
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.moduleId, null);
});

test("Atelier avec module valide → accepté (liaison réelle)", () => {
  const r = resolveSlotModule({
    type: "atelier", moduleId: "mod-1", module: goodModule, freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.subject, "Art Oratoire");
    assert.equal(r.moduleId, "mod-1");
  }
});

test("Atelier avec module d'une autre filière → rejet", () => {
  const r = resolveSlotModule({
    type: "atelier", moduleId: "mod-x",
    module: { ...goodModule, filiere_id: "fil-autre" }, freeSubject: "", ...CLASS,
  });
  assert.equal(r.ok, false);
});
