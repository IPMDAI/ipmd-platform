import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveLevelBilling, capPlanMonths, type LevelRow } from "./level-billing.ts";

const LIC_INTENSIVE: LevelRow = { amount: 4550000, max_installments: 8 };
const MASTER_INTENSIVE: LevelRow = { amount: 5550000, max_installments: 8 };
const CLASSIC_L3: LevelRow = { amount: 2550000, max_installments: null };
const GLOBAL_REG = 300000;
const DEFAULT_PLAN = 10;

// GO #1 — Licence intensive : 4 550 000 / 300 000 / max 8.
test("1. Licence intensive : scolarité 4 550 000, inscription 300 000, plan plafonné à 8", () => {
  const b = resolveLevelBilling({
    levelRow: LIC_INTENSIVE,
    classTuition: null,
    classRegistration: null,
    globalRegistration: GLOBAL_REG,
    defaultPlanMonths: DEFAULT_PLAN,
  });
  assert.equal(b.tuitionDue, 4550000);
  assert.equal(b.registrationFee, 300000);
  assert.equal(b.planMonths, 8);
  assert.equal(b.isLevelGoverned, true);
});

// GO #2 — Master intensive : 5 550 000 / 300 000 / max 8.
test("2. Master intensif : scolarité 5 550 000, inscription 300 000, plan plafonné à 8", () => {
  const b = resolveLevelBilling({
    levelRow: MASTER_INTENSIVE,
    classTuition: null,
    classRegistration: null,
    globalRegistration: GLOBAL_REG,
    defaultPlanMonths: DEFAULT_PLAN,
  });
  assert.equal(b.tuitionDue, 5550000);
  assert.equal(b.registrationFee, 300000);
  assert.equal(b.planMonths, 8);
});

// GO #4 — Une classe avec un AUTRE montant ne change pas le tarif d'un intensif.
test("4. classe à montant différent → ignorée pour un niveau intensif", () => {
  const b = resolveLevelBilling({
    levelRow: LIC_INTENSIVE,
    classTuition: 9999999, // classe « piégée »
    classRegistration: 777777,
    globalRegistration: GLOBAL_REG,
    defaultPlanMonths: DEFAULT_PLAN,
  });
  assert.equal(b.tuitionDue, 4550000); // tuition_levels prime
  assert.equal(b.registrationFee, 300000); // inscription = défaut Pro, pas la classe
  assert.equal(b.planMonths, 8);
});

// GO #6 — Niveau classique : comportement historique inchangé.
test("6a. classique : la classe prime sur le niveau (scolarité + inscription)", () => {
  const b = resolveLevelBilling({
    levelRow: CLASSIC_L3,
    classTuition: 2500000, // classe L3 réelle (≠ tuition_levels 2 550 000)
    classRegistration: 300000,
    globalRegistration: GLOBAL_REG,
    defaultPlanMonths: DEFAULT_PLAN,
  });
  assert.equal(b.tuitionDue, 2500000); // la classe prime (inchangé)
  assert.equal(b.registrationFee, 300000);
  assert.equal(b.planMonths, 10); // pas de plafond
  assert.equal(b.isLevelGoverned, false);
});

test("6b. classique sans montant de classe → repli tuition_levels ; inscription globale", () => {
  const b = resolveLevelBilling({
    levelRow: CLASSIC_L3,
    classTuition: null,
    classRegistration: null,
    globalRegistration: GLOBAL_REG,
    defaultPlanMonths: DEFAULT_PLAN,
  });
  assert.equal(b.tuitionDue, 2550000); // repli niveau
  assert.equal(b.registrationFee, 300000);
  assert.equal(b.planMonths, 10);
});

// Plafond d'échéances appliqué au choix du candidat (pack).
test("7. capPlanMonths : plafonne le choix au plafond du niveau", () => {
  assert.equal(capPlanMonths(10, 8), 8); // échelonné 10 → ramené à 8
  assert.equal(capPlanMonths(6, 8), 6); // sous le plafond → inchangé
  assert.equal(capPlanMonths(10, null), 10); // niveau classique → aucun plafond
  assert.equal(capPlanMonths(1, 8), 1); // comptant inchangé
});
