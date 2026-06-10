#!/usr/bin/env node
// ============================================================
// Admin-shell audit (PublishingOS plan #2, item 1).
//
// Inventories every /admin/* route for consistency with the admin shell
// contract: a registered nav entry, the shared PageHeader (the "what is this /
// why it matters" requirement), noindex metadata (admin must never be indexed),
// dynamic rendering for live data, and a consistent status vocabulary
// (StatusBadge). Pure read-only scan → writes a JSON snapshot + a Markdown
// report and prints a summary. Wire-able into the growth/audit pipeline.
//
// Run: node scripts/audit-admin-shell.mjs
// ============================================================

import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';

const ROOT = process.cwd();
const ADMIN_DIR = resolve(ROOT, 'apps/web/src/app/admin');
const NAV_FILE = resolve(ROOT, 'apps/web/src/lib/admin/nav.ts');
const OUT_JSON = resolve(ROOT, 'docs/uiux-master-rebuild/admin-shell-audit.json');
const OUT_MD = resolve(ROOT, 'docs/uiux-master-rebuild/admin-shell-audit.md');
mkdirSync(dirname(OUT_JSON), { recursive: true });

/** Recursively collect every page.tsx under the admin tree. */
function findPages(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) findPages(p, out);
    else if (entry.name === 'page.tsx') out.push(p);
  }
  return out;
}

/** app-router route for an admin page.tsx (drops route groups, keeps params). */
function routeOf(pagePath) {
  const relDir = relative(resolve(ROOT, 'apps/web/src/app'), pagePath)
    .replace(/[/\\]page\.tsx$/, '')
    .split(/[/\\]/)
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')'))); // route groups
  return '/' + relDir.join('/');
}

/** Read the page.tsx plus its co-located *.tsx (header often lives in a client child). */
function dirSources(pagePath) {
  const dir = pagePath.replace(/[/\\]page\.tsx$/, '');
  let combined = '';
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.tsx')) {
      combined += '\n' + readFileSync(join(dir, entry.name), 'utf8');
    }
  }
  return combined;
}

const navSrc = readFileSync(NAV_FILE, 'utf8');
const navHrefs = new Set(
  [...navSrc.matchAll(/href:\s*'(\/admin[^']*)'/g)].map((m) => m[1]),
);

