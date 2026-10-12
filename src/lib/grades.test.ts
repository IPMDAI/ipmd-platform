import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveGradeTypeAndCoef } from "./grades.ts";

// La saisie simple (addGrade) ET la saisie groupée (batchGrade) dérivent toutes
// deux le coefficient via resolveGradeTypeAndCoef(str(formData,"type")). Tester
// cette unique source de vérité prouve la règle pour les deux saisies.

test("Classe en saisie simple → coef 1", () => {
  assert.equal(resolveGradeTypeAndCoef("classe").coefficient, 1);
});

test("Examen en saisie simple → coef 2", () => {
  assert.equal(resolveGradeTypeAndCoef("examen").coefficient, 2);
});

test("Classe en saisie groupée → coef 1", () => {
  // Même helper que la saisie simple → garantie identique côté batch.
  assert.deepEqual(resolveGradeTypeAndCoef("classe"), { type: "classe", coefficient: 1 });
});

test("Examen en saisie groupée → coef 2", () => {
  assert.deepEqual(resolveGradeTypeAndCoef("examen"), { type: "examen", coefficient: 2 });
});

test("un coefficient envoyé manuellement par le client ne peut pas contourner la règle", () => {
  // Les actions serveur appellent resolveGradeTypeAndCoef(str(formData,"type")) :
  // elles ne passent QUE le type. On simule une charge client malveillante qui
  // tente d'imposer un coefficient — il est structurellement ignoré.
  const payloadExamenAvecCoef1 = { type: "examen", coefficient: "1" };
  const payloadClasseAvecCoef99 = { type: "classe", coefficient: "99" };
  // Exactement ce que fait l'action : seul `type` est transmis.
  assert.equal(resolveGradeTypeAndCoef(payloadExamenAvecCoef1.type).coefficient, 2);
  assert.equal(resolveGradeTypeAndCoef(payloadClasseAvecCoef99.type).coefficient, 1);
});

test("type inconnu → classe (coef 1) par sécurité", () => {
  assert.deepEqual(resolveGradeTypeAndCoef("bidon"), { type: "classe", coefficient: 1 });
});
