// ============================================================
// SwingVantage — outbound re-engagement decision tests
//
// Covers the part that decides WHO gets an outbound reminder and WHAT — the
// reusable core of the scheduled cron — without any network or database. The
// candidate loader (server enumeration) is intentionally out of scope here; it
// stays a no-op until the server-side prefs/email model exists.
// ============================================================

import type { ActivitySignal, NudgeState } from '../types';
import type { DeliveryResult } from '@/lib/notifications/deliver';
import {
  planOutboundForUser, runReengageBatch, type OutboundCandidate,
} from '../outbound';

const NOW = Date.parse('2026-06-13T15:00:00.000Z');

function state(over: Partial<NudgeState['prefs']> = {}): NudgeState {
  return {
    version: 1,
    prefs: {
      inApp: true, push: false, email: false,
      quietHours: { enabled: false, startHour: 21, endHour: 8 },
      ...over,
    },
    lastShown: {},
    dismissed: {},
    lastAnyAt: null,
  };
}

function signal(over: Partial<ActivitySignal> = {}): ActivitySignal {
  return {
    daysSinceLastActivity: 1, streakDays: 0, streakAtRisk: false,
    hasPendingFix: false, retestDue: false, sessionCount: 5,
    activated: true, sport: 'golf', ...over,
  };
}

const deliveredEmail: DeliveryResult = {
  push: { configured: false, sent: 0, failed: 0, reason: 'no_subscription' },
  email: { sent: true, dryRun: false, provider: 'resend' },
};

describe('planOutboundForUser', () => {
  it('suppresses a user who opted into no outbound channel', () => {
    const plan = planOutboundForUser(
      { userId: 'u', email: 'a@b.com', signal: signal({ retestDue: true }), state: state() },
      { now: NOW },
    );
    expect(plan).toEqual({ action: 'suppress', reason: 'no_outbound_channel' });
  });

  it('sends a retest-due email to an opted-in user with an address', () => {
    const plan = planOutboundForUser(
      { userId: 'u', email: 'a@b.com', signal: signal({ retestDue: true }), state: state({ email: true }) },
      { now: NOW, origin: 'https://swingvantage.com' },
    );
    expect(plan.action).toBe('send');
    if (plan.action !== 'send') return;
    expect(plan.triggerId).toBe('retest_due');
    expect(plan.delivery.email).toBe('a@b.com');
    expect(plan.delivery.url).toBe('https://swingvantage.com/retest');
    expect(plan.delivery.subject).toBeTruthy();
  });

  it('does not attach an email when the user has no address (push only)', () => {
    const plan = planOutboundForUser(
      { userId: 'u', email: null, signal: signal({ retestDue: true }), state: state({ email: true, push: true }) },
      { now: NOW },
    );
    expect(plan.action).toBe('send');
    if (plan.action !== 'send') return;
    expect(plan.delivery.email).toBeNull(); // email opted-in but no address → push only
  });

  it('suppresses a streak-at-risk user who only opted into email (streak is push/in-app only)', () => {
    const plan = planOutboundForUser(
      { userId: 'u', email: 'a@b.com', signal: signal({ streakAtRisk: true, streakDays: 3 }), state: state({ email: true }) },
      { now: NOW },
    );
    expect(plan).toEqual({ action: 'suppress', reason: 'no_nudge_due' });
  });

  it('respects the per-trigger cooldown (recently shown → nothing due)', () => {
    const s = state({ email: true });
    s.lastShown = { retest_due: '2026-06-12T15:00:00.000Z' }; // 1 day ago, cooldown is 3
    const plan = planOutboundForUser(
      { userId: 'u', email: 'a@b.com', signal: signal({ retestDue: true }), state: s },
      { now: NOW },
    );
    expect(plan).toEqual({ action: 'suppress', reason: 'no_nudge_due' });
  });
});

describe('runReengageBatch', () => {
  it('is an honest no-op when outbound is not configured', async () => {
    const deliver = jest.fn();
    const res = await runReengageBatch({
      configured: false,
      loadCandidates: async () => [{ userId: 'u', email: 'a@b.com', signal: signal({ retestDue: true }), state: state({ email: true }) }],
      deliver,
      now: NOW,
    });
    expect(res).toMatchObject({ configured: false, considered: 0, sent: 0, reason: 'outbound_not_configured' });
    expect(deliver).not.toHaveBeenCalled();
  });

  it('delivers to eligible users and tallies suppressions by reason', async () => {
    const candidates: OutboundCandidate[] = [
      { userId: 'send', email: 'a@b.com', signal: signal({ retestDue: true }), state: state({ email: true }) },
      { userId: 'optout', email: 'c@d.com', signal: signal({ retestDue: true }), state: state() },
    ];
    const deliver = jest.fn(async (): Promise<DeliveryResult> => deliveredEmail);
    const res = await runReengageBatch({
      configured: true,
      loadCandidates: async () => candidates,
      deliver,
      now: NOW,
    });
    expect(res.considered).toBe(2);
    expect(res.sent).toBe(1);
    expect(res.suppressed).toEqual({ no_outbound_channel: 1 });
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it('counts a configured-but-nothing-delivered send as delivered_noop', async () => {
    const deliver = jest.fn(async (): Promise<DeliveryResult> => ({
      push: { configured: false, sent: 0, failed: 0, reason: 'no_subscription' },
      email: { sent: false, dryRun: true, provider: 'none' },
    }));
    const res = await runReengageBatch({
      configured: true,
      loadCandidates: async () => [{ userId: 'u', email: 'a@b.com', signal: signal({ retestDue: true }), state: state({ email: true }) }],
      deliver,
      now: NOW,
    });
    expect(res.sent).toBe(0);
    expect(res.suppressed).toEqual({ delivered_noop: 1 });
  });

  it('reports a candidate-load failure honestly', async () => {
    const res = await runReengageBatch({
      configured: true,
      loadCandidates: async () => { throw new Error('db down'); },
      deliver: jest.fn(),
      now: NOW,
    });
    expect(res).toMatchObject({ ok: false, errors: 1, reason: 'load_candidates_failed' });
  });
});
