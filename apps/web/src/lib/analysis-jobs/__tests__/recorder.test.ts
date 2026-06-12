// Recorder bridge tests — verifies an analysis run is mirrored onto a job.
// The flag store is mocked so recording is deterministically enabled and the
// test stays isolated from the admin flag/analytics modules.

jest.mock('@/lib/admin/stores/feature-flags', () => ({ isFlagEnabled: () => true }));

import {
  beginAnalysisJob,
  recordedSink,
  finishAnalysisJob,
  failAnalysisJob,
} from '../recorder';
import { clearJobs, loadJobs } from '../store';
import type { AnalysisProgressSink, SwingAnalysisResult } from '@/lib/video/run-analysis';

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
  g.window = { localStorage: localStorageMock, addEventListener: () => {}, removeEventListener: () => {} };
  g.localStorage = localStorageMock;
  g.StorageEvent = class { type: string; constructor(t: string) { this.type = t; } };
});

beforeEach(() => {
  localStorageMock.clear();
  clearJobs();
});

const input = {
  sport: 'tennis' as const,
  sportLabel: 'Tennis',
  declaredCameraAngle: 'face-on',
  comparedToPrevious: true,
};

function baseSink(): AnalysisProgressSink {
  return { setStage: () => {}, setProgress: () => {} };
}

describe('analysis-jobs recorder', () => {
  it('opens a job and mirrors stages reported through the wrapped sink', () => {
    const jobId = beginAnalysisJob(input);
    expect(jobId).toBeTruthy();

    const sink = recordedSink(jobId, baseSink());
    sink.setStage('extracting');
    sink.setStage('inspecting');

    const job = loadJobs()[0];
    expect(job.status).toBe('analyzing');
    expect(job.comparedToPrevious).toBe(true);
  });

  it('delegates to the original sink (does not swallow its calls)', () => {
    const calls: string[] = [];
    const sink = recordedSink(beginAnalysisJob(input), {
      setStage: (s) => calls.push(s),
      setProgress: () => {},
    });
    sink.setStage('measuring');
    expect(calls).toEqual(['measuring']);
  });

  it('finishes a successful analysis as completed with provider trace', () => {
    const jobId = beginAnalysisJob(input);
    const result = {
      analysis: { overallConfidence: 0.77 },
      notConfiguredMessage: null,
      savedRecord: { id: 'va_42' },
      aiMeta: { provider: 'gemini', model: 'gemini-x', latencyMs: 900 },
    } as unknown as SwingAnalysisResult;

    finishAnalysisJob(jobId, result);
    const job = loadJobs()[0];
    expect(job.status).toBe('completed');
    expect(job.confidenceScore).toBe(0.77);
    expect(job.provider).toBe('gemini');
    expect(job.savedAnalysisId).toBe('va_42');
  });

  it('finishes a keyless analysis as not_configured', () => {
    const jobId = beginAnalysisJob(input);
    const result = {
      analysis: null,
      notConfiguredMessage: 'no key',
      savedRecord: null,
      aiMeta: null,
    } as unknown as SwingAnalysisResult;
    finishAnalysisJob(jobId, result);
    expect(loadJobs()[0].status).toBe('not_configured');
  });

  it('maps an abort to cancelled and any other error to failed', () => {
    const a = beginAnalysisJob(input);
    failAnalysisJob(a, new DOMException('stopped', 'AbortError'));
    expect(loadJobs().find((j) => j.id === a)?.status).toBe('cancelled');

    const b = beginAnalysisJob(input);
    failAnalysisJob(b, new Error('boom'));
    const failed = loadJobs().find((j) => j.id === b);
    expect(failed?.status).toBe('failed');
    expect(failed?.failureReason).toBe('boom');
  });

  it('is a no-op when there is no job id (recording disabled path)', () => {
    const sink = recordedSink(null, baseSink());
    expect(() => sink.setStage('done')).not.toThrow();
    finishAnalysisJob(null, {} as SwingAnalysisResult);
    failAnalysisJob(null, new Error('x'));
    expect(loadJobs()).toHaveLength(0);
  });
});
