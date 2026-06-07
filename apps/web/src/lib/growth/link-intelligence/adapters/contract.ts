// ============================================================
// Link Intelligence Agent — SEO data provider contract
// ------------------------------------------------------------
// Clean adapter seam for third-party SEO data (Search Console, Ahrefs,
// Semrush, Moz, DataForSEO). Until real credentials + a live integration
// are added, providers report `connected: false` and return no data — the
// agent then runs on its own internal computation + curated white-hat seed.
// No secrets are hardcoded; configuration is detected from env vars.
// ============================================================

export interface BacklinkRow {
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchor: string;
  /** 0..100 domain-authority proxy when the provider supplies one. */
  domainAuthority: number | null;
}

export interface CompetitorBacklinkRow {
  competitor: string;
  linkingDomain: string;
  linkingUrl: string;
  competitorPage: string;
  anchor: string;
  domainAuthority: number | null;
}

export interface ProviderResult<T> {
  connected: boolean;
  data: T[];
  /** Human-readable status — shown in the admin so state is never ambiguous. */
  note: string;
}

export interface SeoProvider {
  id: 'gsc' | 'ahrefs' | 'semrush' | 'moz' | 'dataforseo';
  label: string;
  /** Env vars that must all be present for this provider to be "configured". */
  envVars: string[];
  configured(env: NodeJS.ProcessEnv): boolean;
  fetchBacklinks(env: NodeJS.ProcessEnv, domain: string): Promise<ProviderResult<BacklinkRow>>;
  fetchCompetitorBacklinks(env: NodeJS.ProcessEnv, competitorDomain: string): Promise<ProviderResult<CompetitorBacklinkRow>>;
}

/** Shared helper: true only when every listed env var is non-empty. */
export function hasEnv(env: NodeJS.ProcessEnv, keys: string[]): boolean {
  return keys.every((k) => Boolean(env[k] && String(env[k]).trim()));
}

/**
 * Standard "scaffold" result. When configured we still return no rows + an
 * honest note (live fetch is intentionally not implemented yet), so the UI
 * never shows invented backlink data as real.
 */
export function scaffoldResult<T>(configured: boolean, label: string, envVars: string[]): ProviderResult<T> {
  return {
    connected: configured,
    data: [],
    note: configured
      ? `${label} credentials detected — live fetch is a scaffold (implement the API call to pull real data).`
      : `${label} not connected — set ${envVars.join(', ')} to enable live data.`,
  };
}
