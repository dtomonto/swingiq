// ============================================================
// PublishingOS executor — configuration (SERVER-ONLY)
// ------------------------------------------------------------
// Resolves the GitHub executor config from the Keys & Secrets layer (env-first,
// then the encrypted vault): GITHUB_TOKEN + GITHUB_REPO (owner/repo) + optional
// GITHUB_DEFAULT_BRANCH. Returns null when not configured — the executor then
// reports `configured:false` instead of attempting any write (keyless-safe).
// ============================================================

import { resolveSecret } from '@/lib/secrets/resolve.server';
import type { GithubConfig } from './github';

export async function resolveGithubConfig(): Promise<GithubConfig | null> {
  const token = await resolveSecret('GITHUB_TOKEN');
  const repo = await resolveSecret('GITHUB_REPO');
  if (!token || !repo || !repo.includes('/')) return null;
  const [owner, name] = repo.split('/').map((s) => s.trim());
  if (!owner || !name) return null;
  const base = (await resolveSecret('GITHUB_DEFAULT_BRANCH')) || 'master';
  return { token, owner, repo: name, base };
}

/** True when GITHUB_TOKEN + GITHUB_REPO are set (env or vault). */
export async function isExecutorConfigured(): Promise<boolean> {
  return (await resolveGithubConfig()) !== null;
}
