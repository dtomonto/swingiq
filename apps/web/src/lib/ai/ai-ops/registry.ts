// ============================================================
// SwingVantage — AI Operations: provider router (master-prompt §10.2)
// ------------------------------------------------------------
// Decides which provider + model handles each stage, by analysis mode.
// Default routing (§2): video intake = Gemini, coach + chat = OpenAI,
// measurement = MediaPipe, premium narrative = Claude (opt-in only).
// Pure + deterministic; model ids come from the config service, never
// hardcoded here.
// ============================================================

import type { AIModelConfig } from './model-config';
import type { AIRouter, RouteDecision } from './types';
import type { AnalysisMode, ProviderStage } from './schemas';

export function createRouter(config: AIModelConfig): AIRouter {
  const decide = (stage: ProviderStage, mode: AnalysisMode): RouteDecision => {
    const premium = mode === 'premium';
    switch (stage) {
      case 'video_intake':
        return {
          stage,
          provider: 'gemini',
          model: premium ? config.gemini.deepModel : config.gemini.fastModel,
          enabled: true,
          reason: premium ? 'premium → deep Gemini video intake' : 'standard → fast Gemini video intake',
        };
      case 'measurement':
        return {
          stage,
          provider: config.measurement.provider,
          model: null,
          enabled: config.measurement.serverSide || config.measurement.clientSide,
          reason: 'measurement layer (MediaPipe default)',
        };
      case 'coach_synthesis':
      case 'coach_chat':
        return {
          stage,
          provider: 'openai',
          // null = use the gateway tier default (works today); set OPENAI_COACH_MODEL to override.
          model: premium ? config.openai.coachModel : (config.openai.coachCostModel ?? config.openai.coachModel),
          enabled: true,
          reason: 'coach is always OpenAI',
        };
      case 'premium_narrative':
        return {
          stage,
          provider: 'anthropic',
          model: config.claude.model,
          enabled: config.claude.enabled, // OFF by default
          reason: config.claude.enabled ? 'Claude narrative enabled (opt-in)' : 'Claude narrative disabled by default',
        };
      case 'eval_scoring':
        return { stage, provider: 'openai', model: config.openai.coachModel, enabled: config.system.evals, reason: 'eval scoring' };
      default:
        return { stage, provider: 'none', model: null, enabled: false, reason: 'unknown stage' };
    }
  };
  return { route: decide };
}
