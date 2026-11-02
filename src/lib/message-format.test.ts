import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMessageHtml, escapeMessageHtml } from "./message-format.ts";

test("1. échappe le HTML (anti-injection)", () => {
  assert.equal(
    escapeMessageHtml('<script>alert(1)</script>'),
    "&lt;script&gt;alert(1)&lt;/script&gt;"
  );
});

test("2. **gras** → <strong> (après échappement)", () => {
  assert.equal(renderMessageHtml("merci de joindre **les bulletins**."), "merci de joindre <strong>les bulletins</strong>.");
});

test("3. injection + gras : le HTML reste neutralisé, seul <strong> est ajouté", () => {
  const out = renderMessageHtml('**gras** <b>x</b>');
  assert.equal(out, "<strong>gras</strong> &lt;b&gt;x&lt;/b&gt;");
});

test("4. retours à la ligne / listes préservés tels quels (rendus par white-space: pre-line)", () => {
  const out = renderMessageHtml("1. un\n2. deux");
  assert.equal(out, "1. un\n2. deux");
});

test("5. ** non fermé → laissé tel quel", () => {
  assert.equal(renderMessageHtml("texte ** incomplet"), "texte ** incomplet");
});

test("6. *italique* → <em>", () => {
  assert.equal(renderMessageHtml("un mot *important* ici"), "un mot <em>important</em> ici");
});

test("7. gras + italique combinés", () => {
  assert.equal(
    renderMessageHtml("**gras** et *italique*"),
    "<strong>gras</strong> et <em>italique</em>"
  );
});
