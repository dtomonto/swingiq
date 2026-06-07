// ============================================================
// Adapter: Google Search Console (rankings/impressions seam).
// Env: GSC_CLIENT_EMAIL + GSC_PRIVATE_KEY (service account) or GSC_ACCESS_TOKEN.
// Scaffold only — returns no rows until a live integration is wired.
// ============================================================

import type { SeoProvider } from './contract';
import { hasEnv, scaffoldResult } from './contract';

const ENV = ['GSC_CLIENT_EMAIL', 'GSC_PRIVATE_KEY'];

export const gscProvider: SeoProvider = {
  id: 'gsc',
  label: 'Google Search Console',
  envVars: ENV,
  configured: (env) => hasEnv(env, ENV) || Boolean(env.GSC_ACCESS_TOKEN),
  fetchBacklinks: async (env) => scaffoldResult(gscProvider.configured(env), 'Search Console', ENV),
  fetchCompetitorBacklinks: async (env) => scaffoldResult(gscProvider.configured(env), 'Search Console', ENV),
};
