// Device store tests — node env with a tiny in-memory localStorage polyfill
// (same pattern as bodysync/store.test.ts), so no jsdom dependency is needed.

import {
  advanceJob,
  cancelJob,
  clearJobs,
  completeJob,
  computeStats,
  createJob,
  deleteJob,
  failJob,
  loadJobs,
  requestRerun,
  setAdminNotes,
  setHumanReview,
} from '../store';
import { LOW_CONFIDENCE_REVIEW_THRESHOLD } from '../lifecycle';

// ── minimal window + localStorage polyfill ──
const mem: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => (k in mem ? mem[k] : null),
  setItem: (k: string, v: string) => { mem[k] = String(v); },
  removeItem: (k: string) => { delete mem[k]; },
  clear: () => { for (const k of Object.keys(mem)) delete mem[k]; },
};

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  g.window = {
    localStorage: localStorageMock,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  g.localStorage = localStorageMock;
  g.StorageEvent = class { type: string; constructor(t: string) { this.type = t; } };
});

beforeEach(() => {
  localStorageMock.clear();
  clearJobs();
});

const newInput = {
  sport: 'golf' as const,
  sportLabel: 'Golf',
  emoji: '⛳',
  declaredCameraAngle: 'down-the-line',
  comparedToPrevious: false,
};

describe('analysis-jobs store', () => {
  it('creates a queued job and persists it newest-first', () => {
    const a = createJob(newInput);
    const b = createJob({ ...newInput, sportLabel: 'Golf 2' });
    expect(a?.status).toBe('queued');
    const jobs = loadJobs();
    expect(jobs).toHaveLength(2);
    expect(jobs[0].id).toBe(b?.id); // newest first
  });

  it('advances only through valid transitions (illegal jump is ignored)', () => {
    const job = createJob(newInput)!;
    advanceJob(job.id, 'analyzing');
    expect(loadJobs()[0].status).toBe('analyzing');
    expect(loadJobs()[0].startedAt).not.toBeNull();
    // backward jump is rejected — status stays put
    advanceJob(job.id, 'preparing');
    expect(loadJobs()[0].status).toBe('analyzing');
  });

  it('completes a job with provider trace and marks it completed when confident', () => {
    const job = createJob(newInput)!;
    advanceJob(job.id, 'analyzing');
    completeJob(job.id, {
      confidenceScore: 0.82, provider: 'gemini', model: 'gemini-x',
      latencyMs: 1234, savedAnalysisId: 'va_1', notConfigured: false,
    });
    const done = loadJobs()[0];
    expect(done.status).toBe('completed');
    expect(done.confidenceScore).toBe(0.82);
    expect(done.provider).toBe('gemini');
    expect(done.savedAnalysisId).toBe('va_1');
    expect(done.completedAt).not.toBeNull();
  });

  it('auto-flags low-confidence completions for human review', () => {
    const job = createJob(newInput)!;
    completeJob(job.id, {
      confidenceScore: LOW_CONFIDENCE_REVIEW_THRESHOLD - 0.1, provider: 'openai',
      model: 'gpt', latencyMs: 1, savedAnalysisId: null, notConfigured: false,
    });
    const done = loadJobs()[0];
    expect(done.status).toBe('needs_human_review');
    expect(done.humanReview).toBe('flagged');
  });

  it('marks a keyless run as not_configured (honest, not failed)', () => {
    const job = createJob(newInput)!;
    completeJob(job.id, {
      confidenceScore: null, provider: null, model: null,
      latencyMs: null, savedAnalysisId: null, notConfigured: true,
    });
    expect(loadJobs()[0].status).toBe('not_configured');
  });

  it('fails and cancels active jobs but never overwrites a terminal status', () => {
    const f = createJob(newInput)!;
    advanceJob(f.id, 'analyzing');
    failJob(f.id, 'network blew up');
    expect(loadJobs()[0].status).toBe('failed');
    expect(loadJobs()[0].failureReason).toBe('network blew up');
    // failing again does nothing (already terminal)
    failJob(f.id, 'second');
    expect(loadJobs()[0].failureReason).toBe('network blew up');

    const c = createJob(newInput)!;
    advanceJob(c.id, 'preparing');
    cancelJob(c.id);
    expect(loadJobs().find((j) => j.id === c.id)?.status).toBe('cancelled');
  });

  it('requests a rerun off a finished job and bumps retryCount', () => {
    const job = createJob(newInput)!;
    completeJob(job.id, {
      confidenceScore: 0.9, provider: 'gemini', model: 'm',
      latencyMs: 1, savedAnalysisId: null, notConfigured: false,
    });
    requestRerun(job.id, 'angle was wrong');
    const r = loadJobs()[0];
    expect(r.status).toBe('rerun_requested');
    expect(r.rerunReason).toBe('angle was wrong');
    expect(r.retryCount).toBe(1);
  });

  it('moves a flagged job through the review workflow and back to completed on clear', () => {
    const job = createJob(newInput)!;
    completeJob(job.id, {
      confidenceScore: 0.2, provider: 'openai', model: 'm',
      latencyMs: 1, savedAnalysisId: null, notConfigured: false,
    });
    expect(loadJobs()[0].status).toBe('needs_human_review');
    setHumanReview(job.id, 'in_review');
    expect(loadJobs()[0].humanReview).toBe('in_review');
    setHumanReview(job.id, 'cleared');
    const cleared = loadJobs()[0];
    expect(cleared.humanReview).toBe('cleared');
    expect(cleared.status).toBe('completed');
  });

  it('annotates and deletes jobs', () => {
    const job = createJob(newInput)!;
    setAdminNotes(job.id, '  look again  ');
    expect(loadJobs()[0].adminNotes).toBe('look again');
    deleteJob(job.id);
    expect(loadJobs()).toHaveLength(0);
  });

  it('computeStats summarizes a mixed job list', () => {
    const a = createJob(newInput)!;
    completeJob(a.id, { confidenceScore: 0.9, provider: 'g', model: 'm', latencyMs: 1, savedAnalysisId: null, notConfigured: false });
    const b = createJob(newInput)!;
    advanceJob(b.id, 'analyzing');
    failJob(b.id, 'x');
    const c = createJob(newInput)!;
    advanceJob(c.id, 'extracting_pose');

    const stats = computeStats(loadJobs());
    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.active).toBe(1);
  });
});
