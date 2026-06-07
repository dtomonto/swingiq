// ============================================================
// SwingVantage — Motion Lab: AI coach narrative tests
// ------------------------------------------------------------
// The narrative must be GROUNDED (real numbers, no invention), follow
// the 8-part format, degrade gracefully, and stay deterministic when
// the LLM enhancer is off (the default).
// ============================================================

import { buildMotionCoachNarrative, narrateMotionSession } from '../coach-narrative';
import type { MotionSession } from '../types';

function fullSession(): MotionSession {
  return {
    capture: { sport: 'golf' },
    sportLabel: 'Golf',
    poseTrack: { basis: 'estimated' },
    scoreboard: { overall: 64, confidence: 0.6 },
    metrics: [
      { id: 'hip_shoulder_sep', name: 'X-Factor', value: 28, unit: '°', normalizedScore: 40, confidence: 0.6, whyItMatters: 'Separation is the engine of speed.', recommendedFix: 'Let the hips start down first.' },
      { id: 'tempo_ratio', name: 'Tempo', value: 3.1, unit: ':1', normalizedScore: 80, confidence: 0.6, whyItMatters: 'Tempo syncs the swing.', recommendedFix: 'Smooth one-two-three.' },
    ],
    kineticChain: { comparableLinks: 3, sequenceQuality: 60, powerLeakFlags: [{ id: 'upper_body_first', label: 'Upper body leads', detail: '', severity: 'high' }], recommendedFocus: 'Start from the ground up — lead hip clears first.' },
    temporal: { summary: 'Transition looks a touch rushed.', confidence: 0.6 },
    objectTracking: { available: true, implement: 'club', swingPath: { approach: 'ascending' }, confidence: 0.4 },
    report: {
      diagnosis: 'Upper body unwinds early.',
      rootCause: 'Sequence starts from the top, not the ground.',
      topFixes: [{ title: 'Sequence from the ground', problem: 'Your shoulders open before your lower body.' }],
    },
    drills: {
      immediate: { name: 'Step-through drill', problemItSolves: 'teaches ground-up sequence', estimatedMinutes: 8, successCue: 'Feel the lead hip clear first.' },
    },
  } as unknown as MotionSession;
}

describe('buildMotionCoachNarrative', () => {
  it('produces all 8 grounded sections from the top fix and weakest metric', () => {
    const n = buildMotionCoachNarrative(fullSession());
    expect(n.source).toBe('local');
    expect(n.mainFinding).toContain('Sequence from the ground');
    // weakest metric is the lowest-scored (X-Factor @ 40)
    expect(n.whyItMatters).toContain('engine of speed');
    expect(n.nextUpload.toLowerCase()).toContain('x-factor');
  });

  it('grounds the evidence in real numbers (no invention)', () => {
    const n = buildMotionCoachNarrative(fullSession());
    expect(n.evidence).toContain('64/100'); // overall
    expect(n.evidence).toContain('60/100'); // kinetic sequence
    expect(n.evidence).toContain('28°'); // weakest metric value
    expect(n.evidence.toLowerCase()).toContain('ascending'); // implement path read
  });

  it('assembles the full 8-part text', () => {
    const n = buildMotionCoachNarrative(fullSession());
    for (const label of ['Main finding:', 'Why it matters:', 'Evidence:', 'What it may cause:', 'What to feel:', 'One cue:', 'One drill:', 'Next upload:']) {
      expect(n.fullText).toContain(label);
    }
    expect(n.drill).toContain('Step-through drill');
  });

  it('degrades gracefully on a sparse session (never throws)', () => {
    const sparse = {
      capture: { sport: 'tennis' },
      sportLabel: 'Tennis',
      poseTrack: { basis: 'estimated' },
      scoreboard: { overall: 50, confidence: 0.4 },
    } as unknown as MotionSession;
    const n = buildMotionCoachNarrative(sparse);
    expect(n.fullText).toContain('Main finding:');
    expect(n.fullText).toContain('Next upload:');
    expect(n.mainFinding.length).toBeGreaterThan(0);
  });
});

describe('narrateMotionSession', () => {
  it('stays deterministic (source local) when the LLM enhancer is off', async () => {
    const n = await narrateMotionSession(fullSession());
    expect(n.source).toBe('local');
    expect(n.fullText).toContain('Main finding:');
  });
});
