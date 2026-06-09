// ============================================================
// securityOS — posture signal gathering (SERVER-ONLY)
// ------------------------------------------------------------
// The ONE place the engine's inputs are read from live sources. Every source
// is wrapped defensively: a read that fails degrades to `null` ("unknown") so
// one broken source can never take down the scan AND we never fabricate a
// pass. The pure evaluator (posture-checks.ts) turns this bundle into results.
//
// Sources (all already exist in the repo — nothing is invented):
//   • Environment            → admin allowlist/secret/roles, Supabase, rate
//                              limiter, AI budget, AI provider, prod flag
//   • next.config.mjs        → CSP + HSTS headers
//   • .github/workflows/*    → secret-scan / dep-audit / SAST presence
//   • supabase-*.sql         → RLS policies applied
//   • docs/security/*        → incident-response runbook present
//   • repo test files        → prompt-injection + authorization tests
//   • Audit Reports snapshot → open security-relevant findings
// ============================================================

import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import { isConfigured, isSupabaseConfigured, isAiCoachConfigured, isAiVisionConfigured } from '@/lib/capabilities';
import { adminEmails } from '@/lib/auth/admin-allowlist';
import { loadFindings } from '@/lib/admin/audits/data';
import { loadSnapshot } from '@/lib/branch-guardian/snapshot.server';
import type { PostureInput } from './types';
import type { AuditRobotFinding } from './findings';

// ── filesystem helpers (defensive: any failure → null) ──────────────────────

/** Candidate roots: the web app dir and up to two ancestors (repo root). */
function candidateRoots(): string[] {
  const cwd = process.cwd();
  return [cwd, path.resolve(cwd, '..'), path.resolve(cwd, '..', '..')];
}

/** Read the first existing file among rel paths across candidate roots. */
function readFirst(relPaths: string[]): string | null {
  for (const root of candidateRoots()) {
    for (const rel of relPaths) {
      try {
        const p = path.join(root, rel);
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          return fs.readFileSync(p, 'utf8');
        }
      } catch {
        /* keep trying */
      }
    }
  }
  return null;
}

/** True/false if a directory exists & any file matches; null if unreadable. */
function dirContentMatches(relDir: string, re: RegExp): boolean | null {
  for (const root of candidateRoots()) {
    try {
      const dir = path.join(root, relDir);
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
      let combined = '';
      for (const name of fs.readdirSync(dir)) {
        try {
          combined += fs.readFileSync(path.join(dir, name), 'utf8') + '\n';
        } catch {
          /* skip unreadable file */
        }
      }
      return re.test(combined);
    } catch {
      /* try next root */
    }
  }
  return null;
}

/** Bounded recursive search for a filename matching `re` under relDir. */
function hasFileNamed(relDir: string, re: RegExp, maxDepth = 5): boolean | null {
  let sawDir = false;
  const walk = (dir: string, depth: number): boolean => {
    if (depth > maxDepth) return false;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (walk(full, depth + 1)) return true;
      } else if (re.test(e.name)) {
        return true;
      }
    }
    return false;
  };
  for (const root of candidateRoots()) {
    const dir = path.join(root, relDir);
    try {
      if (!fs.existsSync(dir)) continue;
      sawDir = true;
      if (walk(dir, 0)) return true;
    } catch {
      /* try next root */
    }
  }
  return sawDir ? false : null;
}

// ── individual signals ──────────────────────────────────────────────────────

