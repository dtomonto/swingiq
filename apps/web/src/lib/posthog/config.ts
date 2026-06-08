// ============================================================
// Analytics OS — PostHog configuration & connection resolution
// ------------------------------------------------------------
// Pure, env-driven. Reports HOW MUCH of PostHog is wired without ever
// faking a connection. The personal API key is read ONLY by getReadConfig
// (server-side); getConnection returns a sanitized view safe for the
// browser. Mirrors lib/config/integrations.ts in spirit.
// ============================================================

import type {
  ConnectionLevel,
  PostHogConnection,
  PostHogRegion,
} from './types';

export type Env = Record<string, string | undefined>;

/** Default ingest host (PostHog US cloud) — matches Analytics.tsx. */
export const POSTHOG_DEFAULT_HOST = 'https://us.i.posthog.com';

const present = (v: string | undefined): boolean => Boolean(v && v.trim());
const clean = (v: string | undefined): string => (v ?? '').trim();

/**
 * Derive the ingest host, the REST/HogQL API base, the deep-link app base,
 * and the region from a raw NEXT_PUBLIC_POSTHOG_HOST value.
 *
 * Cloud splits ingest (us.i.posthog.com) from the app/API (us.posthog.com);
 * self-hosted uses one origin for everything, so we fall back to the host.
 */
export function resolvePostHogHosts(rawHost?: string): {
  ingestHost: string;
  apiBaseUrl: string;
  appBaseUrl: string;
  region: PostHogRegion;
} {
  const ingestHost = (clean(rawHost) || POSTHOG_DEFAULT_HOST).replace(/\/+$/, '');
  const lower = ingestHost.toLowerCase();

  if (lower.includes('us.i.posthog.com') || lower.includes('app.posthog.com')) {
    return { ingestHost, apiBaseUrl: 'https://us.posthog.com', appBaseUrl: 'https://us.posthog.com', region: 'us' };
  }
  if (lower.includes('eu.i.posthog.com') || lower.includes('eu.posthog.com')) {
    return { ingestHost, apiBaseUrl: 'https://eu.posthog.com', appBaseUrl: 'https://eu.posthog.com', region: 'eu' };
  }
  // Self-hosted / custom: ingest and app share one origin.
  return { ingestHost, apiBaseUrl: ingestHost, appBaseUrl: ingestHost, region: 'custom' };
}

/** Mask a public key for display: "phc_wAwL…DDo2". Never used on secrets. */
export function maskKey(key: string | undefined | null): string | null {
  const k = clean(key ?? undefined);
  if (!k) return null;
  if (k.length <= 12) return k;
  return `${k.slice(0, 8)}…${k.slice(-4)}`;
}

/** Browser-safe ingest config (NEXT_PUBLIC_* only). */
export function getIngestConfig(env: Env = process.env) {
  const key = clean(env.NEXT_PUBLIC_POSTHOG_KEY);
  const hosts = resolvePostHogHosts(env.NEXT_PUBLIC_POSTHOG_HOST);
  return {
    configured: present(key),
    key: key || null,
    keyMasked: maskKey(key),
    ...hosts,
  };
}

/**
 * SERVER-ONLY read/management config. Includes the personal API key, so
 * the return value must never be serialized to a client component. Use
 * getConnection() for anything the browser sees.
 */
export function getReadConfig(env: Env = process.env) {
  const personalKey = clean(env.POSTHOG_PERSONAL_API_KEY);
  const projectId = clean(env.POSTHOG_PROJECT_ID);
  const hosts = resolvePostHogHosts(env.NEXT_PUBLIC_POSTHOG_HOST);
  return {
    configured: present(personalKey) && present(projectId),
    hasKey: present(personalKey),
    hasProjectId: present(projectId),
    personalKey: personalKey || null,
    projectId: projectId || null,
    ...hosts,
  };
}

/** Resolve the overall wiring level from raw env. */
export function connectionLevel(env: Env = process.env): ConnectionLevel {
  const ingest = getIngestConfig(env);
  const read = getReadConfig(env);
  if (!ingest.configured) return 'none';
  return read.configured ? 'full' : 'ingest';
}

/**
 * Sanitized connection status — SAFE to pass to client components.
 * Contains no secrets (the personal key is reduced to a boolean).
 */
export function getConnection(env: Env = process.env): PostHogConnection {
  const ingest = getIngestConfig(env);
  const read = getReadConfig(env);
  return {
    level: !ingest.configured ? 'none' : read.configured ? 'full' : 'ingest',
    region: ingest.region,
    ingestKeyMasked: ingest.keyMasked,
    ingestConfigured: ingest.configured,
    ingestHost: ingest.ingestHost,
    readConfigured: read.configured,
    projectId: read.projectId,
    appBaseUrl: ingest.appBaseUrl,
  };
}

/** Join a PostHog app base URL with a capability path for a deep link. */
export function buildPostHogUrl(appBaseUrl: string, path: string): string {
  const base = appBaseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}
