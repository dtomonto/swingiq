#!/usr/bin/env node
/**
 * scan-features.mjs — detect features and refresh the Feature Registry.
 *
 * This is the push-time engine behind "make sure new tutorials/how-tos/videos
 * are generated as features ship". It builds the Feature Registry snapshot
 * (apps/web/src/data/feature-registry.json) the app reads, from two grounded
 * signals — no LLM, no network:
 *
 *   1. STRUCTURE pass — walks apps/web/src/app for real routes + API endpoints
 *      and apps/web/src/components|lib for capabilities.
 *   2. CHANGE pass — reads recent git commits for what was added/changed/removed,
 *      attaching commit provenance and honoring an opt-in `Feature:` trailer.
 *
 * Opt-in commit trailers (single line, git-trailer style), all optional:
 *   Feature:           <name>                 declare a feature explicitly
 *   Feature-Category:  new-feature | enhancement | admin-capability | ...
 *   Feature-Audience:  new-user, admin, ...   (comma-separated)
 *   Feature-Routes:    /x, /y                  (comma-separated)
 *   Feature-Owner:     <name>
 *   Feature-Status:    active | beta | deprecated | removed
 *
 * Idempotent: features are keyed by a stable id; re-running preserves each
 * feature's createdAt + education coverage and only refreshes what changed.
 *
 * NOTE: classification mirrors lib/feature-education/detection.ts. Keep the
 * two in sync (this script can't import the TS module).
 *
 * Usage: node scripts/scan-features.mjs [--quiet] [--limit N] [--print] [--no-write]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT, 'apps/web/src');
const SNAPSHOT_FILE = path.join(ROOT, 'apps/web/src/data/feature-registry.json');

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const PRINT = args.includes('--print');
const NO_WRITE = args.includes('--no-write');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : 60;
})();

const log = (...a) => { if (!QUIET) console.log(...a); };
const warn = (...a) => console.warn(...a);

// ── shared helpers (mirror types.ts / detection.ts) ──────────────────────────

function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[/\\]+/g, '-').replace(/[^\w\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60).replace(/^-|-$/g, '');
}
function humanize(s) {
  return s.replace(/[-_/]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bApi\b/g, 'API').replace(/\bSeo\b/g, 'SEO').replace(/\bAi\b/g, 'AI').trim();
}
function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
const uniq = (a) => [...new Set(a)];

const APP_PREFIX = 'apps/web/src/';
const IGNORE = [
  /(^|\/)node_modules\//, /(^|\/)__tests__\//, /\.test\.[tj]sx?$/, /\.spec\.[tj]sx?$/,
  /\.d\.ts$/, /(^|\/)\.git\//, /(^|\/)\.claude\//, /(^|\/)docs\//, /(^|\/)scripts\//,
  /\.(md|mdx|css|scss|svg|png|jpe?g|gif|webp|ico|lock|yml|yaml|toml)$/,
  /(^|\/)(package\.json|package-lock\.json|tsconfig.*\.json|next\.config\.[mc]?js|postcss\.config\.[mc]?js|tailwind\.config\.[mc]?js|jest\.config\.[mc]?js|eslint\.config\.[mc]?js)$/,
  /(^|\/)data\/(auto-updates|auto-dev-updates|social-pending|feature-registry)\.json$/,
];
const norm = (p) => p.replace(/\\/g, '/').trim();
const ignored = (p) => IGNORE.some((re) => re.test(p));

function routeFromAppPath(p) {
  const m = norm(p).match(new RegExp(`${APP_PREFIX}app/(.+?)/(page|layout|template)\\.[tj]sx$`));
  if (!m) return undefined;
  let route = m[1].split('/').filter((s) => !/^\(.*\)$/.test(s))
    .map((s) => s.replace(/^\[(\.\.\.)?(.+?)\]$/, ':$2')).join('/');
  route = '/' + route;
  return route === '/' ? '/' : route.replace(/\/$/, '');
}
function apiFromPath(p) {
  const m = norm(p).match(new RegExp(`${APP_PREFIX}app/api/(.+?)/route\\.[tj]s$`));
  if (!m) return undefined;
  const seg = m[1].split('/').map((s) => s.replace(/^\[(\.\.\.)?(.+?)\]$/, ':$2')).join('/');
  return `/api/${seg}`;
}
function categoryHints(p) {
  p = norm(p).toLowerCase();
  if (/(billing|pricing|monetiz|checkout|subscription|\bads?\b|affiliate)/.test(p)) return 'monetization';
  if (/(auth|login|signup|session|account|middleware)/.test(p)) return 'account-auth';
  if (/(security|privacy|constant-time|rate-limit|rbac|consent|gdpr)/.test(p)) return 'security-privacy';
  if (/(analytics|metrics|reporting|insights|dashboard)/.test(p)) return 'analytics-reporting';
  if (/(support|feedback|help|troubleshoot)/.test(p)) return 'support-troubleshooting';
  if (/(setting|config|preferences)/.test(p)) return 'user-setting';
  if (/(flag|feature-flag)/.test(p)) return 'analytics-reporting';
  return undefined;
}

function classifyPath(p) {
  p = norm(p);
  if (ignored(p) || !p.startsWith(APP_PREFIX)) {
    if (/\.sql$/.test(p)) {
      return { key: 'data-model', category: 'backend-api', audiences: ['developer', 'admin'],
        dbTable: p.split('/').pop().replace(/\.sql$/, ''), isPublic: false, evidenceKind: 'db', baseConfidence: 50 };
    }
    return null;
  }
  const api = apiFromPath(p);
  if (api) {
    const seg = api.replace(/^\/api\//, '').split('/')[0];
    return { key: `api/${seg}`, category: categoryHints(p) ?? 'backend-api', audiences: ['developer', 'admin'],
      apiEndpoint: api, isPublic: false, evidenceKind: 'api', baseConfidence: 70 };
  }
  const route = routeFromAppPath(p);
  if (route) {
    const isAdmin = route.startsWith('/admin');
    const isMarketing = /\/app\/\(marketing\)\//.test(p) || ['/', '/pricing', '/how-it-works'].includes(route);
    const segs = route.split('/').filter(Boolean);
    const key = isAdmin ? `admin/${segs[1] ?? 'home'}` : (segs[0] ?? 'home');
    return { key, category: categoryHints(p) ?? (isAdmin ? 'admin-capability' : isMarketing ? 'ui-change' : 'new-feature'),
      audiences: isAdmin ? ['admin'] : isMarketing ? ['all'] : ['new-user', 'returning-user'],
      route, isPublic: !isAdmin, adminControl: isAdmin ? route : undefined, evidenceKind: 'route', baseConfidence: isAdmin ? 70 : 75 };
  }
  const comp = p.match(new RegExp(`${APP_PREFIX}components/([^/]+)/`));
  if (comp) {
    return { key: `ui/${comp[1]}`, category: categoryHints(p) ?? 'ui-change', audiences: ['new-user', 'returning-user'],
      component: p.replace(APP_PREFIX, ''), isPublic: false, evidenceKind: 'component', baseConfidence: 45 };
  }
  const lib = p.match(new RegExp(`${APP_PREFIX}lib/([^/]+)/`));
  if (lib) {
    return { key: `lib/${lib[1]}`, category: categoryHints(p) ?? 'enhancement', audiences: ['developer'],
      component: p.replace(APP_PREFIX, ''), isPublic: false, evidenceKind: 'component', baseConfidence: 55 };
  }
  return null;
}

function categoryRank(c) {
  if (c === 'removed' || c === 'deprecated') return 5;
  return ['ui-change', 'enhancement'].includes(c) ? 1 : 3;
}
function dominantCategory(classes) {
  return classes.map((c) => c.category).sort((a, b) => categoryRank(b) - categoryRank(a))[0] ?? 'enhancement';
}

function buildFeature(key, changes, classes, opts = {}) {
  const now = opts.now ?? new Date();
  const iso = now.toISOString();
  const routes = uniq(classes.map((c) => c.route).filter(Boolean));
  const components = uniq(classes.map((c) => c.component).filter(Boolean));
  const apiEndpoints = uniq(classes.map((c) => c.apiEndpoint).filter(Boolean));
  const dbTables = uniq(classes.map((c) => c.dbTable).filter(Boolean));
  const featureFlags = uniq(classes.map((c) => c.flag).filter(Boolean));
  const permissions = uniq(classes.map((c) => c.permission).filter(Boolean));
  const adminControls = uniq(classes.map((c) => c.adminControl).filter(Boolean));
  const audiences = uniq(classes.flatMap((c) => c.audiences));
  const shas = uniq(changes.map((c) => c.sha).filter(Boolean));
  const evidence = [
    ...classes.map((c) => ({ kind: c.evidenceKind, ref: c.route ?? c.apiEndpoint ?? c.component ?? c.dbTable ?? key })),
    ...shas.map((s) => ({ kind: 'commit', ref: s })),
  ];
  const base = Math.max(...classes.map((c) => c.baseConfidence), 30);
  const corroboration = Math.min(20, (uniq(classes.map((c) => c.evidenceKind)).length - 1) * 8);
  const confidence = opts.name ? Math.max(85, base) : Math.min(95, base + corroboration);
  const allDeleted = changes.length > 0 && changes.every((c) => c.status === 'D');
  const status = opts.status ?? (allDeleted ? 'removed' : 'active');
  const name = opts.name ?? humanize(key.replace(/^(admin|api|ui|lib)\//, ''));
  const messages = uniq(changes.map((c) => c.message).filter(Boolean));
  const description = opts.description ?? (messages[0]
    ? messages[0].replace(/^[a-z]+(\([^)]*\))?:\s*/i, '')
    : `${name} — detected from ${routes[0] ?? apiEndpoints[0] ?? components[0] ?? key}.`);
  const fpParts = [...routes, ...components, ...apiEndpoints, ...featureFlags].sort();
  return {
    id: `feat_${slugify(key) || hashString(key)}`,
    slug: slugify(key) || hashString(key),
    name, description,
    category: status === 'removed' ? 'removed' : dominantCategory(classes),
    audiences: audiences.length ? audiences : ['all'],
    status, routes, components, apiEndpoints, dbTables, permissions, adminControls, featureFlags,
    owner: opts.owner ?? 'unassigned',
    detectedFrom: shas.length ? shas : [opts.source ?? 'route-scan'],
    evidence, confidence, needsHumanReview: confidence < 60, coverage: {},
    fingerprint: hashString(fpParts.join('|')),
    createdAt: iso, updatedAt: iso,
  };
}

