#!/usr/bin/env node
// ============================================================
// check-rls.mjs — CI gate: every public.<table> has RLS enabled
// ------------------------------------------------------------
// Row-Level Security is the crown jewel of this app's data model (every user
// table is owner-scoped; admin tables are RLS-on / no-policy = service-role
// only). This script fails CI if any `create table public.<x>` ships without a
// matching `enable row level security` somewhere in the SQL — so a new table
// can never silently land without protection.
//
// It aggregates across ALL schema files (so RLS declared in supabase-rls.sql
// covers a table created elsewhere) and understands BOTH ways RLS is enabled:
//   • explicit:  alter table public.x enable row level security;
//   • loop:      foreach t in array array['a','b',…] loop
//                  execute format('alter table public.%1$s enable row level security;', t);
//
// Intentional exceptions go in ALLOWLIST with a reason. No deps; pure Node.
// ============================================================

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SQL_DIRS = ['apps/web', 'server'];

// Tables that intentionally do NOT need RLS (document the reason). Empty today.
const ALLOWLIST = new Map([
  // ['some_table', 'reason it is safe without RLS'],
]);

function sqlFiles() {
  const out = [];
  for (const dir of SQL_DIRS) {
    let entries;
    try { entries = readdirSync(path.join(ROOT, dir)); } catch { continue; }
    for (const f of entries) if (f.endsWith('.sql')) out.push(path.join(dir, f));
  }
  return out.sort();
}

const created = new Map(); // table -> file (first seen)
const rlsCovered = new Set();

for (const rel of sqlFiles()) {
  const sql = readFileSync(path.join(ROOT, rel), 'utf8').toLowerCase();

  // Created tables (public schema, explicit or default).
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?([a-z0-9_]+)["']?/g)) {
    if (!created.has(m[1])) created.set(m[1], rel);
  }

  // Explicit RLS enables.
  for (const m of sql.matchAll(/alter\s+table\s+(?:public\.)?["']?([a-z0-9_]+)["']?\s+enable\s+row\s+level\s+security/g)) {
    rlsCovered.add(m[1]);
  }

  // Loop-based RLS: when a file enables RLS via a format() loop, every quoted
  // identifier inside an array[…] in that file is covered by the loop.
  if (/enable\s+row\s+level\s+security/.test(sql) && /array\s*\[/.test(sql)) {
    for (const arr of sql.matchAll(/array\s*\[([^\]]*)\]/g)) {
      for (const id of arr[1].matchAll(/['"]([a-z0-9_]+)['"]/g)) rlsCovered.add(id[1]);
    }
  }
}

const missing = [...created.keys()]
  .filter((t) => !rlsCovered.has(t) && !ALLOWLIST.has(t))
  .sort();

if (missing.length > 0) {
  console.error(`✗ RLS check FAILED — ${missing.length} public table(s) created without row-level security:`);
  for (const t of missing) console.error(`   • ${t}  (created in ${created.get(t)})`);
  console.error('\nEvery public.<table> must enable RLS — directly, via the RLS loop, or in supabase-rls.sql.');
  console.error('If a table is genuinely safe without RLS, add it to ALLOWLIST in scripts/check-rls.mjs with a reason.');
  process.exit(1);
}

console.log(`✓ RLS check passed — all ${created.size} public table(s) across ${sqlFiles().length} schema file(s) have row-level security enabled.`);
