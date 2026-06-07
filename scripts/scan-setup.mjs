#!/usr/bin/env node
/**
 * scan-setup.mjs — keep the "Setup & Next Steps" hub current automatically.
 *
 * IN PLAIN ENGLISH: this refreshes the list of manual setup tasks the owner
 * sees at /admin/setup, so FUTURE items show up on their own. It writes
 * apps/web/src/data/setup-registry.json from two grounded signals — no LLM,
 * no network:
 *
 *   1. DATABASE SCHEMAS — every supabase-*.sql / supabase_*.sql file in the
 *      repo becomes an "apply this in Supabase" task (title pulled from the
 *      file's own header comment). Ship a new schema → it appears here.
 *
 *   2. `Setup:` COMMIT TRAILERS — a commit can declare a manual step it
 *      introduced, mirroring the existing Feature:/Update: trailers:
 *
 *        Setup:           <title>                  (required to emit a task)
 *        Setup-Why:       <plain-English reason>
 *        Setup-Category:  go-live|data|ai|email|growth|reliability|local-setup|deploy
 *        Setup-Priority:  required|recommended|optional
 *        Setup-Steps:     step one ;; step two ;; step three   (";;"-separated)
 *        Setup-Env:       VAR_ONE, VAR_TWO          (env vars to add; also used
 *                                                    to auto-detect "done")
 *        Setup-Command:   npm run something
 *        Setup-File:      apps/web/path/to/file
 *        Setup-Doc:       /admin/... or https://...
 *
 * The catalog (lib/admin/setup/catalog.ts) holds the hand-written essentials;
 * this file only adds the auto-discoverable extras. The hub merges both and
 * de-dupes by id (catalog wins).
 *
 * Idempotent and safe: pure write of one JSON file. Never pushes.
 *
 * Usage: node scripts/scan-setup.mjs [--quiet] [--print] [--no-write] [--limit N]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'apps/web/src/data/setup-registry.json');

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const PRINT = args.includes('--print');
const NO_WRITE = args.includes('--no-write');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : 80;
})();

const log = (...a) => { if (!QUIET) console.log(...a); };
const warn = (...a) => console.warn(...a);

const VALID_CATEGORIES = new Set([
  'go-live', 'data', 'ai', 'email', 'growth', 'reliability', 'local-setup', 'deploy',
]);
const VALID_PRIORITIES = new Set(['required', 'recommended', 'optional']);

function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[/\\]+/g, '-')
    .replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 60).replace(/^-|-$/g, '');
}
function humanize(s) {
  return s.replace(/[-_/]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

// ── 1. Database schema files → "apply in Supabase" tasks ─────────────────────

// Where schema files live (only the real repo, never worktree copies).
const SCHEMA_DIRS = [
  { dir: 'apps/web', match: /^supabase[-_].+\.sql$/i },
  { dir: 'server', match: /^supabase[-_].+\.sql$/i },
];

// A few schemas are broadly useful → nudge their priority up. Everything else
// defaults to optional (most are feature-specific and the app works without
// them, syncing via the document mirror until applied).
const SCHEMA_PRIORITY = {
  'supabase-relational-schema.sql': 'recommended',
  'supabase-rls.sql': 'recommended',
  'supabase-user-documents.sql': 'recommended',
  'supabase_setup_all_in_one.sql': 'recommended',
};

/** Pull a human title from a .sql file's header comment. */
function titleFromSql(fullPath, fallback) {
  try {
    const text = readFileSync(fullPath, 'utf8');
    for (const raw of text.split('\n').slice(0, 12)) {
      const line = raw.trim();
      if (!line.startsWith('--')) continue;
      const body = line.replace(/^--+/, '').trim();
      if (!body || /^[=\-\s]+$/.test(body)) continue; // skip rule lines
      // Drop a leading "SwingVantage — " / "SwingIQ — " brand prefix.
      const cleaned = body.replace(/^Swing(Vantage|IQ)\s*[—–-]\s*/i, '');
      return cleaned.slice(0, 90);
    }
  } catch { /* fall through */ }
  return fallback;
}

function discoverSchemas() {
  const tasks = [];
  for (const { dir, match } of SCHEMA_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!existsSync(abs)) continue;
    let names;
    try { names = readdirSync(abs); } catch { continue; }
    for (const name of names.sort()) {
      if (!match.test(name)) continue;
      const rel = `${dir}/${name}`;
      const title = titleFromSql(path.join(abs, name), humanize(name.replace(/\.sql$/i, '')));
      const priority = SCHEMA_PRIORITY[name] ?? 'optional';
      tasks.push({
        id: `schema-${slugify(name.replace(/\.sql$/i, ''))}`,
        title: `Apply database file: ${title}`,
        plainEnglish:
          `A one-time database setup file. Paste its contents into the Supabase SQL editor and run it so the matching feature has its tables. It is safe to run again — these files are written to be additive. (File: ${rel})`,
        category: 'data',
        priority,
        detect: { kind: 'manual' },
        steps: [
          'Open your Supabase project → SQL Editor → New query.',
          `Open the file ${rel} in your code editor and copy everything.`,
          'Paste it into the Supabase SQL editor and click Run.',
          'When it finishes without errors, mark this task done below.',
        ],
        inputs: [
          { kind: 'file', value: rel, label: 'Database file to copy' },
          { kind: 'url', value: 'https://supabase.com/dashboard', label: 'Open Supabase SQL editor' },
        ],
        source: rel,
      });
    }
  }
  return tasks;
}