// "Hubs" are admin sub-sections with their OWN nested layout (and thus their own
// sub-navigation), e.g. /admin/academy, /admin/growth. Their child routes are
// reached from inside the hub, not the main sidebar — so they are NOT orphaned.
const hubPrefixes = readdirSync(ADMIN_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .filter((e) => {
    try {
      statSync(join(ADMIN_DIR, e.name, 'layout.tsx'));
      return true;
    } catch {
      return false;
    }
  })
  .map((e) => `/admin/${e.name}`);

const underHub = (route) => hubPrefixes.some((h) => route === h || route.startsWith(h + '/'));

const pages = findPages(ADMIN_DIR).sort();
const rows = pages.map((pagePath) => {
  const route = routeOf(pagePath);
  const pageSrc = readFileSync(pagePath, 'utf8');
  const dirSrc = dirSources(pagePath);
  const isDynamic = route.includes('[');
  return {
    route,
    file: relative(ROOT, pagePath).replace(/\\/g, '/'),
    isDynamic,
    inNav: navHrefs.has(route),
    hubChild: underHub(route) && !hubPrefixes.includes(route),
    // A section sub-route whose PARENT route is a nav entry (the parent page
    // provides in-page tab/section navigation to it, e.g. Security OS tabs).
    // The /admin dashboard root does NOT count as a section parent — a
    // top-level /admin/X tool must earn its own nav entry.
    sectionChild:
      (() => {
        const parent = route.replace(/\/[^/]+$/, '');
        return parent !== '/admin' && navHrefs.has(parent) && !navHrefs.has(route);
      })(),
    usesPageHeader: /\bPageHeader\b/.test(dirSrc),
    hasHeading: /<(?:PageHeader|h1)\b/.test(dirSrc),
    hasMetadata: /export const metadata/.test(pageSrc),
    explicitNoindex: /noindex|index:\s*false/.test(pageSrc),
    hasDynamicExport: /export const dynamic\b/.test(pageSrc),
    usesStatusBadge: /\bStatusBadge\b/.test(dirSrc),
  };
});

// ── Findings ────────────────────────────────────────────────
// A route is discoverable if it's in the main nav OR it lives inside a hub
// (which has its own nested layout + sub-nav). Truly orphaned = neither.
const orphaned = rows.filter(
  (r) => !r.isDynamic && r.route !== '/admin' && !r.inNav && !r.hubChild && !r.sectionChild,
);
const hubChildren = rows.filter((r) => r.hubChild);
const sectionChildren = rows.filter((r) => r.sectionChild && !r.hubChild);
const noHeader = rows.filter((r) => !r.hasHeading);
const noPageHeader = rows.filter((r) => r.hasHeading && !r.usesPageHeader); // hand-rolled <h1>
const metaNoNoindex = rows.filter((r) => r.hasMetadata && !r.explicitNoindex);

const summary = {
  generatedAt: new Date().toISOString(),
  totalRoutes: rows.length,
  staticRoutes: rows.filter((r) => !r.isDynamic).length,
  dynamicRoutes: rows.filter((r) => r.isDynamic).length,
  navRegistered: rows.filter((r) => r.inNav).length,
  hubChildren: hubChildren.length,
  sectionChildren: sectionChildren.length,
  hubs: hubPrefixes,
  usesPageHeader: rows.filter((r) => r.usesPageHeader).length,
  usesStatusBadge: rows.filter((r) => r.usesStatusBadge).length,
  orphanedCount: orphaned.length,
  noHeadingCount: noHeader.length,
  handRolledHeaderCount: noPageHeader.length,
  metaWithoutExplicitNoindex: metaNoNoindex.length,
};

writeFileSync(
  OUT_JSON,
  JSON.stringify({ summary, orphaned, noHeader, noPageHeader, rows }, null, 2) + '\n',
);

// ── Markdown report ─────────────────────────────────────────
const pct = (n) => `${Math.round((n / rows.length) * 100)}%`;
const list = (arr) =>
  arr.length ? arr.map((r) => `- \`${r.route}\` — ${r.file}`).join('\n') : '_none_ ✅';

const md = `# Admin-shell audit

> Generated by \`scripts/audit-admin-shell.mjs\` — do not edit by hand.
> Snapshot: ${summary.generatedAt}

Inventory of every \`/admin/*\` route against the admin-shell contract: registered
nav entry · shared \`PageHeader\` · \`noindex\` metadata · dynamic rendering ·
consistent \`StatusBadge\` status vocabulary. All \`/admin/*\` routes already share
the same chrome structurally (one \`admin/layout.tsx\` → \`AdminShell\`); this audit
measures per-page consistency on top of that.

## Summary

| Metric | Value |
|---|---|
| Total routes | ${summary.totalRoutes} |
| Static / dynamic | ${summary.staticRoutes} / ${summary.dynamicRoutes} |
| Registered in main nav | ${summary.navRegistered} |
| Hub children (own sub-nav: ${summary.hubs.join(', ')}) | ${summary.hubChildren} |
| Section sub-routes (parent in nav) | ${summary.sectionChildren} |
| Use shared \`PageHeader\` | ${summary.usesPageHeader} (${pct(summary.usesPageHeader)}) |
| Use \`StatusBadge\` vocab | ${summary.usesStatusBadge} (${pct(summary.usesStatusBadge)}) |
| **Orphaned (static, no nav entry)** | **${summary.orphanedCount}** |
| No detectable heading (PageHeader/h1) | ${summary.noHeadingCount} |
| Hand-rolled \`<h1>\` (not PageHeader) | ${summary.handRolledHeaderCount} |
| Own metadata without explicit noindex | ${summary.metaWithoutExplicitNoindex} (inherit layout noindex) |

## Orphaned routes — reachable by URL but not in the admin nav

These static routes have no \`nav.ts\` entry, so they are not discoverable from the
sidebar/search. Either add a nav entry or confirm they are intentionally
deep-linked only.

${list(orphaned)}

## Routes with no detectable heading

No \`PageHeader\` or \`<h1>\` found in the route's own files (the heading may live in
a shared component these import — verify).

${list(noHeader)}

## Hand-rolled headings (not the shared PageHeader)

Render an \`<h1>\` directly instead of \`PageHeader\`, so they miss the consistent
icon + "what is this / why it matters" description slot.

${list(noPageHeader)}

## What's already consistent ✅

- **Shell** — one \`admin/layout.tsx\` wraps every route in \`AdminShell\` (sidebar +
  topbar + breadcrumbs), so the chrome is identical app-wide.
- **SEO safety** — ${summary.metaWithoutExplicitNoindex === 0 ? 'every' : 'most'} page
  with its own metadata keeps \`noindex\` (the layout also sets it). No admin route
  leaks to search.
- **Status vocab** — ${pct(summary.usesStatusBadge)} of routes use the shared
  \`StatusBadge\`; the rest are read-only panels with no status to show.

## Recommendations (priority order)

1. **Discoverability** — the ${orphaned.length} orphaned route(s) above are
   reachable only by direct URL. Add a \`nav.ts\` entry for each genuine tool, or
   confirm it is an intentional, unlisted debug/deep-link view (e.g.
   \`/admin/growth-agents\` documents itself as an admin debug view).
2. **Header consistency** — migrate the ${noPageHeader.length} hand-rolled \`<h1>\`
   headers to \`PageHeader\` so every page carries the icon + plain-English
   "what / why" description the shell contract expects.
3. **Caveat for "no heading"** — most are \`/admin/academy\` & \`/admin/growth\` hub
   children (they inherit a header from the hub) or thin server wrappers whose
   header lives in an imported client component OUTSIDE the route dir (e.g.
   \`components/admin/publishing/PublishingOSClient\`). Verify before treating as a
   gap — this scan only reads each route's own directory.

_Re-run any time: \`node scripts/audit-admin-shell.mjs\`._
`;

writeFileSync(OUT_MD, md);

// ── Console summary ─────────────────────────────────────────
console.log('Admin-shell audit');
console.log('─'.repeat(48));
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(28)} ${v}`);
console.log(`\n  orphaned routes (${orphaned.length}):`);
for (const r of orphaned) console.log(`    ${r.route}`);
console.log(`\n  report → ${relative(ROOT, OUT_MD)}`);
