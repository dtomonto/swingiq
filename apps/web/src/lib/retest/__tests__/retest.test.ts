// ============================================================
// SwingIQ — Retest Engine: Unit Tests
// ------------------------------------------------------------
// Protects the window math, the conservative comparison logic
// (it must NOT claim improvement under mismatched conditions),
// and the derivation of targets/results from saved history.
// ============================================================

import type { SavedVideoAnalysis } from '@/lib/video/history';
import { buildWindow, statusFor, compareAnalyses } from '../engine';
import { deriveRetestTargets, deriveRetestResults } from '../targets';
import type { RetestStoreState } from '../types';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const EMPTY_STORE: RetestStoreState = {
  version: 1,
  dismissedTargetIds: [],
  acknowledgedResultIds: [],
};

function makeAnalysis(o: {
  id?: string;
  sport?: SavedVideoAnalysis['sport'];
  createdAt?: string;
  topFocus?: string;
  priorities?: string[];
  declaredCameraAngle?: string;
  visibilityQuality?: string;
  overallConfidence?: number;
}): SavedVideoAnalysis {
  const priorities = (o.priorities ?? [o.topFocus ?? 'Casting — Barrel Drops Early']).map((issue) => ({
    issue,
    whyItMatters: 'x',
    evidenceFromVideo: 'x',
    confidence: 'moderate' as const,
    correctiveFocus: 'x',
  }));
  const vq = o.visibilityQuality ?? 'good';
  const conf = o.overallConfidence ?? 0.7;
  return {
    version: 1,
    id: o.id ?? `va_${Math.random().toString(36).slice(2)}`,
    sport: o.sport ?? 'baseball',
    sportLabel: 'Baseball',
    emoji: '⚾',
    declaredCameraAngle: o.declaredCameraAngle,
    createdAt: o.createdAt ?? new Date().toISOString(),
    topFocus: o.topFocus ?? priorities[0].issue,
    overallConfidence: conf,
    visibilityQuality: vq,
    analysis: {
      summary: 'x',
      whatWasClearlyVisible: ['x'],
      strengths: [],
      videoQuality: {} as never,
      detectedPhases: [],
      topPriorities: priorities,
      practicePlan: [{ name: 'x', purpose: 'x', repsOrDuration: 'x', howToKnowCorrect: 'x' }],
      nextUpload: {} as never,
      overallConfidence: conf,
      visibilityQuality: vq,
      meta: {} as never,
    },
  } as unknown as SavedVideoAnalysis;
}

describe('retest window + status', () => {
  it('builds a window retestBy = diagnosedAt + activeWindowDays', () => {
    const w = buildWindow(daysAgo(0), 7);
    expect(daysAgo(0) <= w.retestBy).toBe(true);
    expect(w.activeWindowDays).toBe(7);
  });

  it('is active when comfortably inside the window', () => {
    const w = buildWindow(daysAgo(1), 7);
    const s = statusFor(w);
    expect(s.status).toBe('active');
    expect(s.daysUntilDue).toBeGreaterThanOrEqual(3);
  });

  it('is due near the end of the window', () => {
    const w = buildWindow(daysAgo(6), 7);
    expect(statusFor(w).status).toBe('due');
  });

  it('is overdue past the window', () => {
    const w = buildWindow(daysAgo(12), 7);
    const s = statusFor(w);
    expect(s.status).toBe('overdue');
    expect(s.daysUntilDue).toBeLessThan(0);
    expect(s.label).toMatch(/overdue/);
  });
});

