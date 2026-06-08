// ============================================================
// Analytics OS — public barrel (client-safe)
// ------------------------------------------------------------
// Re-exports the pieces that are safe to import from anywhere. The
// server-only API client (client.ts) and the secret-reading getReadConfig
// are intentionally NOT exported here — import those directly in server
// code (the API route) so they can never be pulled into a client bundle.
// ============================================================

export * from './types';
export {
  POSTHOG_DEFAULT_HOST,
  resolvePostHogHosts,
  maskKey,
  getIngestConfig,
  connectionLevel,
  getConnection,
  buildPostHogUrl,
  type Env,
} from './config';
export {
  CAPABILITY_GROUPS,
  POSTHOG_CAPABILITIES,
  CAPABILITY_COUNT,
} from './capabilities';
export {
  KEY_FUNNELS,
  resolveCapabilityState,
  resolveCoverage,
  buildAnalyticsOsDashboard,
} from './dashboard';
