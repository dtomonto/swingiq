// ============================================================
// Analysis failure classification (P2 AI / upload reliability)
// ------------------------------------------------------------
// Pure helper, kept dependency-free so it can be unit-tested without the
// useSwingAnalysis hook's React/background-task tree. Maps a raw failure
// message to a coarse, non-PII `error_code` so the ANALYSIS_FAILED funnel can
// be split by cause in PostHog without ever sending raw error strings.
// ============================================================

export type AnalysisErrorCode =
  | 'cancelled'
  | 'network'
  | 'timeout'
  | 'rate_limited'
  | 'payload_too_large'
  | 'provider_error'
  | 'error'
  | 'unknown';

export function classifyAnalysisError(reason?: string | null): AnalysisErrorCode {
  const r = (reason ?? '').toLowerCase();
  if (!r) return 'unknown';
  if (r.includes('cancel') || r.includes('abort')) return 'cancelled';
  if (r.includes('failed to fetch') || r.includes('network') || r.includes('reach')) return 'network';
  if (r.includes('timeout') || r.includes('timed out')) return 'timeout';
  if (r.includes('429') || r.includes('rate')) return 'rate_limited';
  if (r.includes('413') || r.includes('too large')) return 'payload_too_large';
  if (r.includes('502') || r.includes('could not complete')) return 'provider_error';
  return 'error';
}
