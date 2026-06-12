// P2 — AI observability instrumentation guard.
// The vision route returns non-PII aiMeta (provider/model/latency); the client
// attaches it (plus confidence) to ANALYSIS_COMPLETED and a coarse error_code to
// ANALYSIS_FAILED, so PostHog can chart AI latency, provider mix, confidence, and
// failure causes. This tests the pure classifier and statically guards the wiring
// (the app has no React render-test setup — same approach as funnel-instrumentation).

import { readFileSync } from 'fs';
import { join } from 'path';
import { classifyAnalysisError } from '../analysis-error';

describe('classifyAnalysisError (P2)', () => {
  it.each([
    ['Analysis cancelled.', 'cancelled'],
    ['The operation was aborted', 'cancelled'],
    ['TypeError: Failed to fetch', 'network'],
    ['Could not reach the AI vision provider', 'network'],
    ['Request timed out after 60s', 'timeout'],
    ['Rate limited (429)', 'rate_limited'],
    ['Frame payload too large (413)', 'payload_too_large'],
    ['SwingVantage could not complete the AI analysis', 'provider_error'],
    ['Some other weird failure', 'error'],
  ])('classifies %j as %s', (input, expected) => {
    expect(classifyAnalysisError(input)).toBe(expected);
  });

  it('returns "unknown" for empty/missing input', () => {
    expect(classifyAnalysisError(undefined)).toBe('unknown');
    expect(classifyAnalysisError(null)).toBe('unknown');
    expect(classifyAnalysisError('')).toBe('unknown');
  });
});

const read = (rel: string) => readFileSync(join(__dirname, rel), 'utf8');

describe('AI observability wiring is present (guards against removal)', () => {
  it('the vision route returns non-PII aiMeta + an errorCode on failure', () => {
    const route = read('../../../app/api/video-vision-analysis/route.ts');
    expect(route).toContain('aiMeta');
    expect(route).toContain('provider: provider.id');
    expect(route).toContain('classifyProviderError');
  });

  it('run-analysis threads aiMeta from the response into the result', () => {
    const run = read('../run-analysis.ts');
    expect(run).toContain('aiMeta');
    expect(run).toContain('AiAnalysisMeta');
  });

  it('useSwingAnalysis attaches AI props + error_code to the funnel events', () => {
    const hook = read('../useSwingAnalysis.ts');
    expect(hook).toContain('ai_provider');
    expect(hook).toContain('ai_latency_ms');
    expect(hook).toContain('ai_confidence');
    expect(hook).toContain('error_code');
    expect(hook).toContain('classifyAnalysisError');
  });
});