function detectFromChanges(changes, opts = {}) {
  const groups = new Map();
  for (const ch of changes) {
    const cls = classifyPath(ch.path);
    if (!cls) continue;
    const g = groups.get(cls.key) ?? { changes: [], classes: [] };
    g.changes.push(ch); g.classes.push(cls); groups.set(cls.key, g);
  }
  return [...groups.entries()].map(([key, g]) => buildFeature(key, g.changes, g.classes, opts));
}

// ── git + fs passes ──────────────────────────────────────────────────────────

function walk(dir, acc = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const name of entries) {
    const full = path.join(dir, name);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '__tests__') continue;
      walk(full, acc);
    } else {
      acc.push(path.relative(ROOT, full));
    }
  }
  return acc;
}

function structurePass(now) {
  // Baseline registry = real product SURFACES (routes + API endpoints) only.
  // Components and lib modules are implementation detail: they register via the
  // change pass when actually touched, and are watched for drift — but they
  // don't each become a first-class "feature" in the baseline (avoids noise).
  const files = walk(path.join(APP_DIR, 'app')).map((p) => ({ path: p }));
  return detectFromChanges(files, { now, source: 'route-scan' });
}

const US = '\x1f', RS = '\x1e';

function readCommits() {
  let raw;
  try {
    raw = execSync(`git log -n ${LIMIT} --no-merges --pretty=format:%H${US}%h${US}%cI${US}%B${RS}`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { warn(`scan-features: could not read git history: ${e.message}`); return []; }
  return raw.split(RS).map((r) => r.replace(/^\n/, '')).filter(Boolean).map((rec) => {
    const [full, short, date, ...rest] = rec.split(US);
    return { full, short, date, body: rest.join(US) ?? '' };
  });
}

function changedFiles(sha) {
  try {
    const out = execSync(`git show --no-renames --name-status --pretty=format: ${sha}`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return out.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
      const [status, ...rest] = l.split(/\s+/);
      return { status: status[0], path: rest.join(' ') };
    });
  } catch { return []; }
}

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
const splitList = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

function changePass(now) {
  const commits = readCommits();
  const features = [];
  // Walk oldest → newest so the freshest commit wins on merge.
  for (const c of [...commits].reverse()) {
    const subject = c.body.split('\n')[0] ?? '';
    const files = changedFiles(c.full).map((f) => ({ ...f, sha: c.short, message: subject }));
    for (const f of detectFromChanges(files, { now })) features.push(f);

    // Explicit Feature: trailer → high-confidence declared feature.
    const t = parseTrailers(c.body);
    if (t['feature']) {
      const name = t['feature'];
      const routes = splitList(t['feature-routes']);
      const classes = routes.length
        ? routes.map((r) => ({ key: name, category: t['feature-category'] || 'new-feature',
            audiences: splitList(t['feature-audience']).length ? splitList(t['feature-audience']) : ['all'],
            route: r, isPublic: !r.startsWith('/admin'), evidenceKind: 'route', baseConfidence: 90 }))
        : [{ key: name, category: t['feature-category'] || 'new-feature',
            audiences: splitList(t['feature-audience']).length ? splitList(t['feature-audience']) : ['all'],
            isPublic: true, evidenceKind: 'trailer', baseConfidence: 90 }];
      const rec = buildFeature(slugify(name), [{ sha: c.short, message: subject, path: 'trailer' }], classes, {
        now, name, description: t['feature-summary'] || subject,
        owner: t['feature-owner'], status: t['feature-status'],
      });
      rec.evidence.push({ kind: 'trailer', ref: c.short, detail: `Feature: ${name}` });
      features.push(rec);
    }
  }
  return features;
}

// ── merge + write ────────────────────────────────────────────────────────────

function readSnapshot() {
  try {
    const parsed = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'));
    if (parsed && Array.isArray(parsed.features)) return parsed;
  } catch { /* fall through */ }
  return { generatedAt: '', commitRange: '', features: [] };
}

function mergeById(base, incoming) {
  const byId = new Map(base.map((f) => [f.id, f]));
  for (const d of incoming) {
    const prev = byId.get(d.id);
    if (!prev) { byId.set(d.id, d); continue; }
    byId.set(d.id, {
      ...d,
      createdAt: prev.createdAt || d.createdAt,
      coverage: prev.coverage && Object.keys(prev.coverage).length ? prev.coverage : d.coverage,
      owner: prev.owner && prev.owner !== 'unassigned' ? prev.owner : d.owner,
      status: prev.status === 'deprecated' ? 'deprecated' : d.status,
      detectedFrom: uniq([...(prev.detectedFrom || []), ...d.detectedFrom]).slice(-12),
    });
  }
  return [...byId.values()];
}

function main() {
  const now = new Date();
  const existing = readSnapshot();

  // structure first (broad, current), then change pass (provenance + trailers),
  // then preserve prior createdAt/coverage/owner.
  let features = mergeById([], structurePass(now));
  features = mergeById(features, changePass(now));
  features = mergeById(existing.features, features);
  features.sort((a, b) => a.id.localeCompare(b.id));

  let range = 'unknown';
  try {
    range = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch { /* ignore */ }

  const snapshot = { generatedAt: now.toISOString(), commitRange: range, features };

  if (PRINT) console.log(JSON.stringify(snapshot, null, 2));
  if (!NO_WRITE) writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2) + '\n');

  const newCount = features.length - existing.features.length;
  const review = features.filter((f) => f.needsHumanReview).length;
  log('');
  log(`✓ Feature Registry: ${features.length} features (${newCount >= 0 ? '+' : ''}${newCount} vs last run) → ${path.relative(ROOT, SNAPSHOT_FILE)}`);
  if (review) log(`  ${review} flagged "needs human review" (low-confidence detection).`);
  const removed = features.filter((f) => f.status === 'removed').length;
  if (removed) log(`  ${removed} marked removed (deletions detected).`);
  log('  Review coverage & generate learning assets in /admin/feature-education.');
  log('');
}

export { slugify, humanize, classifyPath, buildFeature, detectFromChanges, parseTrailers };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try { main(); } catch (e) { warn(`scan-features: ${e.message}`); process.exitCode = 1; }
}
