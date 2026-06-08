// Admin Copilot — pure engine unit tests.
// Verifies intent routing and that every answer is GROUNDED in the
// snapshot, honest when data is missing, read-only (never needs
// approval), and computed (keyless) by default.

import { resolveIntent, COPILOT_INTENTS } from '../copilot/questions';
import { answerCopilotQuestion, answerCopilotIntent } from '../copilot/engine';
import type { CopilotSnapshot } from '../copilot/types';

function makeSnapshot(overrides: Partial<CopilotSnapshot> = {}): CopilotSnapshot {
  return {
    generatedAt: '2026-06-08T00:00:00.000Z',
    connected: true,
    counts: {
      authUsers: 1200,
      golfProfiles: 800,
      sportProfiles: 300,
      sessions: 5000,
      analyses: 1400,
      community: 200,
    },
    authUsersCapped: false,
    sportUsage: [
      { sport: 'golf', sessions: 3000 },
      { sport: 'tennis', sessions: 1500 },
      { sport: 'pickleball', sessions: 500 },
    ],
    integrations: [
      { id: 'supabase', name: 'Supabase', connected: true },
      { id: 'ai-vision', name: 'AI Swing Vision', connected: true },
    ],
    capabilities: {
      auth: true, aiVision: true, aiCoach: true, ocr: true, email: true, billing: false, ads: false, auditAccess: false,
    },
    alerts: [],
    actions: [],
    featureEducation: { features: 40, gaps: 0, drift: 0, needsReview: 0 },
    sections: { built: 50, total: 50, soon: [] },
    ...overrides,
  };
}

describe('resolveIntent', () => {
  it('routes representative phrasings to the right intent', () => {
    expect(resolveIntent('what should I improve next?')).toBe('next-best-action');
    expect(resolveIntent('which sport is most active')).toBe('fastest-sport');
    expect(resolveIntent('what needs my attention in the inbox')).toBe('urgent-tasks');
    expect(resolveIntent('which AI outputs need review')).toBe('ai-review-queue');
    expect(resolveIntent('any errors or outages?')).toBe('recent-errors');
    expect(resolveIntent('what content gaps exist')).toBe('content-gaps');
    expect(resolveIntent('what is central intelligence learning')).toBe('central-intelligence');
  });

  it('falls back to help on empty or unmatched input', () => {
    expect(resolveIntent('')).toBe('help');
    expect(resolveIntent('asdfqwer zzz')).toBe('help');
  });

  it('every registered intent has a canonical question and keywords', () => {
    for (const def of COPILOT_INTENTS) {
      expect(def.question.length).toBeGreaterThan(0);
      expect(def.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe('answerCopilotQuestion — invariants', () => {
  it('every answer is read-only and computed by default', () => {
    const snap = makeSnapshot();
    for (const def of COPILOT_INTENTS) {
      const ans = answerCopilotIntent(snap, def.id);
      expect(ans.needsApproval).toBe(false);
      expect(ans.generatedBy).toBe('computed');
      expect(ans.title.length).toBeGreaterThan(0);
      expect(ans.summary.length).toBeGreaterThan(0);
      // every suggested action points at a built route
      for (const a of ans.actions) expect(a.built).toBe(true);
    }
  });
});

describe('system-overview', () => {
  it('reports real counts when connected', () => {
    const ans = answerCopilotIntent(makeSnapshot(), 'system-overview');
    expect(ans.summary).toContain('1,200');
    expect(ans.confidence).toBe('high');
    expect(ans.caveat).toBeUndefined();
  });

  it('is honest and low-confidence when not connected', () => {
    const ans = answerCopilotIntent(
      makeSnapshot({ connected: false, connectReason: 'Service role not set.' }),
      'system-overview',
    );
    expect(ans.confidence).toBe('low');
    expect(ans.caveat).toBe('Service role not set.');
    expect(ans.actions.some((a) => a.href === '/admin/integrations')).toBe(true);
  });
});

describe('fastest-sport', () => {
  it('ranks the top sport with a share %', () => {
    const ans = answerCopilotIntent(makeSnapshot(), 'fastest-sport');
    expect(ans.summary).toContain('Golf');
    expect(ans.summary).toContain('60%'); // 3000 / 5000
    expect(ans.bullets[0]).toContain('Golf');
  });

  it('is honest when there is no session data', () => {
    const ans = answerCopilotIntent(makeSnapshot({ sportUsage: [] }), 'fastest-sport');
    expect(ans.confidence).toBe('low');
    expect(ans.caveat).toBeTruthy();
  });
});

describe('urgent-tasks & next-best-action', () => {
  const withWork = makeSnapshot({
    alerts: [
      { id: 'a1', severity: 'warning', title: 'AI vision off', detail: 'Connect a provider.', href: '/admin/integrations' },
    ],
    actions: [
      { id: 'fe', sourceLabel: 'Feature Education', title: '3 drafts await review', severity: 'critical', count: 3, href: '/admin/feature-education' },
      { id: 'audit', sourceLabel: 'Audits', title: '2 SEO findings', severity: 'info', count: 2, href: '/admin/audits' },
    ],
  });

  it('urgent-tasks totals and orders inbox items by severity', () => {
    const ans = answerCopilotIntent(withWork, 'urgent-tasks');
    expect(ans.summary).toContain('5 item'); // 3 + 2
    expect(ans.bullets[0]).toContain('await review'); // critical first
  });

  it('urgent-tasks says the inbox is clear when empty', () => {
    const ans = answerCopilotIntent(makeSnapshot(), 'urgent-tasks');
    expect(ans.summary.toLowerCase()).toContain('clear');
  });

  it('next-best-action surfaces the most severe item first', () => {
    const ans = answerCopilotIntent(withWork, 'next-best-action');
    expect(ans.summary).toContain('3 drafts await review'); // critical wins
    expect(ans.confidence).toBe('high');
  });

  it('next-best-action goes offensive when nothing is urgent', () => {
    const ans = answerCopilotIntent(makeSnapshot(), 'next-best-action');
    expect(ans.confidence).toBe('medium');
    expect(ans.summary.toLowerCase()).toContain('nothing');
  });
});

describe('content-gaps & recent-errors', () => {
  it('content-gaps reports feature-education counts', () => {
    const ans = answerCopilotIntent(makeSnapshot({ featureEducation: { features: 40, gaps: 4, drift: 1, needsReview: 2 } }), 'content-gaps');
    expect(ans.summary).toContain('4');
    expect(ans.confidence).toBe('high');
  });

  it('recent-errors lists disconnected integrations', () => {
    const ans = answerCopilotIntent(
      makeSnapshot({ integrations: [{ id: 'email', name: 'Email', connected: false }] }),
      'recent-errors',
    );
    expect(ans.bullets.some((b) => b.includes('Email'))).toBe(true);
  });

  it('recent-errors is reassuring when all connected', () => {
    const ans = answerCopilotIntent(makeSnapshot(), 'recent-errors');
    expect(ans.bullets.length).toBe(0);
    expect(ans.confidence).toBe('high');
  });
});

describe('help fallback', () => {
  it('lists the catalogue of questions', () => {
    const ans = answerCopilotQuestion(makeSnapshot(), 'tell me a joke');
    expect(ans.intent).toBe('help');
    expect(ans.bullets.length).toBeGreaterThan(5);
  });
});