// ── 2. `Setup:` commit trailers → tasks ──────────────────────────────────────

const US = '\x1f', RS = '\x1e';

function readCommits() {
  let raw;
  try {
    raw = execSync(`git log -n ${LIMIT} --no-merges --pretty=format:%h${US}%B${RS}`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (e) { warn(`scan-setup: could not read git history: ${e.message}`); return []; }
  return raw.split(RS).map((r) => r.replace(/^\n/, '')).filter(Boolean).map((rec) => {
    const [short, ...rest] = rec.split(US);
    return { short, body: rest.join(US) ?? '' };
  });
}

/** Parse git-trailer-style "Key: value" lines (first occurrence wins). */
function parseTrailers(body) {
  const out = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^([A-Za-z][A-Za-z-]*):\s?(.*)$/);
    if (!m) continue;
    const k = m[1].toLowerCase();
    if (out[k] === undefined) out[k] = m[2].trim();
  }
  return out;
}
const splitSteps = (v) => (v ? v.split(';;').map((s) => s.trim()).filter(Boolean) : []);
const splitList = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

function discoverTrailers() {
  const tasks = [];
  for (const c of readCommits()) {
    const t = parseTrailers(c.body);
    if (!t['setup']) continue;
    const title = t['setup'];
    const category = VALID_CATEGORIES.has(t['setup-category']) ? t['setup-category'] : 'go-live';
    const priority = VALID_PRIORITIES.has(t['setup-priority']) ? t['setup-priority'] : 'recommended';
    const envVars = splitList(t['setup-env']);
    const inputs = [];
    for (const v of envVars) inputs.push({ kind: 'env', value: v });
    if (t['setup-command']) inputs.push({ kind: 'command', value: t['setup-command'] });
    if (t['setup-file']) inputs.push({ kind: 'file', value: t['setup-file'] });

    const subject = c.body.split('\n')[0] ?? '';
    tasks.push({
      id: `trailer-${slugify(title)}`,
      title,
      plainEnglish: t['setup-why'] || subject || `${title} — declared by commit ${c.short}.`,
      category,
      priority,
      // If env vars were declared, we can auto-detect completion; else manual.
      detect: envVars.length ? { kind: 'env', anyOf: envVars } : { kind: 'manual' },
      steps: splitSteps(t['setup-steps']).length
        ? splitSteps(t['setup-steps'])
        : ['Follow the instructions in the linked doc or the commit that introduced this.'],
      inputs: inputs.length ? inputs : undefined,
      learnMoreHref: t['setup-doc'] || undefined,
      learnMoreLabel: t['setup-doc'] ? 'Learn more' : undefined,
      source: `commit ${c.short}`,
    });
  }
  return tasks;
}

// ── merge + write ────────────────────────────────────────────────────────────

function main() {
  const schemas = discoverSchemas();
  const trailers = discoverTrailers();

  // De-dupe by id (newest trailer wins among trailers; schemas are unique).
  const byId = new Map();
  for (const t of [...schemas, ...trailers]) byId.set(t.id, t);
  const tasks = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  const snapshot = {
    generatedAt: new Date().toISOString(),
    note:
      'AUTO-GENERATED by scripts/scan-setup.mjs — do not edit by hand. Hand-written ' +
      'tasks live in apps/web/src/lib/admin/setup/catalog.ts. Add future auto items ' +
      'via a supabase-*.sql file or a `Setup:` commit trailer.',
    tasks,
  };

  if (PRINT) console.log(JSON.stringify(snapshot, null, 2));
  if (!NO_WRITE) writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n');

  log('');
  log(`✓ Setup Registry: ${tasks.length} auto tasks ` +
      `(${schemas.length} database file${schemas.length === 1 ? '' : 's'}, ` +
      `${trailers.length} from commit trailers) → ${path.relative(ROOT, OUT_FILE)}`);
  log('  Hand-written essentials live in lib/admin/setup/catalog.ts.');
  log('  Review everything at /admin/setup.');
  log('');
}

export { slugify, titleFromSql, parseTrailers, discoverSchemas, discoverTrailers };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try { main(); } catch (e) { warn(`scan-setup: ${e.message}`); process.exitCode = 1; }
}
