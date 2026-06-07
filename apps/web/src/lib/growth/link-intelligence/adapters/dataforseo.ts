// ============================================================
// Adapter: DataForSEO (affordable backlink + SERP data seam).
// Env: DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD. Scaffold only.
// ============================================================

import type { SeoProvider } from './contract';
import { hasEnv, scaffoldResult } from './contract';

const ENV = ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'];

export const dataForSeoProvider: SeoProvider = {
  id: 'dataforseo',
  label: 'DataForSEO',
  envVars: ENV,
  configured: (env) => hasEnv(env, ENV),
  fetchBacklinks: async (env) => scaffoldResult(dataForSeoProvider.configured(env), 'DataForSEO', ENV),
  fetchCompetitorBacklinks: async (env) => scaffoldResult(dataForSeoProvider.configured(env), 'DataForSEO', ENV),
};
