// ============================================================
// SwingVantage — Feature Education Engine: Security / Privacy Scanner
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Before anything is published — especially anything PUBLIC — this scans
//   the generated copy for things that must never leak: real secrets/keys,
//   env var names, internal URLs, admin-only instructions in public docs,
//   service-role references, and obvious PII. It returns findings (with a
//   truncated, redacted excerpt — never the full secret) and a verdict.
//
//   Severity:
//     - `block`  : must be removed before publishing (always for secrets;
//                  for public assets also internal URLs / admin-only / service-role).
//     - `warn`   : advisory (e.g. an admin term in an admin-only doc is fine).
//
//   Pure + deterministic. Mirrors patterns in scripts/security-check.mjs.
// ============================================================

import {
  type EducationAsset,
  type SecurityFinding,
  type SecurityScanResult,
  type AssetVisibility,
} from './types';

interface Rule {
  type: SecurityFinding['type'];
  pattern: RegExp;
  reason: string;
  /** True → block in any asset; false → block only when the asset is public. */
  alwaysBlock: boolean;
}

const RULES: Rule[] = [
  // Real secret-key prefixes (from security-check.mjs).
  {
    type: 'secret',
    pattern: /sk-(proj|ant)-[A-Za-z0-9_-]{8,}/,
    reason: 'Looks like a real API secret key.',
    alwaysBlock: true,
  },
  { type: 'secret', pattern: /AIza[A-Za-z0-9_-]{10,}/, reason: 'Looks like a Google API key.', alwaysBlock: true },
  { type: 'secret', pattern: /AKIA[0-9A-Z]{16}/, reason: 'Looks like an AWS access key id.', alwaysBlock: true },
  { type: 'secret', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, reason: 'Embedded private key.', alwaysBlock: true },
  { type: 'secret', pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\./, reason: 'Looks like a JWT.', alwaysBlock: true },
  { type: 'secret', pattern: /\b(api[_-]?key|secret|password|passwd)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{8,}/i, reason: 'Hardcoded credential.', alwaysBlock: true },
  {
    type: 'secret',
    pattern: /\bbearer\s+[A-Za-z0-9_\-.]{16,}/i,
    reason: 'Embedded bearer token.',
    alwaysBlock: true,
  },
  // Env vars — the secret-bearing ones must never appear in user copy.
  {
    type: 'env-var',
    pattern: /\b(SUPABASE_SERVICE_ROLE_KEY|ADMIN_SECRET|CRON_SECRET|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|RESEND_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY)\b/,
    reason: 'Names a server-only secret environment variable.',
    alwaysBlock: true,
  },
  {
    type: 'env-var',
    pattern: /process\.env\.[A-Z0-9_]+/,
    reason: 'Exposes an environment variable reference.',
    alwaysBlock: false,
  },
  {
    type: 'auth-logic',
    pattern: /\b(service[\s-]?role)\b/i,
    reason: 'Mentions the service-role key/path — keep out of public docs.',
    alwaysBlock: false,
  },
  // Internal URLs.
  {
    type: 'internal-url',
    pattern: /\b(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\b/,
    reason: 'Internal/localhost URL.',
    alwaysBlock: false,
  },
  {
    type: 'internal-url',
    pattern: /https?:\/\/[a-z0-9-]+\.supabase\.co/i,
    reason: 'Internal Supabase project URL.',
    alwaysBlock: true,
  },
  // Developer detail / DB internals leaking into public copy.
  {
    type: 'developer-detail',
    pattern: /\b(RLS|row[\s-]level security)\b/i,
    reason: 'Database security internals — not for public docs.',
    alwaysBlock: false,
  },
  // Obvious PII shapes.
  {
    type: 'pii',
    pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/,
    reason: 'Looks like an email address (possible PII).',
    alwaysBlock: false,
  },
  {
    type: 'pii',
    pattern: /\b(?:\d[ -]?){13,16}\b/,
    reason: 'Looks like a long card/account number (possible PII).',
    alwaysBlock: false,
  },
];

/** Allowlisted public env vars never count as a leak. */
const PUBLIC_ENV_ALLOW = /\bNEXT_PUBLIC_[A-Z0-9_]+\b/;

function redact(line: string, match: string): string {
  const idx = line.indexOf(match);
  const start = Math.max(0, idx - 16);
  const end = Math.min(line.length, idx + match.length + 16);
  const head = match.slice(0, 3);
  return `${line.slice(start, idx)}${head}…[redacted]${line.slice(idx + match.length, end)}`.trim().slice(0, 120);
}

/** Whether an admin/internal route reference is a leak for this visibility. */
function adminRefIsLeak(visibility: AssetVisibility): boolean {
  return visibility === 'public';
}

/** Gather every line of user-visible text from an asset. */
export function assetText(asset: EducationAsset): string[] {
  const lines: string[] = [asset.title, asset.summary];
  for (const s of asset.sections) {
    lines.push(s.heading, ...s.body);
  }
  for (const st of asset.steps ?? []) lines.push(st.title, st.detail);
  for (const f of asset.faqs ?? []) lines.push(f.q, f.a);
  if (asset.seo) lines.push(asset.seo.title, asset.seo.description, asset.seo.aeoAnswer, ...asset.seo.keywords);
  if (asset.inAppHelp) lines.push(asset.inAppHelp.headline, asset.inAppHelp.body);
  return lines.flatMap((l) => String(l ?? '').split('\n')).filter(Boolean);
}

/** Scan an asset for secrets / leaks. Pure + deterministic. */
export function scanAsset(asset: EducationAsset, now: Date = new Date()): SecurityScanResult {
  const isPublic = asset.visibility === 'public';
  const findings: SecurityFinding[] = [];
  const seen = new Set<string>();

  for (const line of assetText(asset)) {
    for (const rule of RULES) {
      const m = line.match(rule.pattern);
      if (!m) continue;
      // env-var rule: skip allowlisted public vars.
      if (rule.type === 'env-var' && rule.pattern.source === 'process\\.env\\.[A-Z0-9_]+' && PUBLIC_ENV_ALLOW.test(line)) {
        continue;
      }
      const severity: SecurityFinding['severity'] =
        rule.alwaysBlock || (isPublic && ['internal-url', 'auth-logic', 'developer-detail'].includes(rule.type))
          ? 'block'
          : 'warn';
      const excerpt = redact(line, m[0]);
      const key = `${rule.type}:${excerpt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ type: rule.type, severity, excerpt, reason: rule.reason });
    }

    // Admin-only routes mentioned in a PUBLIC asset are a leak.
    if (adminRefIsLeak(asset.visibility) && /\/admin(\/|\b)/.test(line)) {
      const excerpt = line.trim().slice(0, 120);
      const key = `admin-only:${excerpt}`;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({
          type: 'admin-only',
          severity: 'block',
          excerpt,
          reason: 'Public asset references an admin-only route.',
        });
      }
    }
  }

  const hasBlock = findings.some((f) => f.severity === 'block');
  return {
    findings,
    safeToPublishPublicly: !hasBlock,
    scannedAt: now.toISOString(),
  };
}

/** Quick gate used by the publish workflow. */
export function isSafeToPublish(asset: EducationAsset): boolean {
  const result = asset.security ?? scanAsset(asset);
  if (asset.visibility === 'public') return result.safeToPublishPublicly;
  // Non-public assets only block on always-block findings (secrets/env).
  return !result.findings.some(
    (f) => f.severity === 'block' && ['secret', 'env-var'].includes(f.type),
  );
}
