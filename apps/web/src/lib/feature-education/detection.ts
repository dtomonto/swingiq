// ============================================================
// SwingVantage — Feature Education Engine: Detection
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   This is the "scout". It turns raw signals about the product into
//   Feature Registry records:
//     1. CHANGE-based detection (from a git commit range): classify each
//        changed file path, group related files into features, and attach
//        evidence (paths + commit shas) so nothing is invented.
//     2. STRUCTURE-based detection (from the live app map): build grounded
//        feature records from real routes, admin nav items, and Video
//        Studio surfaces.
//
//   It is PURE and DETERMINISTIC: same inputs → same records. No git, no
//   network, no server-only imports here — callers feed it data (the .mjs
//   scanner feeds git output; the API route feeds the app catalogs). That
//   keeps it trivially testable and reusable.
//
//   Anti-hallucination (spec §26): every record carries `evidence` (real
//   refs) and a `confidence`. Low-confidence records are flagged
//   `needsHumanReview` instead of being treated as ground truth.
// ============================================================

import {
  type FeatureRecord,
  type FeatureCategory,
  type FeatureAudience,
  type FeatureEvidence,
  type FeatureStatus,
  slugify,
} from './types';

// ── A single changed file (from git or a diff) ────────────────

export interface FileChange {
  path: string;
  /** Short commit sha that touched it (for provenance). */
  sha?: string;
  /** Commit subject (used to name/describe the feature). */
  message?: string;
  /** 'A'dded | 'M'odified | 'D'eleted (git status letter). */
  status?: string;
}

/** The classification of one path into a feature dimension. */
export interface PathClass {
  /** Stable grouping key — files with the same key form one feature. */
  key: string;
  category: FeatureCategory;
  audiences: FeatureAudience[];
  route?: string;
  component?: string;
  apiEndpoint?: string;
  dbTable?: string;
  flag?: string;
  permission?: string;
  adminControl?: string;
  isPublic: boolean;
  evidenceKind: FeatureEvidence['kind'];
  /** Base confidence this kind of change represents a real feature. */
  baseConfidence: number;
}

// ── Path helpers ──────────────────────────────────────────────

const APP_PREFIX = 'apps/web/src/';

function norm(p: string): string {
  return p.replace(/\\/g, '/').trim();
}

/** Paths we never treat as a feature signal. */
const IGNORE = [
  /(^|\/)node_modules\//,
  /(^|\/)__tests__\//,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /\.d\.ts$/,
  /(^|\/)\.git\//,
  /(^|\/)\.claude\//,
  /(^|\/)docs\//,
  /(^|\/)scripts\//,
  /\.(md|mdx|css|scss|svg|png|jpe?g|gif|webp|ico|lock|yml|yaml|toml)$/,
  /(^|\/)(package\.json|package-lock\.json|tsconfig.*\.json|next\.config\.[mc]?js|postcss\.config\.[mc]?js|tailwind\.config\.[mc]?js|jest\.config\.[mc]?js|eslint\.config\.[mc]?js)$/,
  /(^|\/)data\/(auto-updates|auto-dev-updates|social-pending|feature-registry)\.json$/,
];

function ignored(path: string): boolean {
  return IGNORE.some((re) => re.test(path));
}

/** Turn an app/ file path into a clean route (route groups + page stripped). */
export function routeFromAppPath(path: string): string | undefined {
  const p = norm(path);
  const m = p.match(new RegExp(`${APP_PREFIX}app/(.+?)/(page|layout|template)\\.[tj]sx$`));
  if (!m) return undefined;
  let route = m[1]
    .split('/')
    .filter((seg) => !/^\(.*\)$/.test(seg)) // drop (route groups)
    .map((seg) => seg.replace(/^\[(\.\.\.)?(.+?)\]$/, ':$2')) // [id] → :id
    .join('/');
  route = '/' + route;
  return route === '/' ? '/' : route.replace(/\/$/, '');
}

/** Turn an app/api/.../route.ts path into an API endpoint path. */
export function apiFromPath(path: string): string | undefined {
  const p = norm(path);
  const m = p.match(new RegExp(`${APP_PREFIX}app/api/(.+?)/route\\.[tj]s$`));
  if (!m) return undefined;
  const seg = m[1]
    .split('/')
    .map((s) => s.replace(/^\[(\.\.\.)?(.+?)\]$/, ':$2'))
    .join('/');
  return `/api/${seg}`;
}

