import { test } from "node:test";
import assert from "node:assert/strict";
import { resolvePaymentPayer, receiptRecipients } from "./payment-payer.ts";

test("Chèque sans payeur → rejet", () => {
  const r = resolvePaymentPayer({ method: "Chèque", cheque_drawer: "X", cheque_bank: "SIB" });
  assert.equal(r.ok, false);
});
test("Chèque sans émetteur → rejet", () => {
  const r = resolvePaymentPayer({ method: "Chèque", payer_name: "P", payer_relationship: "pere", cheque_bank: "SIB" });
  assert.equal(r.ok, false);
});
test("Chèque sans banque → rejet", () => {
  const r = resolvePaymentPayer({ method: "Chèque", payer_name: "P", payer_relationship: "pere", cheque_drawer: "X" });
  assert.equal(r.ok, false);
});
test("Chèque complet → accepté, wave_* nuls", () => {
  const r = resolvePaymentPayer({
    method: "Chèque", payer_name: "HOIMIAN Agénor Jean Claude", payer_relationship: "pere",
    payer_email: "pere@mail.com", cheque_drawer: "HOIMIAN Agénor Jean Claude", cheque_bank: "SIB", cheque_number: "1000342",
    wave_transaction_id: "ignore",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.values.cheque_bank, "SIB");
    assert.equal(r.values.cheque_number, "1000342");
    assert.equal(r.values.payer_relationship, "pere");
    assert.equal(r.values.wave_transaction_id, null); // pas de fuite
  }
});
test("Wave sans transaction id → rejet", () => {
  const r = resolvePaymentPayer({ method: "Wave", payer_name: "P", payer_relationship: "mere", wave_payer_number: "0700000000" });
  assert.equal(r.ok, false);
});
test("Wave complet → accepté, cheque_* nuls", () => {
  const r = resolvePaymentPayer({
    method: "Wave", payer_name: "Maman", payer_relationship: "mere",
    wave_payer_number: "+2250700000000", wave_transaction_id: "TXWAVE123", wave_merchant: "IPMD-01",
    cheque_bank: "ignore",
  });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.values.wave_transaction_id, "TXWAVE123");
    assert.equal(r.values.wave_merchant, "IPMD-01");
    assert.equal(r.values.cheque_bank, null);
  }
});
test("Qualité invalide → rejet", () => {
  const r = resolvePaymentPayer({ method: "Espèces", payer_relationship: "cousin" });
  assert.equal(r.ok, false);
});
test("Espèces sans payeur → accepté (bloc payeur optionnel)", () => {
  const r = resolvePaymentPayer({ method: "Espèces" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.values.payer_name, null);
    assert.equal(r.values.cheque_bank, null);
    assert.equal(r.values.wave_payer_number, null);
  }
});
test("Espèces avec père + email → accepté (payeur tiers possible tous moyens)", () => {
  const r = resolvePaymentPayer({ method: "Espèces", payer_name: "Papa", payer_relationship: "pere", payer_email: "p@mail.com" });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.values.payer_email, "p@mail.com");
});

// receiptRecipients
test("copie payeur si tiers + email différent", () => {
  const r = receiptRecipients({ studentEmail: "etu@mail.com", payerEmail: "pere@mail.com", payerRelationship: "pere" });
  assert.equal(r.student, "etu@mail.com");
  assert.equal(r.payer, "pere@mail.com");
});
test("pas de copie si payeur = étudiant lui-même", () => {
  const r = receiptRecipients({ studentEmail: "etu@mail.com", payerEmail: "etu@mail.com", payerRelationship: "etudiant" });
  assert.equal(r.payer, null);
});
test("pas de double envoi si email payeur = email étudiant", () => {
  const r = receiptRecipients({ studentEmail: "etu@mail.com", payerEmail: "ETU@mail.com", payerRelationship: "pere" });
  assert.equal(r.payer, null);
});
test("pas de copie si email payeur absent", () => {
  const r = receiptRecipients({ studentEmail: "etu@mail.com", payerEmail: null, payerRelationship: "pere" });
  assert.equal(r.payer, null);
});
