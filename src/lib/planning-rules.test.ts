import { test } from "node:test";
import assert from "node:assert/strict";
import { blockReasonFor, resolveScheduling, type CalendarPeriod } from "./planning-rules.ts";

const EXAMENS: CalendarPeriod = {
  start_date: "2027-02-08", end_date: "2027-02-19", blocks_all: false, blocks_regular: true,
};
const VACANCES: CalendarPeriod = {
  start_date: "2027-08-01", end_date: "2027-09-30", blocks_all: true, blocks_regular: true,
};
const periods = [EXAMENS, VACANCES];
const feries = new Set(["2026-11-03"]);

// 1. Cours pendant examens → bloqué puis rejeté (sans motif).
test("1. cours pendant examens → rejet", () => {
  const br = blockReasonFor("2027-02-10", "cours", feries, periods);
  assert.equal(br, "Examens : cours réguliers suspendus");
  const d = resolveScheduling({ blockReason: br, actorRole: "super_admin" });
  assert.equal(d.allowed, false);
});

// 2. Examen pendant examens → autorisé.
test("2. examen pendant examens → autorisé", () => {
  const br = blockReasonFor("2027-02-10", "examen", feries, periods);
  assert.equal(br, null);
  assert.deepEqual(resolveScheduling({ blockReason: br, actorRole: "super_admin" }), {
    allowed: true, withException: false,
  });
});

// 3. Activité (hackathon) pendant vacances → rejet.
test("3. activité pendant vacances → rejet", () => {
  const br = blockReasonFor("2027-08-15", "hackathon", feries, periods);
  assert.equal(br, "Vacances / fermeture");
  assert.equal(resolveScheduling({ blockReason: br, actorRole: "super_admin" }).allowed, false);
});

// 4. Activité (examen) un jour férié → rejet (blocage total).
test("4. activité un jour férié → rejet", () => {
  const br = blockReasonFor("2026-11-03", "examen", feries, periods);
  assert.equal(br, "Jour férié");
  assert.equal(resolveScheduling({ blockReason: br, actorRole: "super_admin" }).allowed, false);
});

// 5. Exception administrative motivée → autorisée + à tracer.
test("5. exception motivée par rôle autorisé → autorisée avec exception", () => {
  const br = blockReasonFor("2027-08-15", "examen", feries, periods);
  const d = resolveScheduling({ blockReason: br, exceptionReason: "Concours institutionnel", actorRole: "super_admin" });
  assert.deepEqual(d, { allowed: true, withException: true });
});
test("5b. exception sans motif → refus", () => {
  const br = blockReasonFor("2027-08-15", "examen", feries, periods);
  assert.equal(resolveScheduling({ blockReason: br, exceptionReason: "   ", actorRole: "super_admin" }).allowed, false);
});
test("5c. exception par rôle NON autorisé → refus", () => {
  const br = blockReasonFor("2027-08-15", "examen", feries, periods);
  assert.equal(resolveScheduling({ blockReason: br, exceptionReason: "x", actorRole: "etudiant" }).allowed, false);
});

// 6. Date libre (hors calendrier) → aucune blocage (l'alerte hebdo est gérée à part, non bloquante).
test("6. date normale hors calendrier → aucun blocage", () => {
  const br = blockReasonFor("2026-11-16", "cours", feries, periods);
  assert.equal(br, null);
  assert.equal(resolveScheduling({ blockReason: br, actorRole: "super_admin" }).allowed, true);
});
