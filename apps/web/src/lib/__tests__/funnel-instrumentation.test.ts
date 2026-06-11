// ============================================================
// Core-funnel instrumentation guard.
//
// The product's north-star metric ("Weekly Completed Improvement Loops") can
// only be measured if the core journey actually emits events: upload → analysis
// → #1 fix → account. These events were defined in the registry long before they
// were wired, so a provider key alone measured nothing. This guard fails loudly
// if any of that wiring is removed or an event constant is renamed away from it.
//
// It is a node-only static check (the app has no React render-test setup), so it
// asserts the wiring exists in source rather than rendering components.
// ============================================================
import { readFileSync } from 'fs';
import { join } from 'path';
import { ANALYTICS_EVENTS } from '@swingiq/core';

type EventKey = keyof typeof ANALYTICS_EVENTS;

// File (relative to this test) → the funnel events it is responsible for firing.
const FUNNEL_WIRING: Array<{ file: string; events: EventKey[] }> = [
  {
    // The single upload widget every sport's analyzer routes through.
    file: '../../components/video/VideoUpload.tsx',
    events: ['VIDEO_UPLOAD_STARTED', 'VIDEO_UPLOAD_COMPLETED', 'VIDEO_UPLOAD_FAILED'],
  },
  {
    // Shared analysis hook (golf + all other sports go through it).
    file: '../video/useSwingAnalysis.ts',
    events: ['ANALYSIS_STARTED', 'ANALYSIS_COMPLETED', 'ANALYSIS_FAILED'],
  },
  {
    // The panel that renders the #1 fix — the core value moment.
    file: '../../components/video/AIVisualAnalysisPanel.tsx',
    events: ['PRIORITY_FIX_VIEWED'],
  },
  {
    // Bottom-of-funnel conversion.
    file: '../../app/(auth)/signup/SignupForm.tsx',
    events: ['ACCOUNT_CREATED'],
  },
  {
    // The loop CLOSES — a completed retest result is surfaced (north-star).
    file: '../../components/retest/RetestResultCard.tsx',
    events: ['RETEST_COMPLETED'],
  },
];

const read = (rel: string) => readFileSync(join(__dirname, rel), 'utf8');

describe('core funnel instrumentation', () => {
  it.each(FUNNEL_WIRING)('$file emits its funnel events through track()', ({ file, events }) => {
    const src = read(file);
    for (const ev of events) {
      // 1) the registry constant must still exist (catches renames/removals)…
      expect(ANALYTICS_EVENTS[ev]).toBeTruthy();
      // 2) …and the responsible file must reference it.
      expect(src).toContain(`ANALYTICS_EVENTS.${ev}`);
    }
  });

  it('routes every funnel event through the shared analytics helper', () => {
    for (const { file } of FUNNEL_WIRING) {
      expect(read(file)).toMatch(/from '@\/lib\/analytics'/);
    }
  });

  it('keeps the funnel invariant: a completed/failed event for every start', () => {
    // Started has a terminal counterpart so conversion math (completed ≤ started)
    // stays meaningful end-to-end.
    expect(ANALYTICS_EVENTS.VIDEO_UPLOAD_STARTED).toBeTruthy();
    expect(ANALYTICS_EVENTS.VIDEO_UPLOAD_COMPLETED).toBeTruthy();
    expect(ANALYTICS_EVENTS.VIDEO_UPLOAD_FAILED).toBeTruthy();
    expect(ANALYTICS_EVENTS.ANALYSIS_STARTED).toBeTruthy();
    expect(ANALYTICS_EVENTS.ANALYSIS_COMPLETED).toBeTruthy();
    expect(ANALYTICS_EVENTS.ANALYSIS_FAILED).toBeTruthy();
  });

  it('exposes the "do our fixes work?" acceptance/outcome events (audit P2)', () => {
    expect(ANALYTICS_EVENTS.RECOMMENDATION_ACCEPTED).toBe('recommendation_accepted');
    expect(ANALYTICS_EVENTS.RECOMMENDATION_DISMISSED).toBe('recommendation_dismissed');
    expect(ANALYTICS_EVENTS.DRILL_FEEDBACK_RECORDED).toBe('drill_feedback_recorded');
  });
});
