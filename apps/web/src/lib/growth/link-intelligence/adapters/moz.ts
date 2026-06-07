// ============================================================
// Adapter: Moz (domain authority + link metrics seam).
// Env: MOZ_ACCESS_ID + MOZ_SECRET_KEY. Scaffold only.
// ============================================================

import type { SeoProvider } from './contract';
import { hasEnv, scaffoldResult } from './contract';

const ENV = ['MOZ_ACCESS_ID', 'MOZ_SECRET_KEY'];

export const mozProvider: SeoProvider = {
  id: 'moz',
  label: 'Moz',
  envVars: ENV,
  configured: (env) => hasEnv(env, ENV),
  fetchBacklinks: async (env) => scaffoldResult(mozProvider.configured(env), 'Moz', ENV),
  fetchCompetitorBacklinks: async (env) => scaffoldResult(mozProvider.configured(env), 'Moz', ENV),
};
