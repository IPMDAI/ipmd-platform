import { test } from "node:test";
import assert from "node:assert/strict";
import { signDossierToken, verifyDossierToken } from "./dossier-link.ts";

const ID = "11111111-1111-1111-1111-111111111111";

test("1. jeton valide → renvoie id + version + exp", () => {
  const tok = signDossierToken(ID, 1, 30);
  const p = verifyDossierToken(tok);
  assert.ok(p);
  assert.equal(p.candidatureId, ID);
  assert.equal(p.version, 1);
  assert.ok(p.exp > Date.now());
});

test("2. jeton expiré (TTL négatif) → null", () => {
  const tok = signDossierToken(ID, 1, -1); // déjà expiré
  assert.equal(verifyDossierToken(tok), null);
});

test("3. signature falsifiée → null", () => {
  const tok = signDossierToken(ID, 1, 30);
  const [data] = tok.split(".");
  const forged = `${data}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
  assert.equal(verifyDossierToken(forged), null);
});

test("4. payload modifié (autre id) sans re-signer → null", () => {
  const tok = signDossierToken(ID, 1, 30);
  const sig = tok.split(".")[1];
  const otherData = Buffer.from("22222222-2222-2222-2222-222222222222|1|" + (Date.now() + 1e9))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  assert.equal(verifyDossierToken(`${otherData}.${sig}`), null);
});

test("5. version encodée = version demandée (révocation = comparaison côté serveur)", () => {
  const p1 = verifyDossierToken(signDossierToken(ID, 1, 30));
  const p2 = verifyDossierToken(signDossierToken(ID, 2, 30));
  assert.equal(p1?.version, 1);
  assert.equal(p2?.version, 2); // l'appelant compare à dossier_token_version pour révoquer
});

test("6. ancien format (id seul) → refusé (exp/révoc exigées)", () => {
  // Un jeton legacy « data.sig » sans version|exp doit être rejeté.
  const legacyData = Buffer.from(ID).toString("base64").replace(/=+$/, "");
  assert.equal(verifyDossierToken(`${legacyData}.whatever`), null);
});
