// ============================================================
// SwingIQ — Agent Layer: Orchestrator
// ------------------------------------------------------------
// The single entry point the UI calls. It:
//   - runs guardrails first (safety gates everything),
//   - builds the Resume state + next best action,
//   - runs only the relevant insight workflows (per registry),
//   - de-duplicates and caps insights so the UI stays calm,
//   - caches a compact snapshot to avoid needless recompute.
//
// Fully deterministic and synchronous. No AI call on this path.
// ============================================================

import type {
  AgentContext,
  AgentInsight,
  AgentTrigger,
  AgentWorkflowResult,
  SafetyFlag,
} from './types';
import { INSIGHT_WORKFLOWS } from './registry';
import { buildResumeState } from './workflows/resume';
import { getNextBestAction } from './scoring';
import { evaluateSafety } from './guardrails';
import { contextHash, saveSnapshot } from './cache';

const MAX_INSIGHTS = 3;

function safetyInsight(flag: SafetyFlag, ctx: AgentContext): AgentInsight {
  return {
    id: `safety_${flag.id}`,
    title:
      flag.type === 'pain_injury'
        ? 'A quick safety note'
        : flag.type === 'youth'
          ? 'For a younger athlete'
          : 'Heads up',
    body: flag.message,
    tone: 'safety',
    dismissible: flag.severity !== 'stop',
    meta: {
      agentId: 'guardrail',
      workflowId: 'guardrail.v1',
      triggerSource: 'dashboard_load',
      confidence: 'high',
      dataUsed: ['profile notes', 'usage category'],
      createdAt: ctx.now,
      fallbackUsed: true,
      userVisible: true,
    },
  };
}

export function runOrchestrator(
  ctx: AgentContext,
  trigger: AgentTrigger = 'dashboard_load',
): AgentWorkflowResult {
  // 1) Safety first.
  const safetyFlags = evaluateSafety(ctx);

  // 2) Resume + next best action (the backbone of the dashboard).
  const resume = buildResumeState(ctx, trigger);
  const nextBestAction = getNextBestAction(ctx);

  // 3) Run only the relevant insight workflows.
  const produced: AgentInsight[] = [];
  for (const wf of INSIGHT_WORKFLOWS) {
    if (!wf.shouldRun(ctx)) continue;
    const insight = wf.produce(ctx);
    if (insight) produced.push(insight);
  }

  // 4) Surface a stop-severity safety flag as the first card.
  const insights: AgentInsight[] = [];
  const stopFlag = safetyFlags.find((f) => f.severity === 'stop');
  if (stopFlag) insights.push(safetyInsight(stopFlag, ctx));

  // 5) De-dupe by id and cap.
  const seen = new Set<string>(insights.map((i) => i.id));
  for (const i of produced) {
    if (seen.has(i.id)) continue;
    seen.add(i.id);
    insights.push(i);
    if (insights.length >= MAX_INSIGHTS + (stopFlag ? 1 : 0)) break;
  }

  // 6) Cache a compact snapshot (best-effort; never throws).
  try {
    saveSnapshot({
      hash: contextHash(ctx),
      createdAt: ctx.now,
      sport: ctx.activeSport,
      lastFocus: resume.lastFocus,
      trend: resume.progressTrend,
      sessionCount: ctx.sessionCount,
      lastRecommendedNextStep: nextBestAction.intent,
    });
  } catch {
    // ignore
  }

  return {
    generatedAt: ctx.now,
    trigger,
    resume,
    nextBestAction,
    insights,
    safetyFlags,
  };
}
