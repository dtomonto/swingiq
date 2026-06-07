// ============================================================
// Link Intelligence Agent — SEO provider registry
// ------------------------------------------------------------
// Aggregates every adapter and exposes their connection status to the UI
// and the agent. When none are configured the agent runs on internal
// computation + curated white-hat seed (clearly labeled), never faked data.
// ============================================================

import type { SeoProvider } from './contract';
import { gscProvider } from './gsc';
import { ahrefsProvider } from './ahrefs';
import { semrushProvider } from './semrush';
import { mozProvider } from './moz';
import { dataForSeoProvider } from './dataforseo';

export type { SeoProvider, ProviderResult, BacklinkRow, CompetitorBacklinkRow } from './contract';

export const ALL_PROVIDERS: SeoProvider[] = [
  gscProvider, ahrefsProvider, semrushProvider, mozProvider, dataForSeoProvider,
];

export interface ProviderStatus {
  id: SeoProvider['id'];
  label: string;
  connected: boolean;
  envVars: string[];
}

export function providerStatuses(env: NodeJS.ProcessEnv = process.env): ProviderStatus[] {
  return ALL_PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    connected: p.configured(env),
    envVars: p.envVars,
  }));
}

export function anyProviderConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return ALL_PROVIDERS.some((p) => p.configured(env));
}