/** Derive the same grouping key a route would get in classifyPath. */
export function keyForRoute(route: string): string {
  const segs = route.split('/').filter(Boolean);
  if (segs[0] === 'admin') return `admin/${segs[1] ?? 'home'}`;
  if (segs[0] === 'api') return `api/${segs[1] ?? 'root'}`;
  return segs[0] ?? 'home';
}

/** Humanize a key/segment into a feature name. */
export function humanize(s: string): string {
  return s
    .replace(/[-_/]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bApi\b/g, 'API')
    .replace(/\bSeo\b/g, 'SEO')
    .replace(/\bAi\b/g, 'AI')
    .trim();
}

// ── Category hints by domain word ─────────────────────────────

function categoryHints(path: string): FeatureCategory | undefined {
  const p = norm(path).toLowerCase();
  if (/(billing|pricing|monetiz|checkout|subscription|\bads?\b|affiliate)/.test(p)) return 'monetization';
  if (/(auth|login|signup|session|account|middleware)/.test(p)) return 'account-auth';
  if (/(security|privacy|constant-time|rate-limit|rbac|consent|gdpr)/.test(p)) return 'security-privacy';
  if (/(analytics|metrics|reporting|insights|dashboard)/.test(p)) return 'analytics-reporting';
  if (/(support|feedback|help|troubleshoot)/.test(p)) return 'support-troubleshooting';
  if (/(setting|config|preferences)/.test(p)) return 'user-setting';
  if (/(flag|feature-flag)/.test(p)) return 'analytics-reporting';
  return undefined;
}

/**
 * Classify a single changed file into a feature dimension, or null when the
 * path carries no feature signal.
 */