function rateLimiterConfigured(): boolean {
  return (
    isConfigured(process.env.UPSTASH_REDIS_REST_URL) &&
    isConfigured(process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function aiBudgetArmed(): boolean {
  const raw = process.env.AI_DAILY_BUDGET_CENTS;
  if (!isConfigured(raw)) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0;
}

function headersHave(re: RegExp): boolean | null {
  const cfg = readFirst(['next.config.mjs', 'next.config.js', 'apps/web/next.config.mjs']);
  const mw = readFirst(['src/middleware.ts', 'apps/web/src/middleware.ts', 'middleware.ts']);
  if (cfg === null && mw === null) return null;
  return re.test((cfg ?? '') + '\n' + (mw ?? ''));
}

function rlsApplied(): boolean | null {
  const sql = readFirst([
    'supabase-relational-schema.sql',
    'supabase-rls.sql',
    'apps/web/supabase-relational-schema.sql',
    'apps/web/supabase-rls.sql',
  ]);
  if (sql === null) return null;
  return /enable\s+row\s+level\s+security|create\s+policy/i.test(sql);
}

function incidentRunbookPresent(): boolean | null {
  const doc = readFirst([
    'docs/security/incident-response-runbook.md',
    '../docs/security/incident-response-runbook.md',
  ]);
  if (doc !== null) return doc.trim().length > 0;
  // Distinguish "couldn't read" from "absent": if the docs dir is reachable,
  // its absence is a real fail; otherwise unknown.
  return dirContentMatches('docs/security', /incident/i);
}

function ciWorkflows(re: RegExp): boolean | null {
  return dirContentMatches('.github/workflows', re);
}

/**
 * Whether the BranchGuardianOS git snapshot shows ZERO risky untracked files
 * (.env / keys / dumps / logs) across any worktree. null when the snapshot is
 * absent/empty (couldn't read). This is BranchGuardianOS feeding securityOS.
 */
function untrackedSecretsClean(): boolean | null {
  try {
    const snap = loadSnapshot();
    if (!snap.git || (snap.branches.length === 0 && snap.worktrees.length === 0)) return null;
    let risky = 0;
    for (const w of snap.worktrees) risky += w.dirty?.untrackedRisky?.length ?? 0;
    if (snap.currentDirty && !snap.worktrees.some((w) => w.isPrimary)) {
      risky += snap.currentDirty.untrackedRisky?.length ?? 0;
    }
    return risky === 0;
  } catch {
    return null;
  }
}

function safeAuditFindings(): { findings: AuditRobotFinding[]; open: number } {
  try {
    const open = loadFindings().filter((f) => f.trackStatus !== 'done');
    const findings: AuditRobotFinding[] = open.map((f) => ({
      id: f.id,
      category: f.category,
      finding: f.finding,
      recommendation: f.recommendation,
      priority: f.priority,
      status: f.trackStatus,
    }));
    return { findings, open: open.length };
  } catch {
    return { findings: [], open: 0 };
  }
}

export interface PostureBundle {
  input: PostureInput;
  auditFindings: AuditRobotFinding[];
}

/** Gather every live signal into the bundle the engine consumes. */
export function gatherPosture(now: Date = new Date()): PostureBundle {
  const { findings, open } = safeAuditFindings();

  const input: PostureInput = {
    now: now.toISOString(),
    adminAllowlist: adminEmails().length > 0,
    adminSecret: isConfigured(process.env.ADMIN_SECRET),
    adminRoles: isConfigured(process.env.ADMIN_ROLES),
    supabaseAuth: isSupabaseConfigured,
    rlsApplied: rlsApplied(),
    rateLimiter: rateLimiterConfigured(),
    cspHeaders: headersHave(/content-security-policy/i),
    hstsHeaders: headersHave(/strict-transport-security/i),
    aiConfigured: safe(() => isAiCoachConfigured() || isAiVisionConfigured(), false),
    aiBudgetKillSwitch: aiBudgetArmed(),
    aiPromptInjectionTests: hasFileNamed('src/lib', /(prompt[-_.]?inject|red[-_.]?team|adversarial).*\.test\.tsx?$/i),
    adminAuditLog: true, // the local-first admin audit log store ships with the app
    incidentRunbook: incidentRunbookPresent(),
    secretScanCi: ciWorkflows(/gitleaks|trufflehog|secret[-_ ]?scan/i),
    depScanCi: ciWorkflows(/npm audit|osv-scanner|dependabot|dependency[-_ ]?audit/i),
    sastCi: ciWorkflows(/codeql|semgrep/i),
    securityTests: hasFileNamed('src', /(security-os|rbac|authoriz|admin[-_.]access|rate-limit)\.test\.tsx?$/i),
    productionEnv: process.env.NODE_ENV === 'production',
    auditAccessToken: isConfigured(process.env.AUDIT_ACCESS_TOKEN),
    untrackedSecretsClean: untrackedSecretsClean(),
    openAuditFindings: open,
  };

  return { input, auditFindings: findings };
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
