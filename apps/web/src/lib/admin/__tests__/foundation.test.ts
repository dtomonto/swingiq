// Wave 1 foundation unit tests — the pure logic behind the admin shell.
// Covers RBAC, the nav model, derived alerts, feature-flag eval, audit
// entry creation and formatting helpers.

import {
  ROLES, PERMISSIONS, roleHasPermission, resolveRoleForEmail, parseAdminRolesEnv,
} from '../rbac';
import {
  NAV_ITEMS, navItemsForRole, isHrefBuilt, activeNavItem,
} from '../nav';
import { deriveAlerts } from '../alerts';
import { FLAG_DEFS, evalFlag, findFlagDef } from '../flags';
import { makeAuditEntry } from '../audit';
import { scoreFixCandidate, classifyFixQuery, recommendFix } from '../generated-fixes';
import { formatNumber, formatRelativeTime, titleize } from '../format';
import type { SystemStatus } from '../data/system';
import type { PlatformMetrics } from '../data/metrics';

describe('rbac', () => {
  it('super_admin has every permission', () => {
    for (const p of PERMISSIONS) {
      expect(roleHasPermission('super_admin', p)).toBe(true);
    }
  });

  it('read_only cannot edit or delete', () => {
    expect(roleHasPermission('read_only', 'analytics.view')).toBe(true);
    expect(roleHasPermission('read_only', 'users.delete')).toBe(false);
    expect(roleHasPermission('read_only', 'content.publish')).toBe(false);
  });

  it('admin has everything except managing admins', () => {
    expect(roleHasPermission('admin', 'admins.manage')).toBe(false);
    expect(roleHasPermission('admin', 'content.publish')).toBe(true);
  });

  it('resolveRoleForEmail falls back to super_admin and matches case-insensitively', () => {
    expect(resolveRoleForEmail(null, [], 'super_admin')).toBe('super_admin');
    expect(
      resolveRoleForEmail('Alice@X.com', [{ email: 'alice@x.com', role: 'analyst' }]),
    ).toBe('analyst');
  });

  it('parseAdminRolesEnv ignores unknown roles and blanks', () => {
    const parsed = parseAdminRolesEnv('a@x.com:analyst, b@x.com:wizard, , c@x.com:');
    expect(parsed).toEqual([{ email: 'a@x.com', role: 'analyst' }]);
  });

  it('every role definition references only known permissions', () => {
    for (const role of Object.values(ROLES)) {
      if (role.permissions === '*') continue;
      for (const p of role.permissions) expect(PERMISSIONS).toContain(p);
    }
  });
});

