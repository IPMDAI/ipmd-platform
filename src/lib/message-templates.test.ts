import { test } from "node:test";
import assert from "node:assert/strict";
import { fillTemplate, teamMessageTemplates } from "./message-templates.ts";

test("1. fillTemplate remplace {prenom} et {programme}", () => {
  const out = fillTemplate("Bonjour {prenom}, pour votre candidature {programme}.", {
    firstName: "Marie",
    program: "Marketing digital — L1",
  });
  assert.equal(out, "Bonjour Marie, pour votre candidature Marketing digital — L1.");
});

test("2. prénom vide → « Bonjour »", () => {
  assert.equal(fillTemplate("{prenom}, bonjour", { firstName: "", program: null }), "Bonjour, bonjour");
});

test("3. casse insensible + occurrences multiples", () => {
  assert.equal(fillTemplate("{Prenom} {PRENOM}", { firstName: "A", program: null }), "A A");
});

test("4. modèles intégrés : 5 fournis, prénom inséré", () => {
  const t = teamMessageTemplates({ firstName: "Awa", program: "IA — L3" });
  assert.equal(t.length, 5);
  assert.ok(t[0].text.includes("Awa"));
});
