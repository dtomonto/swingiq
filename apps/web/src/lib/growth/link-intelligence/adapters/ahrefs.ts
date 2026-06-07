// ============================================================
// Adapter: Ahrefs (backlink profile + competitor backlinks seam).
// Env: AHREFS_API_KEY. Scaffold only until a live integration is wired.
// ============================================================

import type { SeoProvider } from './contract';
import { hasEnv, scaffoldResult } from './contract';

const ENV = ['AHREFS_API_KEY'];

export const ahrefsProvider: SeoProvider = {
  id: 'ahrefs',
  label: 'Ahrefs',
  envVars: ENV,
  configured: (env) => hasEnv(env, ENV),
  fetchBacklinks: async (env) => scaffoldResult(ahrefsProvider.configured(env), 'Ahrefs', ENV),
  fetchCompetitorBacklinks: async (env) => scaffoldResult(ahrefsProvider.configured(env), 'Ahrefs', ENV),
};
