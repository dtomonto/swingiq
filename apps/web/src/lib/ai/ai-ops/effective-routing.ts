// ============================================================
// SwingVantage — AI Operations: effective routing resolver (server-only)
// ------------------------------------------------------------
// The single function the admin Control Center (and, going forward, live call
// sites) consult to learn "who handles task X right now". It composes three
// layers, lowest-priority first:
//   1. env-driven model-config  (loadAIConfig)        — the deploy default
//   2. the strategic router     (createRouter)        — provider/model per stage
//   3. durable admin overrides  (getRoutingOverrides) — runtime re-routes
// then attaches provider HEALTH (is the chosen provider's key actually set?) so
// the dashboard can warn when a route points at an unconfigured provider.
//
// SECURITY: server-only — reads secret env (provider keys) + the override store.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import { loadAIConfig } from './model-config';
import { createRouter } from './registry';
import { getRoutingOverrides, routingStoreSource, type RoutingOverrides } from './routing-store';
import { AI_TASKS, getTaskByStage, type AITaskDef } from './task-registry';
import type { AiProviderName, AnalysisMode, ProviderStage } from './schemas';

export interface ProviderHealth {
  provider: AiProviderName;
  label: string;
  /** True when this provider can actually run (key set, or client-side CV). */
  configured: boolean;
  /** How the provider is reachable / why it's not. */
  detail: string;
}

export interface EffectiveRoute {
  task: AITaskDef;
  provider: AiProviderName;
  /** Resolved model id, or null = "provider's tier default" (e.g. coach). */
  model: string | null;
  enabled: boolean;
  /** Did a durable admin override change the default for this stage? */
  overridden: boolean;
  reason: string;
  /** Is the resolved provider's key configured (or N/A for client-side CV)? */
  providerConfigured: boolean;
}

const PROVIDER_LABELS: Record<AiProviderName, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic (Claude)',
  mediapipe: 'MediaPipe (on-device CV)',
  none: 'Disabled / keyless',
};

/** Per-provider readiness, independent of which tasks point at it. */
export function getProviderHealth(env: Record<string, string | undefined> = process.env): ProviderHealth[] {
  const has = (v: string | undefined) => isConfigured(v);
  return [
    {
      provider: 'gemini',
      label: PROVIDER_LABELS.gemini,
      configured: has(env.GOOGLE_AI_API_KEY),
      detail: has(env.GOOGLE_AI_API_KEY) ? 'GOOGLE_AI_API_KEY set' : 'Set GOOGLE_AI_API_KEY to enable Gemini video.',
    },
    {
      provider: 'openai',
      label: PROVIDER_LABELS.openai,
      configured: has(env.OPENAI_API_KEY),
      detail: has(env.OPENAI_API_KEY) ? 'OPENAI_API_KEY set' : 'Set OPENAI_API_KEY to enable the OpenAI coach.',
    },
    {
      provider: 'anthropic',
      label: PROVIDER_LABELS.anthropic,
      configured: has(env.ANTHROPIC_API_KEY),
      detail: has(env.ANTHROPIC_API_KEY) ? 'ANTHROPIC_API_KEY set' : 'Set ANTHROPIC_API_KEY to enable Claude narrative.',
    },
    {
      provider: 'mediapipe',
      label: PROVIDER_LABELS.mediapipe,
      configured: true,
      detail: 'Runs on-device in the browser — no key required.',
    },
  ];
}

function isProviderConfigured(provider: AiProviderName, env: Record<string, string | undefined>): boolean {
  switch (provider) {
    case 'gemini':
      return isConfigured(env.GOOGLE_AI_API_KEY);
    case 'openai':
      return isConfigured(env.OPENAI_API_KEY);
    case 'anthropic':
      return isConfigured(env.ANTHROPIC_API_KEY);
    case 'mediapipe':
      return true;
    case 'none':
      return true; // keyless fallback is always "available"
    default:
      return false;
  }
}

export interface EffectiveRoutingSnapshot {
  mode: AnalysisMode;
  routes: EffectiveRoute[];
  health: ProviderHealth[];
  overrides: RoutingOverrides;
  /** Whether overrides persist fleet-wide (Upstash) or per-instance only. */
  source: 'upstash' | 'memory';
}

/**
 * Resolve the live routing table for an analysis mode: base router decision per
 * task, with any durable admin override layered on, plus provider health.
 */
export async function getEffectiveRouting(
  mode: AnalysisMode = 'standard',
  env: Record<string, string | undefined> = process.env,
): Promise<EffectiveRoutingSnapshot> {
  const config = loadAIConfig(env);
  const router = createRouter(config);
  const overrides = await getRoutingOverrides();

  const routes: EffectiveRoute[] = AI_TASKS.map((task) => {
    const base = router.route(task.stage, mode);
    const ov = overrides[task.stage];

    let provider = base.provider as AiProviderName;
    let model = base.model;
    let enabled = base.enabled;
    let overridden = false;
    const reasons: string[] = [base.reason];

    if (ov) {
      if (ov.provider != null && ov.provider !== provider) {
        provider = ov.provider;
        overridden = true;
        reasons.push(`provider overridden → ${ov.provider}`);
      }
      if (ov.model !== undefined) {
        model = ov.model;
        overridden = true;
        reasons.push(ov.model ? `model overridden → ${ov.model}` : 'model reset to tier default');
      }
      if (ov.enabled != null && ov.enabled !== enabled) {
        enabled = ov.enabled;
        overridden = true;
        reasons.push(ov.enabled ? 'enabled by admin' : 'disabled by admin');
      }
    }

    return {
      task,
      provider,
      model,
      enabled,
      overridden,
      reason: reasons.join('; '),
      providerConfigured: isProviderConfigured(provider, env),
    };
  });

  return {
    mode,
    routes,
    health: getProviderHealth(env),
    overrides,
    source: routingStoreSource(),
  };
}

// ── Live-traffic resolver (one stage) ────────────────────────
// What the live call sites consult. Returns the effective provider/model for a
// single stage plus a `usable` flag = "enabled AND the provider's key is set".
// Call sites pass {provider, model} as an override ONLY when usable, so an
// override that points at an unconfigured provider degrades to each caller's
// existing env/keyless path instead of erroring.

export interface LiveRoute {
  stage: ProviderStage;
  provider: AiProviderName;
  model: string | null;
  enabled: boolean;
  providerConfigured: boolean;
  /** Safe to apply as a hard override (enabled + provider configured). */
  usable: boolean;
  /** Did a durable admin override change this stage? */
  overridden: boolean;
}

export async function resolveLiveRoute(
  stage: ProviderStage,
  mode: AnalysisMode = 'standard',
  env: Record<string, string | undefined> = process.env,
): Promise<LiveRoute> {
  const snapshot = await getEffectiveRouting(mode, env);
  const route =
    snapshot.routes.find((r) => r.task.stage === stage && r.task.id === stage) ??
    snapshot.routes.find((r) => r.task.stage === stage);

  // Fall back to the task default if the stage somehow isn't in the table.
  if (!route) {
    const task = getTaskByStage(stage);
    const provider = task?.defaultProvider ?? 'none';
    return {
      stage,
      provider,
      model: null,
      enabled: true,
      providerConfigured: isProviderConfigured(provider, env),
      usable: false,
      overridden: false,
    };
  }

  const usable =
    route.enabled &&
    route.provider !== 'none' &&
    route.providerConfigured;

  return {
    stage,
    provider: route.provider,
    model: route.model,
    enabled: route.enabled,
    providerConfigured: route.providerConfigured,
    usable,
    overridden: route.overridden,
  };
}
