// ============================================================
// SwingVantage — Video Studio: Provider Registry
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   The single source of truth for WHICH video generators exist, which
//   ones are turned on (purely from environment variables), and the hard
//   spending ceiling. Mirrors lib/config/integrations.ts: nothing here
//   fakes a connection — a provider is "configured" only when its keys
//   are actually present.
//
//   SAFE DEFAULT: the built-in `mock` provider (cost $0) is always
//   available, and the global budget defaults to $0 — so out of the box
//   the system only ever runs the free generator. Raise
//   VIDEO_STUDIO_MAX_COST_CENTS (and add a provider key) to allow paid
//   generation. This keeps AI spend off until you explicitly opt in.
// ============================================================

import type { VideoProviderConfig, ProviderCapability } from '../types';
import type { VideoProvider } from './types';
import { mockProvider } from './mockProvider';

type Env = Record<string, string | undefined>;

function has(env: Env, ...keys: string[]): boolean {
  return keys.every((k) => Boolean(env[k] && String(env[k]).trim()));
}

interface ProviderSpec {
  id: string;
  label: string;
  capabilities: ProviderCapability[];
  requiredEnv: string[];
  note: string;
  maxCostPerJobCents: number;
}

/**
 * Catalogue of every provider the socket supports. Only `mock` has an
 * implementation today; the rest are declared so the admin checklist and
 * the docs are accurate, and so wiring one up later is just "add the impl".
 */
const PROVIDER_SPECS: ProviderSpec[] = [
  {
    id: 'mock',
    label: 'Built-in template (no API key)',
    capabilities: ['video', 'voiceover', 'captions', 'thumbnail', 'compose'],
    requiredEnv: [],
    note: 'Generates branded poster, timed captions, and transcript for free. Footage is a placeholder until a real provider is added.',
    maxCostPerJobCents: 0,
  },
  {
    id: 'runway',
    label: 'Runway (text/image → video)',
    capabilities: ['video'],
    requiredEnv: ['RUNWAY_API_KEY'],
    note: 'High-quality generative footage. Needs RUNWAY_API_KEY and a non-zero budget.',
    maxCostPerJobCents: 200,
  },
  {
    id: 'luma',
    label: 'Luma Dream Machine',
    capabilities: ['video'],
    requiredEnv: ['LUMA_API_KEY'],
    note: 'Generative video clips for B-roll / motion.',
    maxCostPerJobCents: 200,
  },
  {
    id: 'heygen',
    label: 'HeyGen (avatar presenter)',
    capabilities: ['video', 'voiceover'],
    requiredEnv: ['HEYGEN_API_KEY'],
    note: 'Talking-head presenter videos from a script.',
    maxCostPerJobCents: 300,
  },
  {
    id: 'synthesia',
    label: 'Synthesia (avatar presenter)',
    capabilities: ['video', 'voiceover'],
    requiredEnv: ['SYNTHESIA_API_KEY'],
    note: 'Studio-style presenter videos from a script.',
    maxCostPerJobCents: 300,
  },
  {
    id: 'elevenlabs',
    label: 'ElevenLabs (voiceover)',
    capabilities: ['voiceover'],
    requiredEnv: ['ELEVENLABS_API_KEY'],
    note: 'Natural voiceover synthesis for narration tracks.',
    maxCostPerJobCents: 50,
  },
  {
    id: 'remotion',
    label: 'Remotion (code-rendered motion graphics)',
    capabilities: ['video', 'compose'],
    requiredEnv: ['REMOTION_RENDER_URL'],
    note: 'Render React-defined motion graphics to MP4 via a render service.',
    maxCostPerJobCents: 20,
  },
  {
    id: 'ffmpeg',
    label: 'FFmpeg (server-side compose)',
    capabilities: ['compose', 'captions'],
    requiredEnv: ['FFMPEG_PATH'],
    note: 'Compose footage + VO + captions into the final file on your own infra.',
    maxCostPerJobCents: 5,
  },
  {
    id: 'openai',
    label: 'OpenAI video (future)',
    capabilities: ['video'],
    requiredEnv: ['OPENAI_VIDEO_API_KEY'],
    note: 'Reserved for OpenAI video generation when available to the account.',
    maxCostPerJobCents: 200,
  },
];

/** Implemented providers, by id. Add real impls here as they're built. */
const IMPLEMENTED: Record<string, VideoProvider> = {
  mock: mockProvider,
};

/** Global spend ceiling (USD cents). Defaults to 0 → free generation only. */
export function globalMaxCostCents(env: Env = process.env): number {
  const raw = Number(env.VIDEO_STUDIO_MAX_COST_CENTS);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

/** Full provider status list for the admin settings panel. */
export function getProviderConfigs(env: Env = process.env): VideoProviderConfig[] {
  return PROVIDER_SPECS.map((spec) => ({
    id: spec.id,
    label: spec.label,
    capabilities: spec.capabilities,
    configured: spec.id === 'mock' ? true : has(env, ...spec.requiredEnv),
    requiredEnv: spec.requiredEnv,
    note: spec.note,
    maxCostPerJobCents: spec.maxCostPerJobCents,
    // Only providers we actually implement can be enabled today.
    enabled: Boolean(IMPLEMENTED[spec.id]),
  }));
}

/**
 * Resolve the provider to use. Returns a real implementation only; if the
 * preferred provider isn't configured AND implemented, falls back to the
 * always-available mock (honest, never throws).
 */
export function resolveProvider(env: Env = process.env, preferredId?: string): VideoProvider {
  if (preferredId && IMPLEMENTED[preferredId]) {
    const impl = IMPLEMENTED[preferredId];
    const spec = PROVIDER_SPECS.find((s) => s.id === preferredId);
    const configured = preferredId === 'mock' || (spec ? has(env, ...spec.requiredEnv) : false);
    if (configured) return impl;
  }
  // Prefer the highest-quality configured+implemented provider, else mock.
  for (const spec of PROVIDER_SPECS) {
    if (spec.id === 'mock') continue;
    if (IMPLEMENTED[spec.id] && has(env, ...spec.requiredEnv)) return IMPLEMENTED[spec.id];
  }
  return mockProvider;
}

export function getProviderById(id: string): VideoProvider | undefined {
  return IMPLEMENTED[id];
}

/** Count configured providers — handy for an admin badge. */
export function providerSummary(env: Env = process.env): { configured: number; total: number } {
  const configs = getProviderConfigs(env);
  return { configured: configs.filter((c) => c.configured).length, total: configs.length };
}
