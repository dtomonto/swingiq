// SignalRadar OS — alert-rule tests (pure, deterministic).

import { applyAlertRules, summarizeAlerts } from '../alerts';
import { DEFAULT_CONFIG } from '../config';
import type { SignalNotification } from '../types';

const NOTES: SignalNotification[] = [
  { id: 'a', kind: 'high_priority', severity: 'critical', title: 'crit', detail: '' },
  { id: 'b', kind: 'backlink_opportunity', severity: 'medium', title: 'bl', detail: '' },
  { id: 'c', kind: 'sport_spike', severity: 'low', title: 'spike', detail: '' },
  { id: 'd', kind: 'bug_complaint', severity: 'high', title: 'bug', detail: '' },
];

describe('applyAlertRules', () => {
  it('passes everything through with the permissive defaults', () => {
    const out = applyAlertRules(NOTES, { alertMinSeverity: 'low', mutedAlertKinds: [] });
    expect(out).toHaveLength(4);
  });

  it('respects a minimum severity threshold', () => {
    const out = applyAlertRules(NOTES, { alertMinSeverity: 'high', mutedAlertKinds: [] });
    expect(out.map((n) => n.id).sort()).toEqual(['a', 'd']); // critical + high
  });

  it('mutes specific kinds', () => {
    const out = applyAlertRules(NOTES, { alertMinSeverity: 'low', mutedAlertKinds: ['sport_spike', 'backlink_opportunity'] });
    expect(out.map((n) => n.id).sort()).toEqual(['a', 'd']);
  });

  it('combines threshold + muting', () => {
    const out = applyAlertRules(NOTES, { alertMinSeverity: 'medium', mutedAlertKinds: ['high_priority'] });
    expect(out.map((n) => n.id).sort()).toEqual(['b', 'd']); // medium+high, minus muted critical
  });

  it('summarizes by severity', () => {
    const s = summarizeAlerts(NOTES);
    expect(s).toEqual({ total: 4, critical: 1, high: 1, medium: 1, low: 1 });
  });
});

describe('config defaults', () => {
  it('ships permissive alert defaults (everything fires)', () => {
    expect(DEFAULT_CONFIG.alertMinSeverity).toBe('low');
    expect(DEFAULT_CONFIG.mutedAlertKinds).toEqual([]);
  });
});
