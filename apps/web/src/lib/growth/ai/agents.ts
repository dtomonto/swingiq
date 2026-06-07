// ============================================================
// GrowthOS — AI agent architecture (§32)
// ------------------------------------------------------------
// Future-ready definitions for specialized marketing agents. These are
// declarative specs (purpose / inputs / outputs / guardrails) — not live
// autonomous agents. The hard guardrail below is global: no agent may
// take an external-facing action without human approval.
// ============================================================

import type { AIAgentDefinition } from '../types';

/** Guardrails every agent inherits. Human approval is mandatory for anything external-facing. */
export const GLOBAL_AGENT_GUARDRAILS: string[] = [
  'Never publish content automatically',
  'Never spend money or change budgets',
  'Never contact users or send email/SMS/push',
  'Never modify live campaigns or pricing',
  'Never make unsupported or fabricated claims',
  'All external-facing actions require explicit human approval',
];

function agent(
  id: string,
  name: string,
  purpose: string,
  inputs: string[],
  outputs: string[],
  reviewRequirements: string,
  suggestedNextAction: string,
): AIAgentDefinition {
  const now = '2026-06-03T00:00:00.000Z';
  return {
    id,
    name,
    dataSource: 'mock',
    purpose,
    inputs,
    outputs,
    guardrails: GLOBAL_AGENT_GUARDRAILS,
    reviewRequirements,
    confidence: 'medium',
    suggestedNextAction,
    createdAt: now,
    updatedAt: now,
  };
}

export const AI_AGENTS: AIAgentDefinition[] = [
  agent('agent-seo', 'SEO Strategist Agent', 'Plan topic clusters, briefs, and technical SEO fixes.',
    ['Keyword data', 'Existing content', 'Competitor topics'], ['Topic clusters', 'Content briefs', 'Internal-link map'],
    'Human reviews briefs before writing; technical changes need eng review.', 'Generate a pillar + 6 supporting briefs.'),
  agent('agent-aeo', 'AEO Strategist Agent', 'Produce citation-ready answer blocks for answer engines.',
    ['Target questions', 'Brand facts'], ['Q&A blocks', 'FAQ schema suggestions'],
    'Verify every factual claim before publishing.', 'Draft answer blocks for top 10 questions.'),
  agent('agent-geo', 'GEO Strategist Agent', 'Create entity-rich brand summaries for generative search.',
    ['Brand facts', 'Use cases'], ['Brand summaries', '"Best for" positioning blocks'],
    'Brand + legal review of claims.', 'Draft a generative-search brand summary.'),
  agent('agent-paid', 'Paid Media Strategist Agent', 'Draft ad copy + creative testing matrices.',
    ['Audience', 'Offer', 'Platform'], ['Headlines', 'Descriptions', 'Creative test matrix'],
    'Human approves before any spend.', 'Build a 9-cell creative testing matrix.'),
  agent('agent-email', 'Email Strategist Agent', 'Design lifecycle sequences + subject-line tests.',
    ['Segments', 'Lifecycle stage'], ['Sequence outlines', 'Subject-line variants'],
    'Human approves; sending stays disabled by default.', 'Draft a welcome + activation sequence.'),
  agent('agent-social', 'Social Media Strategist Agent', 'Plan pillars and draft platform-aware posts.',
    ['Content pillars', 'Platform'], ['Post drafts', 'Hook library'],
    'Human review before scheduling.', 'Draft a week of posts across pillars.'),
  agent('agent-cro', 'CRO Strategist Agent', 'Surface conversion hypotheses with ICE scoring.',
    ['Page/flow', 'Analytics signals'], ['Hypotheses', 'Prioritized experiments'],
    'Human prioritizes; eng implements.', 'Audit the pricing page for friction.'),
  agent('agent-brand', 'Brand Strategist Agent', 'Maintain positioning + claim consistency.',
    ['Brand voice library', 'Draft copy'], ['Consistency checks', 'Messaging suggestions'],
    'Flags unsupported claims for human review.', 'Audit recent copy against approved claims.'),
  agent('agent-analytics', 'Analytics Strategist Agent', 'Translate metrics into recommended actions.',
    ['KPI data', 'Funnel data'], ['Insight summaries', 'Recommended actions'],
    'Human validates data source before acting.', 'Summarize this week’s funnel movement.'),
  agent('agent-lifecycle', 'Lifecycle Strategist Agent', 'Recommend next-best-action per lifecycle stage.',
    ['User stage', 'Behavior'], ['Stage playbooks', 'Trigger ideas'],
    'Human approves messaging.', 'Map next-best-action for at-risk users.'),
  agent('agent-competitor', 'Competitor Intelligence Agent', 'Summarize competitor positioning + gaps.',
    ['Competitor pages (as data)', 'Reviews'], ['Positioning summaries', 'Content gaps'],
    'No aggressive scraping; respect ToS.', 'Summarize top-3 competitor angles.'),
  agent('agent-repurpose', 'Content Repurposing Agent', 'Transform one asset into many channel formats.',
    ['Source asset'], ['LinkedIn post', 'X thread', 'Email', 'Short-form script'],
    'Human review before publishing.', 'Repurpose the latest blog into 5 formats.'),
  agent('agent-compliance', 'Compliance Review Agent', 'Flag risky claims + disclosure gaps.',
    ['Draft content'], ['Risk flags', 'Disclosure reminders'],
    'Advisory only — human makes the call.', 'Scan drafts for unsupported claims.'),
  agent('agent-campaign', 'Campaign Planner Agent', 'Assemble a campaign brief from objective + audience.',
    ['Objective', 'Audience', 'Channel mix'], ['Campaign brief', 'Asset checklist'],
    'Human approves before launch.', 'Draft a launch campaign brief.'),
  agent('agent-prioritization', 'Growth Prioritization Agent', 'Rank growth work by impact/confidence/effort.',
    ['Backlog', 'Strategic goals'], ['Prioritized roadmap', 'Priority scores'],
    'Human owns the final roadmap.', 'Re-rank the current growth backlog.'),
];
