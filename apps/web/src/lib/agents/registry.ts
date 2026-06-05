// ============================================================
// SwingVantage — Agent Layer: Registry
// ------------------------------------------------------------
// Declares the insight-producing workflows and WHEN each is
// relevant. The orchestrator reads this to run only the minimum
// necessary agents for the current context. Each producer turns
// a deterministic workflow output into a unified AgentInsight.
// ============================================================

import type { AgentContext, AgentId, AgentInsight, AgentMetadata } from './types';
import { computeProgressTrend } from './workflows/progress-memory';
import { buildDiagnosisConfidence } from './workflows/diagnosis-confidence';
import { buildEquipmentFit } from './workflows/equipment-fit';
import { buildReEngagement } from './workflows/retention';
import { buildProUpgradeSuggestion } from './workflows/pro-upgrade';
import { getNextBestAction } from './scoring';

export interface InsightWorkflow {
  agentId: AgentId;
  workflowId: string;
  /** Cheap predicate — keeps the orchestrator from doing needless work. */
  shouldRun: (ctx: AgentContext) => boolean;
  /** Produce one insight, or null if there is nothing worth saying. */
  produce: (ctx: AgentContext) => AgentInsight | null;
}

function meta(
  agentId: AgentId,
  workflowId: string,
  ctx: AgentContext,
  confidence: AgentMetadata['confidence'],
  dataUsed: string[],
): AgentMetadata {
  return {
    agentId,
    workflowId,
    triggerSource: 'dashboard_load',
    confidence,
    dataUsed,
    createdAt: ctx.now,
    fallbackUsed: true,
    userVisible: true,
  };
}

// ── Insight producers (priority = array order below) ──────────

const retentionWorkflow: InsightWorkflow = {
  agentId: 'retention',
  workflowId: 'retention.v1',
  shouldRun: (ctx) =>
    ctx.daysSinceLastActivity !== null && ctx.daysSinceLastActivity >= 14 && ctx.sessionCount > 0,
  produce: (ctx) => buildReEngagement(ctx),
};

const progressWorkflow: InsightWorkflow = {
  agentId: 'progress_memory',
  workflowId: 'progress.v1',
  shouldRun: (ctx) => ctx.sessionCount >= 2,
  produce: (ctx) => {
    const trend = computeProgressTrend(ctx);
    if (trend.direction === 'unknown') return null;
    const improving = trend.direction === 'improving';
    const declining = trend.direction === 'declining';
    return {
      id: 'progress',
      title: improving
        ? 'SwingVantage noticed your scores are trending up'
        : declining
          ? 'SwingVantage noticed a small dip since last time'
          : 'SwingVantage noticed your scores have plateaued',
      body: trend.trendSummary,
      tone: improving ? 'celebrate' : declining ? 'warning' : 'info',
      whyItMatters: trend.suggestedAdjustment,
      primaryAction: {
        id: 'see_progress',
        label: 'See your progress',
        href: '/progress',
        intent: 'view_progress',
        priority: 1,
      },
      dismissible: true,
      meta: meta('progress_memory', 'progress.v1', ctx, improving ? 'high' : 'medium', [
        `${ctx.sessionCount} sessions`,
        'swing scores',
      ]),
    };
  },
};

const diagnosisWorkflow: InsightWorkflow = {
  agentId: 'diagnosis_confidence',
  workflowId: 'diagnosis.v1',
  shouldRun: (ctx) => !!ctx.latestDiagnosedSession?.primaryFocus,
  produce: (ctx) => {
    const dx = buildDiagnosisConfidence(ctx);
    if (!dx.primaryIssue) return null;
    return {
      id: 'diagnosis',
      title: 'Your top priority right now',
      body: dx.plainEnglishSummary,
      tone: 'info',
      confidence: dx.confidence,
      evidence: dx.evidence,
      whyItMatters: dx.recommendedNextStep,
      primaryAction: {
        id: 'work_priority',
        label: 'Build a plan for this',
        href: '/training',
        intent: 'create_plan',
        priority: 1,
      },
      dismissible: true,
      meta: meta('diagnosis_confidence', 'diagnosis.v1', ctx, dx.confidence.level, [
        'latest diagnosis',
        'session history',
      ]),
    };
  },
};

const equipmentWorkflow: InsightWorkflow = {
  agentId: 'equipment_fit',
  workflowId: 'equipment.v1',
  shouldRun: (ctx) => !ctx.equipment.sufficientForFit && ctx.sessionCount >= 1,
  produce: (ctx) => {
    const fit = buildEquipmentFit(ctx);
    const nba = getNextBestAction(ctx);
    return {
      id: 'equipment',
      title: 'Complete your equipment for better fit guidance',
      body:
        fit.dataNeeded[0] ??
        `Add your ${ctx.activeSport === 'golf' ? 'clubs' : 'equipment'} details so SwingVantage can check your fit.`,
      tone: 'info',
      confidence: fit.fitConfidence,
      primaryAction:
        nba.intent === 'add_equipment'
          ? nba
          : {
              id: 'complete_equipment',
              label: 'Complete equipment',
              href: ctx.activeSport === 'golf' ? '/bag' : '/equipment',
              intent: 'add_equipment',
              priority: 1,
            },
      dismissible: true,
      meta: meta('equipment_fit', 'equipment.v1', ctx, 'low', ['equipment completeness']),
    };
  },
};

const proUpgradeWorkflow: InsightWorkflow = {
  agentId: 'pro_upgrade',
  workflowId: 'pro_upgrade.v1',
  shouldRun: (ctx) => ctx.sessionCount >= 3,
  produce: (ctx) => {
    const s = buildProUpgradeSuggestion(ctx);
    if (!s.showUpgradePrompt) return null;
    return {
      id: 'pro_upgrade',
      title: s.relevantFeature,
      body: s.userBenefit,
      tone: 'info',
      whyItMatters: s.upgradeReason,
      primaryAction: {
        id: 'view_pricing',
        label: 'See what Pro adds',
        href: '/pricing',
        intent: 'upgrade',
        priority: 1,
      },
      dismissible: true,
      meta: meta('pro_upgrade', 'pro_upgrade.v1', ctx, 'medium', ['session count', 'history depth']),
    };
  },
};

/** Ordered by priority — earlier producers win limited dashboard space. */
export const INSIGHT_WORKFLOWS: InsightWorkflow[] = [
  retentionWorkflow,
  progressWorkflow,
  diagnosisWorkflow,
  equipmentWorkflow,
  proUpgradeWorkflow,
];