export function classifyPath(path: string): PathClass | null {
  const p = norm(path);
  if (ignored(p) || !p.startsWith(APP_PREFIX)) {
    // Allow top-level *.sql (schema) as a db signal.
    if (/\.sql$/.test(p)) {
      return {
        key: 'data-model',
        category: 'backend-api',
        audiences: ['developer', 'admin'],
        dbTable: p.split('/').pop()?.replace(/\.sql$/, ''),
        isPublic: false,
        evidenceKind: 'db',
        baseConfidence: 50,
      };
    }
    return null;
  }

  const deleted = false; // status handled by caller; classification is shape-only
  void deleted;

  // ── API routes ──
  const api = apiFromPath(p);
  if (api) {
    const seg = api.replace(/^\/api\//, '').split('/')[0];
    return {
      key: `api/${seg}`,
      category: categoryHints(p) ?? 'backend-api',
      audiences: ['developer', 'admin'],
      apiEndpoint: api,
      isPublic: false,
      evidenceKind: 'api',
      baseConfidence: 70,
    };
  }

  // ── Pages / routes ──
  const route = routeFromAppPath(p);
  if (route) {
    const isAdmin = route.startsWith('/admin');
    const isMarketing = /\/app\/\(marketing\)\//.test(p) || ['/', '/pricing', '/how-it-works'].includes(route);
    const segs = route.split('/').filter(Boolean);
    const key = isAdmin ? `admin/${segs[1] ?? 'home'}` : (segs[0] ?? 'home');
    return {
      key,
      category:
        categoryHints(p) ?? (isAdmin ? 'admin-capability' : isMarketing ? 'ui-change' : 'new-feature'),
      audiences: isAdmin ? ['admin'] : isMarketing ? ['all'] : ['new-user', 'returning-user'],
      route,
      isPublic: !isAdmin,
      adminControl: isAdmin ? route : undefined,
      evidenceKind: 'route',
      baseConfidence: isAdmin ? 70 : 75,
    };
  }

  // ── Components ──
  const comp = p.match(new RegExp(`${APP_PREFIX}components/([^/]+)/`));
  if (comp) {
    return {
      key: `ui/${comp[1]}`,
      category: categoryHints(p) ?? 'ui-change',
      audiences: ['new-user', 'returning-user'],
      component: p.replace(APP_PREFIX, ''),
      isPublic: false,
      evidenceKind: 'component',
      baseConfidence: 45,
    };
  }
  const compFlat = p.match(new RegExp(`${APP_PREFIX}components/([^/]+)\\.[tj]sx$`));
  if (compFlat) {
    return {
      key: `ui/${slugify(compFlat[1])}`,
      category: categoryHints(p) ?? 'ui-change',
      audiences: ['new-user', 'returning-user'],
      component: p.replace(APP_PREFIX, ''),
      isPublic: false,
      evidenceKind: 'component',
      baseConfidence: 40,
    };
  }

  // ── Lib modules (capabilities) ──
  const lib = p.match(new RegExp(`${APP_PREFIX}lib/([^/]+)/`));
  if (lib) {
    return {
      key: `lib/${lib[1]}`,
      category: categoryHints(p) ?? 'enhancement',
      audiences: ['developer'],
      component: p.replace(APP_PREFIX, ''),
      isPublic: false,
      evidenceKind: 'component',
      baseConfidence: 55,
    };
  }

  return null;
}

// ── Grouping + record building ────────────────────────────────

function hashString(s: string): string {
  // FNV-1a 32-bit — small, dependency-free, stable.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Stable fingerprint of what a feature touches (drift detection). */
export function fingerprintFeature(f: Pick<FeatureRecord, 'routes' | 'components' | 'apiEndpoints' | 'featureFlags'>): string {
  const parts = [...f.routes, ...f.components, ...f.apiEndpoints, ...f.featureFlags].sort();
  return hashString(parts.join('|'));
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/** Pick the most specific category among a feature's file classifications. */
function dominantCategory(classes: PathClass[]): FeatureCategory {
  // Prefer non-generic categories over 'ui-change'/'enhancement'.
  const ranked = classes
    .map((c) => c.category)
    .sort((a, b) => categoryRank(b) - categoryRank(a));
  return ranked[0] ?? 'enhancement';
}

function categoryRank(c: FeatureCategory): number {
  const generic: FeatureCategory[] = ['ui-change', 'enhancement'];
  if (c === 'removed' || c === 'deprecated') return 5;
  return generic.includes(c) ? 1 : 3;
}

export interface BuildOptions {
  now?: Date;
  /** Provenance source label when there are no shas (e.g. 'route-scan'). */
  source?: string;
  /** Force a status (e.g. 'removed' when all files deleted). */
  status?: FeatureStatus;
  /** Override/seed name + description (e.g. from a Feature: trailer). */
  name?: string;
  description?: string;
  owner?: string;
}

/** Build one FeatureRecord from a group of classified file changes. */
export function buildFeatureFromChanges(
  key: string,
  changes: FileChange[],
  classes: PathClass[],
  opts: BuildOptions = {},
): FeatureRecord {
  const now = opts.now ?? new Date();
  const iso = now.toISOString();

  const routes = uniq(classes.map((c) => c.route).filter(Boolean) as string[]);
  const components = uniq(classes.map((c) => c.component).filter(Boolean) as string[]);
  const apiEndpoints = uniq(classes.map((c) => c.apiEndpoint).filter(Boolean) as string[]);
  const dbTables = uniq(classes.map((c) => c.dbTable).filter(Boolean) as string[]);
  const featureFlags = uniq(classes.map((c) => c.flag).filter(Boolean) as string[]);
  const permissions = uniq(classes.map((c) => c.permission).filter(Boolean) as string[]);
  const adminControls = uniq(classes.map((c) => c.adminControl).filter(Boolean) as string[]);
  const audiences = uniq(classes.flatMap((c) => c.audiences));
  const isPublic = classes.some((c) => c.isPublic);

  const shas = uniq(changes.map((c) => c.sha).filter(Boolean) as string[]);
  const evidence: FeatureEvidence[] = [
    ...classes.map((c) => ({ kind: c.evidenceKind, ref: c.route ?? c.apiEndpoint ?? c.component ?? c.dbTable ?? key })),
    ...shas.map((s) => ({ kind: 'commit' as const, ref: s })),
  ];

  // Confidence: best base signal, lifted by corroboration (more file types).
  const base = Math.max(...classes.map((c) => c.baseConfidence), 30);
  const corroboration = Math.min(20, (uniq(classes.map((c) => c.evidenceKind)).length - 1) * 8);
  const confidence = opts.name ? Math.max(85, base) : Math.min(95, base + corroboration);

  const allDeleted = changes.length > 0 && changes.every((c) => c.status === 'D');
  const status: FeatureStatus = opts.status ?? (allDeleted ? 'removed' : 'active');

  const name = opts.name ?? humanize(key.replace(/^(admin|api|ui|lib)\//, ''));
  const messages = uniq(changes.map((c) => c.message).filter(Boolean) as string[]);
  const description =
    opts.description ??
    (messages[0]
      ? messages[0].replace(/^[a-z]+(\([^)]*\))?:\s*/i, '')
      : `${name} — detected from ${routes[0] ?? apiEndpoints[0] ?? components[0] ?? key}.`);

  const partial = { routes, components, apiEndpoints, featureFlags };

  return {
    id: `feat_${slugify(key) || hashString(key)}`,
    slug: slugify(key) || hashString(key),
    name,
    description,
    category: status === 'removed' ? 'removed' : dominantCategory(classes),
    audiences: audiences.length ? audiences : ['all'],
    status,
    routes,
    components,
    apiEndpoints,
    dbTables,
    permissions,
    adminControls,
    featureFlags,
    owner: opts.owner ?? 'unassigned',
    detectedFrom: shas.length ? shas : [opts.source ?? 'route-scan'],
    evidence,
    confidence,
    needsHumanReview: confidence < 60,
    coverage: {},
    fingerprint: fingerprintFeature(partial),
    createdAt: iso,
    updatedAt: iso,
  };
}

/**
 * Detect features from a flat list of file changes (the git-scan path).
 * Groups by classification key and builds one record per group.
 */
export function detectFromChanges(changes: FileChange[], opts: BuildOptions = {}): FeatureRecord[] {
  const groups = new Map<string, { changes: FileChange[]; classes: PathClass[] }>();
  for (const ch of changes) {
    const cls = classifyPath(ch.path);
    if (!cls) continue;
    const g = groups.get(cls.key) ?? { changes: [], classes: [] };
    g.changes.push(ch);
    g.classes.push(cls);
    groups.set(cls.key, g);
  }
  return [...groups.entries()].map(([key, g]) => buildFeatureFromChanges(key, g.changes, g.classes, opts));
}

// ── Structure-based builders (the app-map path) ───────────────
// Callers pass plain data from the real catalogs so this file stays free
// of heavy/server-only imports.

export interface SurfaceLike {
  id: string;
  page: string;
  label: string;
  description: string;
  audience: string;
  sport?: string;
  isPublic?: boolean;
}

export interface NavLike {
  id: string;
  label: string;
  href: string;
  blurb: string;
  permission?: string;
  built: boolean;
}

/** Build a feature record from a Video Studio surface (real route + zone). */
export function featureFromSurface(s: SurfaceLike, now = new Date()): FeatureRecord {
  const key = keyForRoute(s.page);
  const cls: PathClass = {
    key,
    category: 'new-feature',
    audiences: mapAudience(s.audience),
    route: s.page,
    isPublic: s.isPublic ?? !s.page.startsWith('/admin'),
    evidenceKind: 'route',
    baseConfidence: 80,
  };
  const rec = buildFeatureFromChanges(
    key,
    [{ path: `surface:${s.id}`, message: s.description }],
    [cls],
    { now, source: 'surface-scan', name: s.label, description: s.description },
  );
  rec.sport = s.sport && s.sport !== 'all' ? s.sport : undefined;
  rec.evidence.push({ kind: 'nav', ref: s.id, detail: 'Video Studio surface' });
  return rec;
}

/** Build a feature record from an admin nav item (real admin route). */
export function featureFromNav(n: NavLike, now = new Date()): FeatureRecord {
  const key = keyForRoute(n.href);
  const cls: PathClass = {
    key,
    category: 'admin-capability',
    audiences: ['admin'],
    route: n.href,
    adminControl: n.href,
    permission: n.permission,
    isPublic: false,
    evidenceKind: 'nav',
    baseConfidence: 78,
  };
  const rec = buildFeatureFromChanges(
    key,
    [{ path: `nav:${n.id}`, message: n.blurb }],
    [cls],
    { now, source: 'nav-scan', name: `${n.label} (admin)`, description: n.blurb },
  );
  if (!n.built) rec.status = 'beta';
  return rec;
}

function mapAudience(a: string): FeatureAudience[] {
  switch (a) {
    case 'athlete':
      return ['new-user', 'returning-user'];
    case 'parent':
      return ['parent'];
    case 'coach':
      return ['coach'];
    case 'team':
      return ['enterprise'];
    default:
      return ['all'];
  }
}

/**
 * Merge freshly-detected records into an existing set by id: a re-detected
 * feature keeps its created date + coverage but refreshes touched surfaces,
 * evidence, confidence and fingerprint.
 */
export function mergeFeatures(existing: FeatureRecord[], detected: FeatureRecord[]): FeatureRecord[] {
  const byId = new Map(existing.map((f) => [f.id, f]));
  for (const d of detected) {
    const prev = byId.get(d.id);
    if (!prev) {
      byId.set(d.id, d);
      continue;
    }
    byId.set(d.id, {
      ...d,
      createdAt: prev.createdAt,
      coverage: prev.coverage,
      owner: prev.owner !== 'unassigned' ? prev.owner : d.owner,
      // Keep a manual/explicit status if one was set and detection is generic.
      status: prev.status === 'deprecated' ? 'deprecated' : d.status,
      detectedFrom: uniq([...prev.detectedFrom, ...d.detectedFrom]).slice(-12),
    });
  }
  return [...byId.values()];
}
