// ============================================================
// securityOS — unit tests (pure engine + RBAC gating)
// ------------------------------------------------------------
// Covers the honesty rule (unknown excluded), check evaluation, findings
// derivation, recommendation bucketing/priority, secret redaction, and the
// `security.manage` access gate. All pure — no server-only imports.
// ============================================================

import { computeSecurityScore, computeCategoryScore, scoreBand, maturityFor } from '../scoring';
import { POSTURE_CHECKS, evaluateChecks } from '../posture-checks';
import { deriveFindings, findingFromCheck, riskScoreFor } from '../findings';
import { generateRecommendations, bucketFor, recommendationFromFinding } from '../recommendations';
import { redactString, redactDeep, redactMetadata } from '../redaction';
import type { EvaluatedCheck, PostureInput, SecurityFinding } from '../types';
import { PERMISSIONS, ROLES, roleHasPermission } from '@/lib/admin/rbac';

const NOW = '2026-06-08T12:00:00.000Z';

function baseInput(overrides: Partial<PostureInput> = {}): PostureInput {
  return {
    now: NOW,
    adminAllowlist: true,
    adminSecret: true,
    adminRoles: true,
    supabaseAuth: true,
    rlsApplied: true,
    rateLimiter: true,
    cspHeaders: true,
    hstsHeaders: true,
    aiConfigured: false,
    aiBudgetKillSwitch: false,
    aiPromptInjectionTests: true,
    adminAuditLog: true,
    incidentRunbook: true,
    secretScanCi: true,
    depScanCi: true,
    sastCi: true,
    securityTests: true,
    productionEnv: false,
    auditAccessToken: false,
    openAuditFindings: 0,
    ...overrides,
  };
}

function fakeCheck(over: Partial<EvaluatedCheck>): EvaluatedCheck {
  return {
    id: 'x',
    category: 'application_security',
    riskDomain: 'API',
    title: 'Test check',
    description: 'desc',
    severity: 'high',
    weight: 1,
    frameworks: {},
    businessImpact: 'bi',
    whatCouldHappen: 'wch',
    recommendedFix: 'fix',
    stepByStepActions: ['a'],
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    result: 'fail',
    evidence: ['e'],
    ...over,
  };
}

describe('scoring — honesty rule', () => {
  it('excludes unknown checks from the category score but lowers confidence', () => {
    const cat = computeCategoryScore('application_security', [
      fakeCheck({ id: 'a', result: 'pass' }),
      fakeCheck({ id: 'b', result: 'unknown' }),
    ]);
    expect(cat.score).toBe(100); // only the pass counts
    expect(cat.confidence).toBe(0.5); // half the checks were readable
  });

  it('returns null score when every check is unknown', () => {
    const cat = computeCategoryScore('ai_security', [fakeCheck({ result: 'unknown' })]);
    expect(cat.score).toBeNull();
    expect(cat.confidence).toBe(0);
  });

  it('weights partial at 50 and fail at 0', () => {
    const cat = computeCategoryScore('application_security', [
      fakeCheck({ id: 'a', result: 'pass', weight: 1 }),
      fakeCheck({ id: 'b', result: 'fail', weight: 1 }),
    ]);
    expect(cat.score).toBe(50);
  });

  it('overall excludes all-unknown categories and reflects global confidence', () => {
    const score = computeSecurityScore(
      [
        fakeCheck({ id: 'a', category: 'application_security', result: 'pass' }),
        fakeCheck({ id: 'b', category: 'ai_security', result: 'unknown' }),
      ],
      { now: NOW },
    );
    expect(score.overall).toBe(100); // only app-sec contributed
    expect(score.confidence).toBe(50); // 1 of 2 checks readable
  });

  it('bands and maturity track the number', () => {
    expect(scoreBand(95)).toBe('strong');
    expect(scoreBand(30)).toBe('critical');
    expect(maturityFor(95)).toBe('Optimized');
    expect(maturityFor(20)).toBe('Initial');
  });
});

