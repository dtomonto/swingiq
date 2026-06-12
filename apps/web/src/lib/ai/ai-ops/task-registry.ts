// ============================================================
// SwingVantage — AI Operations: task registry (master-prompt §"task registry")
// ------------------------------------------------------------
// The canonical catalogue of every AI-powered task the product runs, mapped
// onto the orchestrator's ProviderStages. This is the SINGLE source of truth
// the admin "AI Provider Control Center" lists — each row is a task an operator
// can inspect (which provider/model handles it) and, where allowed, re-route.
//
// Pure + dependency-light: provider DEFAULTS encode the strategic routing
// principle (Gemini = video understanding, OpenAI = coach/reasoning, MediaPipe
// = measurement, Claude = opt-in narrative). The concrete model IDs never live
// here — they come from the env-driven model-config + admin overrides.
// ============================================================

import type { AiProviderName, ProviderStage } from './schemas';

export interface AITaskDef {
  /** Stable id used in the admin UI + override store. */
  id: string;
  /** Human label shown in the Control Center. */
  label: string;
  /** Which orchestrator stage this task routes through. */
  stage: ProviderStage;
  /** The strategically-correct default provider for this task. */
  defaultProvider: AiProviderName;
  /** Metering operation id (links the task to its spend in lib/ai-budget). */
  op: string | null;
  /** Plain-English description of what the task does. */
  description: string;
  /**
   * Providers that are LEGITIMATE choices for this task (drives the admin
   * dropdown). Measurement is intentionally locked to the CV layer — an LLM
   * must never masquerade as objective biomechanics.
   */
  allowedProviders: AiProviderName[];
  /** False when the route is fixed by design (e.g. measurement = MediaPipe). */
  reroutable: boolean;
}

// Order = display order in the Control Center (upload → measure → coach → polish).
export const AI_TASKS: readonly AITaskDef[] = [
  {
    id: 'video_intake',
    label: 'Video understanding',
    stage: 'video_intake',
    defaultProvider: 'gemini',
    op: 'video-vision',
    description:
      'Raw video/frame understanding: phases, timestamped observations, visible mechanics. Gemini is built for video understanding — it is the default.',
    allowedProviders: ['gemini', 'openai', 'anthropic', 'none'],
    reroutable: true,
  },
  {
    id: 'measurement',
    label: 'Biomechanical measurement',
    stage: 'measurement',
    defaultProvider: 'mediapipe',
    op: null,
    description:
      'Objective landmarks / joint angles / rotation / sway from MediaPipe pose (runs on-device). Deterministic CV — never an LLM.',
    allowedProviders: ['mediapipe', 'none'],
    reroutable: false,
  },
  {
    id: 'coach_synthesis',
    label: 'Coach report synthesis',
    stage: 'coach_synthesis',
    defaultProvider: 'openai',
    op: 'ai-coach',
    description:
      'Turns normalized video observations + measurements + profile into the one-fix / one-plan / one-retest report. OpenAI is the reasoning + structured-output engine.',
    allowedProviders: ['openai', 'anthropic', 'none'],
    reroutable: true,
  },
  {
    id: 'coach_chat',
    label: 'AI coach chat',
    stage: 'coach_chat',
    defaultProvider: 'openai',
    op: 'ai-coach',
    description:
      'Conversational coaching grounded in the user’s pre-computed stats. OpenAI default; falls back to the keyless data-grounded placeholder when no key.',
    allowedProviders: ['openai', 'anthropic', 'none'],
    reroutable: true,
  },
  {
    id: 'premium_narrative',
    label: 'Premium narrative (opt-in)',
    stage: 'premium_narrative',
    defaultProvider: 'anthropic',
    op: 'narrative',
    description:
      'Optional long-form polish over the OpenAI coach output. Adds no new technical claims. OFF by default; enable per admin setting.',
    allowedProviders: ['anthropic', 'openai', 'none'],
    reroutable: true,
  },
  {
    id: 'eval_scoring',
    label: 'AI output QA / eval scoring',
    stage: 'eval_scoring',
    defaultProvider: 'openai',
    op: null,
    description:
      'Internal critique of generated reports — completeness, hallucination risk, calibration. Not user-facing.',
    allowedProviders: ['openai', 'anthropic', 'none'],
    reroutable: true,
  },
] as const;

/** Look up a task by its stable id. */
export function getTaskById(id: string): AITaskDef | undefined {
  return AI_TASKS.find((t) => t.id === id);
}

/** Look up the FIRST task for a stage (id === stage for all current tasks except chat/synthesis share). */
export function getTaskByStage(stage: ProviderStage): AITaskDef | undefined {
  return AI_TASKS.find((t) => t.stage === stage && t.id === stage) ?? AI_TASKS.find((t) => t.stage === stage);
}
