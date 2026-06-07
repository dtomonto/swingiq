// ============================================================
// Adapter: Semrush (backlink + competitor gap seam).
// Env: SEMRUSH_API_KEY. Scaffold only until a live integration is wired.
// ============================================================

import type { SeoProvider } from './contract';
import { hasEnv, scaffoldResult } from './contract';

const ENV = ['SEMRUSH_API_KEY'];

export const semrushProvider: SeoProvider = {
  id: 'semrush',
  label: 'Semrush',
  envVars: ENV,
  configured: (env) => hasEnv(env, ENV),
  fetchBacklinks: async (env) => scaffoldResult(semrushProvider.configured(env), 'Semrush', ENV),
  fetchCompetitorBacklinks: async (env) => scaffoldResult(semrushProvider.configured(env), 'Semrush', ENV),
};