describe('compareAnalyses — conservative + honest', () => {
  it('reports improvement when prior focus is gone (same conditions)', () => {
    const prev = makeAnalysis({ topFocus: 'Casting — Barrel Drops Early', declaredCameraAngle: 'side' });
    const curr = makeAnalysis({ priorities: ['Hip Rotation Stalling'], declaredCameraAngle: 'side' });
    const c = compareAnalyses(prev, curr);
    expect(c.outcome).toBe('improved');
    expect(c.sameConditionsMet).toBe(true);
    expect(c.confidenceNote).toMatch(/directional/i);
  });

  it('reports persisting when the prior focus is still #1', () => {
    const prev = makeAnalysis({ topFocus: 'Casting', declaredCameraAngle: 'side' });
    const curr = makeAnalysis({ priorities: ['Casting', 'Hip Stall'], declaredCameraAngle: 'side' });
    expect(compareAnalyses(prev, curr).outcome).toBe('persisting');
  });

  it('treats a vanished focus as INCONCLUSIVE when the camera angle changed', () => {
    const prev = makeAnalysis({ topFocus: 'Casting', declaredCameraAngle: 'side' });
    const curr = makeAnalysis({ priorities: ['Hip Stall'], declaredCameraAngle: 'face_on' });
    const c = compareAnalyses(prev, curr);
    expect(c.outcome).toBe('inconclusive');
    expect(c.sameConditionsMet).toBe(false);
    expect(c.cautions.length).toBeGreaterThan(0);
  });

  it('is inconclusive when the latest video is too poor to read', () => {
    const prev = makeAnalysis({ topFocus: 'Casting', declaredCameraAngle: 'side' });
    const curr = makeAnalysis({
      priorities: ['Hip Stall'],
      declaredCameraAngle: 'side',
      visibilityQuality: 'poor',
    });
    expect(compareAnalyses(prev, curr).outcome).toBe('inconclusive');
  });

  it('counts a demotion down the list as improvement (same conditions)', () => {
    const prev = makeAnalysis({ topFocus: 'Casting', declaredCameraAngle: 'side' });
    const curr = makeAnalysis({ priorities: ['Hip Stall', 'Casting'], declaredCameraAngle: 'side' });
    expect(compareAnalyses(prev, curr).outcome).toBe('improved');
  });
});

describe('derivation from saved history', () => {
  it('derives one open target per sport from the latest analysis', () => {
    const history = [
      makeAnalysis({ id: 'b1', sport: 'baseball', createdAt: daysAgo(2) }),
      makeAnalysis({ id: 't1', sport: 'tennis', createdAt: daysAgo(10) }),
    ];
    const targets = deriveRetestTargets(history, EMPTY_STORE);
    expect(targets.length).toBe(2);
    // Tennis (older → overdue) should sort ahead of baseball (active).
    expect(targets[0].sport).toBe('tennis');
    expect(targets[0].status.status).toBe('overdue');
  });

  it('excludes dismissed targets', () => {
    const history = [makeAnalysis({ id: 'b1', sport: 'baseball', createdAt: daysAgo(2) })];
    const store: RetestStoreState = { ...EMPTY_STORE, dismissedTargetIds: ['b1'] };
    expect(deriveRetestTargets(history, store)).toHaveLength(0);
  });

  it('produces a result only when a sport has two analyses', () => {
    const history = [
      makeAnalysis({ id: 'b2', sport: 'baseball', createdAt: daysAgo(1), priorities: ['Hip Stall'] }),
      makeAnalysis({ id: 'b1', sport: 'baseball', createdAt: daysAgo(9), topFocus: 'Casting' }),
      makeAnalysis({ id: 't1', sport: 'tennis', createdAt: daysAgo(3) }),
    ];
    const results = deriveRetestResults(history, EMPTY_STORE);
    expect(results).toHaveLength(1);
    expect(results[0].sport).toBe('baseball');
    expect(results[0].priorFocus).toBe('Casting');
  });

  it('excludes acknowledged results', () => {
    const history = [
      makeAnalysis({ id: 'b2', sport: 'baseball', createdAt: daysAgo(1) }),
      makeAnalysis({ id: 'b1', sport: 'baseball', createdAt: daysAgo(9) }),
    ];
    const store: RetestStoreState = { ...EMPTY_STORE, acknowledgedResultIds: ['b2'] };
    expect(deriveRetestResults(history, store)).toHaveLength(0);
  });
});
