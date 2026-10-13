import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signSecureLink,
  verifySecureLink,
  secureLinkUrl,
} from "./secure-link.ts";

const SID = "11111111-2222-3333-4444-555555555555";

test("roundtrip valide : signe puis verifie", () => {
  const token = signSecureLink(SID, "note");
  const payload = verifySecureLink(token);
  assert.ok(payload);
  assert.equal(payload!.s, SID);
  assert.equal(payload!.k, "note");
  assert.ok(payload!.exp * 1000 > Date.now());
});

test("jeton falsifie -> null", () => {
  const token = signSecureLink(SID, "absence");
  // Altère le dernier caractère de la signature.
  const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
  assert.equal(verifySecureLink(tampered), null);
});

test("charge utile modifiee (autre eleve) -> null", () => {
  const token = signSecureLink(SID, "note");
  const [, sig] = token.split(".");
  const forged =
    Buffer.from(JSON.stringify({ s: "other", k: "note", exp: 9999999999 }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "") +
    "." +
    sig;
  assert.equal(verifySecureLink(forged), null);
});

test("jeton expire -> null", () => {
  const token = signSecureLink(SID, "note", -10); // exp dans le passe
  assert.equal(verifySecureLink(token), null);
});

test("jeton vide / malforme -> null", () => {
  assert.equal(verifySecureLink(""), null);
  assert.equal(verifySecureLink("abc"), null);
});

test("secureLinkUrl pointe vers /espace/acces avec jeton", () => {
  const url = secureLinkUrl(SID, "finance");
  assert.match(url, /\/espace\/acces\?t=/);
  const token = url.split("t=")[1];
  const payload = verifySecureLink(token);
  assert.equal(payload!.k, "finance");
});