describe('nav model', () => {
  it('has unique ids and hrefs', () => {
    const ids = NAV_ITEMS.map((i) => i.id);
    const hrefs = NAV_ITEMS.map((i) => i.href);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('filters by role permission', () => {
    const readOnly = navItemsForRole((p) => roleHasPermission('read_only', p));
    expect(readOnly.some((i) => i.id === 'feature-flags')).toBe(false);
    expect(readOnly.some((i) => i.id === 'home')).toBe(true); // no permission required
  });

  it('isHrefBuilt reflects each nav item\'s built flag', () => {
    // Data-driven so this never goes stale as sections flip built status
    // (it previously hard-coded /admin/users as unbuilt; that section shipped).
    for (const item of NAV_ITEMS) {
      expect(isHrefBuilt(item.href)).toBe(item.built);
    }
    // Unknown hrefs are assumed routable so CTAs never gate on a phantom 404.
    expect(isHrefBuilt('/admin/not-a-real-section')).toBe(true);
  });

  it('activeNavItem picks the longest matching prefix', () => {
    expect(activeNavItem('/admin/integrations')?.id).toBe('integrations');
    expect(activeNavItem('/admin')?.id).toBe('home');
  });
});

function systemStub(over: Partial<SystemStatus> = {}): SystemStatus {
  return {
    capabilities: { auth: true, aiCoach: true, aiVision: true, ocr: true, email: true, billing: false, ads: false, auditAccess: false },
    integrations: [
      { id: 'supabase', name: 'Supabase', category: 'Auth & Database', connected: true, detail: '', envVars: [] },
    ],
    connectedCount: 1,
    totalCount: 1,
    nodeEnv: 'test',
    generatedAt: new Date().toISOString(),
    ...over,
  };
}

function metricsStub(over: Partial<PlatformMetrics> = {}): PlatformMetrics {
  return {
    connected: true,
    counts: { golfProfiles: 1, sportProfiles: 1, sessions: 3, analyses: 2, community: 0, authUsers: 4 },
    authUsersCapped: false,
    sportUsage: [{ sport: 'golf', sessions: 3 }],
    recentAnalyses: [],
    ...over,
  };
}

describe('deriveAlerts', () => {
  it('warns when platform data is not connected', () => {
    const alerts = deriveAlerts(systemStub(), metricsStub({ connected: false, sportUsage: [], counts: { golfProfiles: null, sportProfiles: null, sessions: null, analyses: null, community: null, authUsers: null } }));
    expect(alerts.some((a) => a.id === 'no-service-role')).toBe(true);
  });

  it('surfaces the most-used sport as a success when connected', () => {
    const alerts = deriveAlerts(systemStub(), metricsStub());
    const top = alerts.find((a) => a.id === 'top-sport');
    expect(top?.severity).toBe('success');
    expect(top?.title).toMatch(/Golf/);
  });

  it('warns when AI vision is off', () => {
    const sys = systemStub({ capabilities: { auth: true, aiCoach: true, aiVision: false, ocr: true, email: true, billing: false, ads: false, auditAccess: false } });
    expect(deriveAlerts(sys, metricsStub()).some((a) => a.id === 'no-ai-vision')).toBe(true);
  });
});

describe('feature flags', () => {
  it('evalFlag uses default when no override', () => {
    const def = FLAG_DEFS[0];
    expect(evalFlag(def, undefined)).toBe(def.defaultEnabled);
  });

  it('evalFlag respects an override', () => {
    const def = findFlagDef('ai.autopublish_fixes')!;
    expect(def.defaultEnabled).toBe(false);
    expect(evalFlag(def, { enabled: true, rolloutPct: 100, segments: [], updatedAt: '', updatedBy: 't' })).toBe(true);
  });
});

describe('generated-fix relevance gate', () => {
  it('classifies a sport + fix-intent query', () => {
    const c = classifyFixQuery('how to fix a golf slice');
    expect(c.sport).toBe('golf');
    expect(c.hasFixIntent).toBe(true);
    expect(c.isUnsafe).toBe(false);
  });

  it('rejects unsafe medical queries', () => {
    const s = scoreFixCandidate('my elbow pain after golf surgery');
    expect(s.safetyRisk).toBeGreaterThanOrEqual(70);
    expect(recommendFix(s).action).toBe('reject');
  });

  it('rejects off-topic queries', () => {
    expect(recommendFix(scoreFixCandidate('best pizza near me')).action).toBe('reject');
  });

  it('approves a strong, distinct fix opportunity', () => {
    const s = scoreFixCandidate('how to stop topping the golf ball', { existingKeywords: [] });
    expect(s.relevance).toBeGreaterThanOrEqual(70);
    expect(recommendFix(s).action).toBe('approve');
  });

  it('flags near-duplicates for review', () => {
    const s = scoreFixCandidate('how to fix a golf slice', { existingKeywords: ['how to fix a golf slice'] });
    expect(s.duplication).toBeGreaterThanOrEqual(70);
    expect(recommendFix(s).action).toBe('review');
  });
});

describe('audit + format helpers', () => {
  it('makeAuditEntry fills id, timestamp and default severity', () => {
    const e = makeAuditEntry({ actor: 'a@x.com', action: 'flag.toggle', entityType: 'feature-flag', summary: 'x' });
    expect(e.id).toMatch(/^aud_/);
    expect(e.severity).toBe('info');
    expect(Number.isNaN(Date.parse(e.at))).toBe(false);
  });

  it('formatNumber shows an em-dash for null', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(1234)).toBe('1,234');
  });

  it('formatRelativeTime and titleize behave', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now');
    expect(titleize('softball_slow')).toBe('Softball Slow');
  });
});
