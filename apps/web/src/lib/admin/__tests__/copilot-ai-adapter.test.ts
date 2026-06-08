// Copilot AI adapter — pure-logic tests (no network).
// Covers the budget kill-switch and the model-output merge that keeps the
// answer grounded (links/sources preserved, only prose refined).

import { buildEnhancedAnswer, copilotAiBudgetEnabled } from '../copilot/ai-adapter';
import type { CopilotAnswer } from '../copilot/types';

const computed: CopilotAnswer = {
  intent: 'next-best-action',
  title: 'Your next best action',
  summary: 'Start here: 3 drafts await review.',
  bullets: ['CRITICAL — 3 drafts await review'],
  sources: [{ label: 'Action Center', href: '/admin/approvals' }],
  actions: [{ label: 'Handle it', href: '/admin/feature-education', built: true }],
  confidence: 'high',
  generatedBy: 'computed',
  needsApproval: false,
};

describe('copilotAiBudgetEnabled', () => {
  const orig = process.env.AI_DAILY_BUDGET_CENTS;
  afterEach(() => { process.env.AI_DAILY_BUDGET_CENTS = orig; });

  it('is off when unset or zero', () => {
    delete process.env.AI_DAILY_BUDGET_CENTS;
    expect(copilotAiBudgetEnabled()).toBe(false);
    process.env.AI_DAILY_BUDGET_CENTS = '0';
    expect(copilotAiBudgetEnabled()).toBe(false);
  });
  it('is on when a positive budget is set', () => {
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    expect(copilotAiBudgetEnabled()).toBe(true);
  });
});

describe('buildEnhancedAnswer', () => {
  it('merges valid model JSON, preserving grounded fields', () => {
    const out = buildEnhancedAnswer(computed, '{"summary":"Review the 3 drafts first.","bullets":["3 drafts waiting","Open the inbox"]}');
    expect(out).not.toBeNull();
    expect(out!.summary).toBe('Review the 3 drafts first.');
    expect(out!.bullets).toEqual(['3 drafts waiting', 'Open the inbox']);
    expect(out!.generatedBy).toBe('ai');
    expect(out!.needsApproval).toBe(false);
    // grounded fields are untouched
    expect(out!.actions).toEqual(computed.actions);
    expect(out!.sources).toEqual(computed.sources);
    expect(out!.intent).toBe(computed.intent);
    expect(out!.caveat).toContain('verify before acting');
  });

  it('tolerates code fences / surrounding prose', () => {
    const out = buildEnhancedAnswer(computed, 'Sure!\n```json\n{"summary":"Do X.","bullets":[]}\n```');
    expect(out).not.toBeNull();
    expect(out!.summary).toBe('Do X.');
  });

  it('keeps computed bullets when model omits a valid array', () => {
    const out = buildEnhancedAnswer(computed, '{"summary":"Only a summary."}');
    expect(out!.bullets).toEqual(computed.bullets);
  });

  it('returns null on unparseable output or missing summary', () => {
    expect(buildEnhancedAnswer(computed, 'no json here')).toBeNull();
    expect(buildEnhancedAnswer(computed, '{"bullets":["x"]}')).toBeNull();
  });
});
