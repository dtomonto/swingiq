// ============================================================
// SearchIntelligenceOS — Growth Action synthesizer (§2.12)
// ------------------------------------------------------------
// Rolls the technical issues, content opportunities, decay signals and
// indexing gaps into ONE prioritized, banded action feed using the
// Impact×Confidence×Urgency×BusinessValue ÷ Effort model. Each action says
// what to do, why it matters, the evidence, the steps, whether Claude Code can
// safely implement it, and whether it needs admin approval. Pure.
// ============================================================

import { id } from '../link-intelligence/id';
import { scoreActionPriority } from './scoring';
import type {
  TechnicalIssue, ContentOpportunity, DecaySignal, SearchAction, ActionCategory, Scale,
  IssueCategory,
} from './types';

const ISSUE_TO_ACTION: Record<IssueCategory, ActionCategory> = {
  metadata: 'technical', content: 'content', indexability: 'indexing',
  'internal-links': 'internal-links', schema: 'technical', sitemap: 'indexing',
  cannibalization: 'technical', performance: 'technical',
};

const sev = (s: TechnicalIssue['severity']): { impact: Scale; urgency: Scale } => {
  if (s === 'critical') return { impact: 'high', urgency: 'high' };
  if (s === 'high') return { impact: 'high', urgency: 'medium' };
  if (s === 'medium') return { impact: 'medium', urgency: 'medium' };
  return { impact: 'low', urgency: 'low' };
};

interface Draft {
  title: string;
  category: ActionCategory;
  relatedUrl: string | null;
  summary: string;
  whyItMatters: string;
  evidence: string;
  recommendedSteps: string[];
  impact: Scale; confidence: Scale; urgency: Scale; businessValue: Scale; effort: Scale;
  expectedOutcome: string;
  riskIfIgnored: string;
  completionCriteria: string;
  canClaudeImplement: boolean;
  requiresApproval: boolean;
  dataSource: SearchAction['dataSource'];
}

function finalize(d: Draft): SearchAction {
  const { score, band } = scoreActionPriority({
    impact: d.impact, confidence: d.confidence, urgency: d.urgency,
    businessValue: d.businessValue, effort: d.effort,
  });
  return {
    id: id('si-action', d.category, d.title, d.relatedUrl ?? ''),
    title: d.title,
    category: d.category,
    relatedUrl: d.relatedUrl,
    summary: d.summary,
    whyItMatters: d.whyItMatters,
    evidence: d.evidence,
    recommendedSteps: d.recommendedSteps,
    estimatedEffort: d.effort,
    expectedOutcome: d.expectedOutcome,
    riskIfIgnored: d.riskIfIgnored,
    completionCriteria: d.completionCriteria,
    priorityScore: score,
    band,
    canClaudeImplement: d.canClaudeImplement,
    requiresApproval: d.requiresApproval,
    status: 'open',
    dataSource: d.dataSource,
  };
}

export interface ActionInputs {
  issues: TechnicalIssue[];
  opportunities: ContentOpportunity[];
  decay: DecaySignal[];
}

export function synthesizeActions(inp: ActionInputs): SearchAction[] {
  const drafts: Draft[] = [];

  // 1) Top technical/indexing issues (highest priority first).
  for (const issue of inp.issues.filter((i) => i.severity !== 'informational').slice(0, 10)) {
    const { impact, urgency } = sev(issue.severity);
    drafts.push({
      title: issue.title,
      category: ISSUE_TO_ACTION[issue.category],
      relatedUrl: issue.url,
      summary: issue.description,
      whyItMatters: `${issue.severity} ${issue.category} issue affecting ${issue.affectedUrls.length} page(s).`,
      evidence: issue.evidence,
      recommendedSteps: [issue.recommendedFix],
      impact, confidence: issue.confidence >= 85 ? 'high' : 'medium', urgency,
      businessValue: issue.expectedImpact, effort: issue.fixComplexity,
      expectedOutcome: 'Resolved technical blocker → better crawlability / rankings.',
      riskIfIgnored: 'Continued ranking suppression or wasted crawl budget.',
      completionCriteria: 'Issue no longer detected on the next scan.',
      canClaudeImplement: issue.autoFixAvailable,
      requiresApproval: issue.requiresApproval,
      dataSource: 'real',
    });
  }

  // 2) Top content opportunities.
  for (const opp of inp.opportunities.slice(0, 6)) {
    drafts.push({
      title: `Create: ${opp.title}`,
      category: 'content',
      relatedUrl: null,
      summary: `New ${opp.contentType} targeting "${opp.targetKeyword}".`,
      whyItMatters: opp.whyItMatters,
      evidence: `Opportunity score ${opp.priorityScore}/100 · cluster ${opp.topicCluster}.`,
      recommendedSteps: [
        `Generate a content brief for "${opp.targetKeyword}"`,
        `Draft at /${opp.proposedSlug} with ${opp.schemaRecommendation} schema`,
        `Add internal links: ${opp.internalLinksToAdd.slice(0, 3).join(', ') || '(cluster pages)'}`,
        'Review + publish (admin approval required)',
      ],
      impact: opp.priorityScore >= 75 ? 'high' : 'medium',
      confidence: opp.confidenceScore >= 80 ? 'high' : 'medium',
      urgency: 'medium',
      businessValue: opp.estimatedBusinessValue >= 70 ? 'high' : 'medium',
      effort: 'medium',
      expectedOutcome: 'New ranking page + topical-authority gain.',
      riskIfIgnored: 'A competitor owns the query and the cluster stays incomplete.',
      completionCriteria: 'Page published + internally linked + in sitemap.',
      canClaudeImplement: true,
      requiresApproval: true,
      dataSource: opp.dataSource,
    });
  }

  // 3) Top decay/refresh signals.
  for (const d of inp.decay.slice(0, 4)) {
    drafts.push({
      title: `${d.recommendedAction === 'expand' ? 'Expand' : 'Refresh'}: ${d.title}`,
      category: 'decay',
      relatedUrl: d.url,
      summary: d.detail,
      whyItMatters: `Structural decay risk ${d.riskScore}/100 — protect existing equity before it slips.`,
      evidence: `Reasons: ${d.reasons.join(', ')}.`,
      recommendedSteps: ['Expand/refresh the body', 'Add a direct-answer + FAQ block', 'Add 2–3 internal links', 'Re-check schema'],
      impact: 'medium', confidence: 'medium', urgency: d.riskScore >= 60 ? 'high' : 'medium',
      businessValue: 'medium', effort: 'medium',
      expectedOutcome: 'Protected/improved rankings on an existing page.',
      riskIfIgnored: 'Gradual ranking + traffic decay.',
      completionCriteria: 'Decay risk drops below threshold on the next scan.',
      canClaudeImplement: true,
      requiresApproval: true,
      dataSource: 'estimated',
    });
  }

  return drafts.map(finalize).sort((a, b) => b.priorityScore - a.priorityScore);
}