describe('posture-checks — evaluation', () => {
  it('passes admin allowlist when set, fails when not', () => {
    const pass = evaluateChecks(baseInput({ adminAllowlist: true })).find((c) => c.id === 'iam-admin-allowlist')!;
    const fail = evaluateChecks(baseInput({ adminAllowlist: false })).find((c) => c.id === 'iam-admin-allowlist')!;
    expect(pass.result).toBe('pass');
    expect(fail.result).toBe('fail');
  });

  it('treats a null signal as unknown (RLS unreadable)', () => {
    const c = evaluateChecks(baseInput({ rlsApplied: null })).find((x) => x.id === 'data-rls')!;
    expect(c.result).toBe('unknown');
  });

  it('AI budget passes in keyless mode but fails when a paid provider is unbudgeted', () => {
    const keyless = evaluateChecks(baseInput({ aiConfigured: false })).find((c) => c.id === 'ai-budget-killswitch')!;
    const unbudgeted = evaluateChecks(baseInput({ aiConfigured: true, aiBudgetKillSwitch: false })).find((c) => c.id === 'ai-budget-killswitch')!;
    const armed = evaluateChecks(baseInput({ aiConfigured: true, aiBudgetKillSwitch: true })).find((c) => c.id === 'ai-budget-killswitch')!;
    expect(keyless.result).toBe('pass');
    expect(unbudgeted.result).toBe('fail');
    expect(armed.result).toBe('pass');
  });

  it('production with no allowlist/secret fails the lockdown check', () => {
    const c = evaluateChecks(baseInput({ productionEnv: true, adminSecret: false, adminAllowlist: false })).find((x) => x.id === 'infra-prod-secret')!;
    expect(c.result).toBe('fail');
  });

  it('every check produces a result and strips the evaluate function', () => {
    const checks = evaluateChecks(baseInput());
    expect(checks).toHaveLength(POSTURE_CHECKS.length);
    for (const c of checks) {
      expect(['pass', 'partial', 'fail', 'unknown']).toContain(c.result);
      expect((c as unknown as Record<string, unknown>).evaluate).toBeUndefined();
    }
  });
});

describe('findings — derivation', () => {
  it('does not create findings for pass/unknown', () => {
    expect(findingFromCheck(fakeCheck({ result: 'pass' }), NOW)).toBeNull();
    expect(findingFromCheck(fakeCheck({ result: 'unknown' }), NOW)).toBeNull();
  });

  it('downgrades severity for a partial finding', () => {
    const f = findingFromCheck(fakeCheck({ severity: 'critical', result: 'partial' }), NOW)!;
    expect(f.severity).toBe('high'); // critical → high
  });

  it('risk score increases with severity', () => {
    expect(riskScoreFor('critical', 'high', 'high')).toBeGreaterThan(riskScoreFor('low', 'high', 'high'));
  });

  it('joins security-relevant audit findings and sorts by severity', () => {
    const checks = evaluateChecks(baseInput({ adminAllowlist: false })); // creates a critical finding
    const findings = deriveFindings(
      checks,
      [{ id: 'A1', category: 'Security', finding: 'auth bypass risk', recommendation: 'fix it', priority: 'P1', status: 'open' }],
      NOW,
    );
    expect(findings.some((f) => f.id === 'audit:A1')).toBe(true);
    expect(findings[0].severity).toBe('critical'); // sorted hardest-first
  });

  it('filters out non-security audit findings by default', () => {
    const findings = deriveFindings([], [{ id: 'B1', category: 'SEO', finding: 'thin content', recommendation: 'x', priority: 'P2', status: 'open' }], NOW);
    expect(findings.some((f) => f.id === 'audit:B1')).toBe(false);
  });
});

