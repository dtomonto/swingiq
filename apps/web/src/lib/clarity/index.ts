// ============================================================
// Clarity OS — public barrel (client-safe)
// ------------------------------------------------------------
// Re-exports the pieces that are safe to import from anywhere. The
// server-only API client (client.ts) and the secret-reading getReadConfig
// are intentionally NOT exported here — import those directly in server
// code (the API route) so they can never be pulled into a client bundle.
// ============================================================

export * from './types';
export {
  CLARITY_APP_BASE,
  maskKey,
  getIngestConfig,
  connectionLevel,
  getConnection,
  buildClarityUrl,
  type Env,
} from './config';
export {
  CAPABILITY_GROUPS,
  CLARITY_CAPABILITIES,
  CAPABILITY_COUNT,
  SIGNAL_CATALOG,
  CLARITY_DIMENSIONS,
} from './capabilities';
export {
  resolveCapabilityState,
  resolveCoverage,
  buildClarityOsDashboard,
} from './dashboard';
