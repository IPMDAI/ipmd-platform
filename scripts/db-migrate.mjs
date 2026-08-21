#!/usr/bin/env node
/**
 * Runner de migrations Supabase (sans dashboard, sans clic).
 *
 * Applique un ou plusieurs fichiers .sql sur le projet Supabase distant via la
 * Management API. Le jeton d'accès est lu UNIQUEMENT depuis .env.local
 * (git-ignoré) ou la variable d'env SUPABASE_ACCESS_TOKEN — jamais affiché,
 * jamais commité.
 *
 * Prérequis (une seule fois) :
 *   1. Générer un token : https://supabase.com/dashboard/account/tokens
 *   2. L'ajouter à .env.local :  SUPABASE_ACCESS_TOKEN=sbp_xxx
 *
 * Usage :
 *   node scripts/db-migrate.mjs supabase/mon-fichier.sql [autre.sql ...]
 */
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const p = path.resolve(process.cwd(), ".env.local");
  const out = {};
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = loadEnvLocal();
const token = process.env.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error(
    "❌ SUPABASE_ACCESS_TOKEN introuvable.\n" +
      "   Génère un token sur https://supabase.com/dashboard/account/tokens\n" +
      "   puis ajoute dans .env.local :  SUPABASE_ACCESS_TOKEN=sbp_xxx"
  );
  process.exit(1);
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
const ref =
  (url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/) || [])[1] ||
  "bwgrktasoxhwpjmetuko";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/db-migrate.mjs <fichier.sql> [...]");
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/database/query`;

let failed = 0;
for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`❌ Fichier introuvable : ${f}`);
    failed++;
    continue;
  }
  const sql = fs.readFileSync(f, "utf8");
  process.stdout.write(`▶ ${f}  →  projet ${ref}  ... `);
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    const body = await res.text();
    if (res.ok) {
      console.log("✅ OK");
    } else {
      console.log(`❌ HTTP ${res.status}`);
      console.error("   " + body.slice(0, 1200));
      failed++;
    }
  } catch (e) {
    console.log("❌ réseau");
    console.error("   " + (e?.message ?? e));
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n💥 ${failed} fichier(s) en échec.`);
  process.exit(1);
}
console.log("\n🎉 Migration(s) appliquée(s) avec succès.");