describe('recommendations — bucketing & priority', () => {
  const mk = (over: Partial<SecurityFinding>): SecurityFinding => ({
    id: 'chk:x',
    title: 't',
    description: 'd',
    category: 'application_security',
    riskDomain: 'API',
    source: 'posture-scan',
    severity: 'high',
    likelihood: 'high',
    impact: 'high',
    riskScore: 80,
    affectedArea: 'API',
    evidence: [],
    recommendedFix: 'fix',
    businessImpact: 'bi',
    technicalImpact: 'ti',
    frameworks: {},
    effort: 'M',
    canClaudeFix: true,
    needsCredentials: false,
    recurrenceRisk: 'high',
    stepByStepActions: ['a'],
    createdAt: NOW,
    dueDate: '2026-06-11',
    ...over,
  });

  it('routes credential-blocked work to waiting_on_credentials', () => {
    expect(bucketFor(mk({ needsCredentials: true }))).toBe('waiting_on_credentials');
  });
  it('routes non-Claude-fixable work to needs_manual_setup', () => {
    expect(bucketFor(mk({ canClaudeFix: false, needsCredentials: false }))).toBe('needs_manual_setup');
  });
  it('routes a fixable high/critical to do_today', () => {
    expect(bucketFor(mk({ severity: 'critical' }))).toBe('do_today');
  });
  it('routes a medium to this_week and low to monitor', () => {
    expect(bucketFor(mk({ severity: 'medium' }))).toBe('this_week');
    expect(bucketFor(mk({ severity: 'low' }))).toBe('monitor');
  });

  it('sorts higher severity to a higher priority score', () => {
    const recs = generateRecommendations([mk({ id: 'a', severity: 'low', riskScore: 30 }), mk({ id: 'b', severity: 'critical', riskScore: 95 })]);
    expect(recs[0].relatedFindingId).toBe('b');
    expect(recs[0].priorityScore).toBeGreaterThan(recs[1].priorityScore);
  });

  it('carries a link to the originating finding', () => {
    const rec = recommendationFromFinding(mk({ id: 'chk:iam-admin-allowlist' }));
    expect(rec.relatedLinks[0].href).toContain('/admin/security-os/findings/');
  });
});

describe('redaction', () => {
  it('masks api keys, jwts and emails in a string', () => {
    expect(redactString('key sk-ABCDEFGHIJKLMNOP1234')).toContain('[redacted:api-key]');
    expect(
      redactString('tok eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV'),
    ).toContain('[redacted:jwt]');
    expect(redactString('mail me@example.com now')).toContain('[redacted:email]');
  });

  it('fully masks values under sensitive keys', () => {
    const out = redactDeep({ apiKey: 'supersecretvalue', nested: { token: 'abc' }, ok: 'visible' }) as Record<string, unknown>;
    expect(out.apiKey).toBe('[redacted]');
    expect((out.nested as Record<string, unknown>).token).toBe('[redacted]');
    expect(out.ok).toBe('visible');
  });

  it('returns undefined for empty metadata', () => {
    expect(redactMetadata(undefined)).toBeUndefined();
    expect(redactMetadata({})).toBeUndefined();
  });
});

describe('access gating — security.manage', () => {
  it('is a registered permission', () => {
    expect(PERMISSIONS).toContain('security.manage');
  });
  it('is held by super_admin and admin, denied to analyst/read_only', () => {
    expect(roleHasPermission('super_admin', 'security.manage')).toBe(true);
    expect(roleHasPermission('admin', 'security.manage')).toBe(true);
    expect(roleHasPermission('analyst', 'security.manage')).toBe(false);
    expect(roleHasPermission('read_only', 'security.manage')).toBe(false);
  });
  it('admin role definition does not silently include admins.manage', () => {
    // Sanity: admin gets everything EXCEPT admins.manage — confirms our
    // permission was added to the shared list without breaking that rule.
    const adminPerms = ROLES.admin.permissions;
    expect(Array.isArray(adminPerms)).toBe(true);
    expect(adminPerms as readonly string[]).toContain('security.manage');
    expect(adminPerms as readonly string[]).not.toContain('admins.manage');
  });
});
