// ============================================================
// SwingIQ — Workflow: Retention / Re-Engagement
// ------------------------------------------------------------
// Helps users return without guilt or friction. Detects
// inactivity from local data and proposes ONE simple restart.
// Never spams. Returns null when there is nothing helpful to say.
// ============================================================

import { getSportAgentProfile } from '../sportProfiles';
import { getNextBestAction } from '../scoring';
import type { AgentContext, AgentInsight } from '../types';

const STALE_DAYS = 14;

export function buildReEngagement(ctx: AgentContext): AgentInsight | null {
  const days = ctx.daysSinceLastActivity;
  // Only speak up for genuinely returning users with existing data.
  if (days === null || days < STALE_DAYS || ctx.sessionCount === 0) return null;

  const sp = getSportAgentProfile(ctx.activeSport);
  const nba = getNextBestAction(ctx);

  return {
    id: 'reengage',
    title: 'Welcome back — let’s restart small',
    body:
      `It has been a little while. No need to do everything today — start with one quick ` +
      `${ctx.activeSport === 'golf' ? '10-minute baseline' : 'short video'} so your plan reflects your current ${sp.motion}.`,
    tone: 'info',
    whyItMatters: 'A small, easy restart rebuilds momentum faster than trying to catch up all at once.',
    primaryAction: nba,
    dismissible: true,
    meta: {
      agentId: 'retention',
      workflowId: 'retention.v1',
      triggerSource: 'returning_visit',
      confidence: 'high',
      dataUsed: ['last activity date', 'session count'],
      createdAt: ctx.now,
      fallbackUsed: true,
      userVisible: true,
    },
  };
}
