// ============================================================
// Clarity OS — Microsoft Clarity configuration & connection resolution
// ------------------------------------------------------------
// Pure, env-driven. Reports HOW MUCH of Clarity is wired without ever
// faking a connection. The Data Export API token is read ONLY by
// getReadConfig (server-side); getConnection returns a sanitized view
// safe for the browser. Mirrors lib/posthog/config.ts in spirit.
// ============================================================

import type { ClarityConnection, ConnectionLevel } from './types';

export type Env = Record<string, string | undefined>;

/** Base of the Clarity web app — deep links are <base>/projects/view/<id>/<path>. */
export const CLARITY_APP_BASE = 'https://clarity.microsoft.com';

const present = (v: string | undefined): boolean => Boolean(v && v.trim());
const clean = (v: string | undefined): string => (v ?? '').trim();

/** Mask a project id for display: "ab12…ef90". Never used on secrets. */
export function maskKey(key: string | undefined | null): string | null {
  const k = clean(key ?? undefined);
  if (!k) return null;
  if (k.length <= 8) return k;
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}

/** Browser-safe ingest config (NEXT_PUBLIC_* only). */
export function getIngestConfig(env: Env = process.env) {
  const projectId = clean(env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
  return {
    configured: present(projectId),
    projectId: projectId || null,
    projectIdMasked: maskKey(projectId),
    appBaseUrl: CLARITY_APP_BASE,
  };
}

/**
 * SERVER-ONLY read config. Includes the Data Export API token, so the return
 * value must never be serialized to a client component. Use getConnection()
 * for anything the browser sees.
 */
export function getReadConfig(env: Env = process.env) {
  const token = clean(env.CLARITY_DATA_EXPORT_TOKEN);
  const projectId = clean(env.NEXT_PUBLIC_CLARITY_PROJECT_ID);
  return {
    // The Data Export API token authenticates per-project on its own, so a
    // token alone is enough to read; the project id is still needed for deep
    // links and is virtually always present alongside it.
    configured: present(token),
    hasToken: present(token),
    token: token || null,
    projectId: projectId || null,
    appBaseUrl: CLARITY_APP_BASE,
  };
}

/** Resolve the overall wiring level from raw env. */
export function connectionLevel(env: Env = process.env): ConnectionLevel {
  const ingest = getIngestConfig(env);
  const read = getReadConfig(env);
  if (!ingest.configured && !read.configured) return 'none';
  return read.configured ? 'full' : 'ingest';
}

/**
 * Sanitized connection status — SAFE to pass to client components.
 * Contains no secrets (the export token is reduced to a boolean).
 */
export function getConnection(env: Env = process.env): ClarityConnection {
  const ingest = getIngestConfig(env);
  const read = getReadConfig(env);
  return {
    level: connectionLevel(env),
    projectIdMasked: ingest.projectIdMasked,
    ingestConfigured: ingest.configured,
    projectId: ingest.projectId,
    readConfigured: read.configured,
    appBaseUrl: ingest.appBaseUrl,
  };
}

/**
 * Build a deep link into the Clarity app for a given project + path.
 * Returns null when no project id is set (nothing to link to yet).
 */
export function buildClarityUrl(
  appBaseUrl: string,
  projectId: string | null,
  path: string,
): string | null {
  if (!projectId) return null;
  const base = appBaseUrl.replace(/\/+$/, '');
  const suffix = path.replace(/^\/+/, '');
  return `${base}/projects/view/${encodeURIComponent(projectId)}/${suffix}`;
}
