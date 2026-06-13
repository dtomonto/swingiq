// ============================================================
// First-Party Intelligence OS — Claude Code Fix Packet generator
// ------------------------------------------------------------
// Turns an Action Task (or recurring Pattern) into a downloadable, *specific*
// Claude Code repair packet: a structured Markdown repair prompt + a JSON
// context bundle. Pure string builders — testable, no I/O. The API route
// (app/api/admin/intelligence-os/fix-packet) serves these as file downloads.
// ============================================================

import type { ActionTask, PatternMemory } from './types';

const PRODUCT_CONTEXT =
  'SwingVantage.com is a premium AI-powered multi-sport swing-improvement platform ' +
  '(golf, tennis, baseball, slow-pitch & fast-pitch softball, pickleball, padel). ' +
  'Core promise: “One fix. One plan. One retest.” Keyless-first; never fabricate data; ' +
  'admin surfaces are admin-only + noindex; preserve uploads, auth, AI coach, video ' +
  'analysis and Gemini/OpenAI routing.';

const DO_NOT_BREAK = [
  'Video uploads', 'Authentication', 'AI coach', 'Video analysis pipeline',
  'Gemini/OpenAI/Claude provider routing', 'Existing admin features', 'Public user experience',
];

/** The structured Claude Code repair prompt for a task. Specific, not generic. */
export function generateClaudeFixPrompt(task: ActionTask): string {
  const files = task.affectedFilePaths.length ? task.affectedFilePaths : ['(inspect via search — see Context)'];
  const repro = task.reproductionSteps.length ? task.reproductionSteps : ['(reproduction steps not yet captured)'];
  const accept = task.acceptanceCriteria.length ? task.acceptanceCriteria : ['Issue no longer reproduces', 'Regression tests added'];
  return `# Claude Code Repair Prompt

## Role
You are an elite senior engineer and product-quality architect working on SwingVantage.com.

## Objective
Fix the specific issue below without breaking existing functionality.

## Context
${PRODUCT_CONTEXT}

- Affected feature: ${task.affectedFeature ?? 'unknown'}
- Affected route: ${task.affectedRoute ?? 'unknown'}
- Affected component: ${task.affectedComponent ?? 'unknown'}
- Affected sport: ${task.affectedSport ?? 'all / n/a'}
- Category: ${task.category} · Severity: ${task.severity} · Priority: ${task.priority}
- First detected: ${task.firstDetectedAt} · Occurrences: ${task.occurrenceCount}

## Problem
${task.title}

${task.evidenceSummary}

## Evidence
- Root-cause hypothesis: ${task.rootCauseHypothesis}
- User impact: ${task.userImpact}
- Business impact: ${task.businessImpact}
${task.aiQualityImpact ? `- AI quality impact: ${task.aiQualityImpact}\n` : ''}- Confidence: ${task.confidenceScore ?? 'unknown'}

### Reproduction steps
${repro.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Required Fix
${task.suggestedNextAction}

Implementation expectations: deliver the smallest reversible change that resolves the root cause; follow existing conventions; keep it keyless-first; add tests.

## Files to Inspect
${files.map((f) => `- \`${f}\``).join('\n')}

## Tests to Run
- Unit + integration tests for the affected module
- Relevant Playwright/e2e flows if user-facing
- \`cd apps/web && npx tsc --noEmit && npm run lint && npx jest <area> --runInBand\`

## Acceptance Criteria
${accept.map((a) => `- ${a}`).join('\n')}

## Do Not Break
${DO_NOT_BREAK.map((d) => `- ${d}`).join('\n')}

## Deliverables
- Code changes
- Tests (incl. regression prevention)
- Documentation updates if behavior changed
- Update the Action OS task status when resolved
`;
}

/** JSON context bundle (machine-readable companion to the prompt). */
export function generateTaskJson(task: ActionTask): string {
  return JSON.stringify(
    {
      packetType: 'swingvantage-claude-code-fix-packet',
      generatedAt: new Date().toISOString(),
      task,
      doNotBreak: DO_NOT_BREAK,
    },
    null,
    2,
  );
}

/** Full task markdown (human-readable detail mirror). */
export function generateTaskMarkdown(task: ActionTask): string {
  return `# ${task.title}

> ${task.category} · ${task.severity} · ${task.priority} · status: ${task.status}

## Executive summary
${task.evidenceSummary}

## Impact
- **User:** ${task.userImpact}
- **Business:** ${task.businessImpact}
${task.revenueImpact ? `- **Revenue:** ${task.revenueImpact}\n` : ''}${task.brandTrustImpact ? `- **Brand trust:** ${task.brandTrustImpact}\n` : ''}
## Root-cause hypothesis
${task.rootCauseHypothesis}

## Recommended fix
${task.suggestedNextAction}

## Acceptance criteria
${(task.acceptanceCriteria.length ? task.acceptanceCriteria : ['(none captured)']).map((a) => `- ${a}`).join('\n')}

---
${generateClaudeFixPrompt(task)}
`;
}

export interface FixPacketFiles {
  'README.md': string;
  'claude-code-fix-prompt.md': string;
  'task-context.json': string;
  'acceptance-criteria.md': string;
  'regression-tests.md': string;
  'notes.md': string;
}

/** The full multi-file packet (the API can serve any single member or a bundle). */
export function generateFixPacket(task: ActionTask): FixPacketFiles {
  return {
    'README.md': `# Fix Packet — ${task.title}\n\nGenerated ${new Date().toISOString()} by SwingVantage First-Party Intelligence OS.\n\nContents:\n- claude-code-fix-prompt.md — paste into Claude Code\n- task-context.json — machine-readable task context\n- acceptance-criteria.md\n- regression-tests.md\n- notes.md\n`,
    'claude-code-fix-prompt.md': generateClaudeFixPrompt(task),
    'task-context.json': generateTaskJson(task),
    'acceptance-criteria.md': `# Acceptance criteria\n\n${(task.acceptanceCriteria.length ? task.acceptanceCriteria : ['Issue no longer reproduces']).map((a) => `- [ ] ${a}`).join('\n')}\n`,
    'regression-tests.md': `# Regression tests to add\n\n- Cover the failing path: ${task.title}\n- Cover the fixed behavior\n- Guard the "Do Not Break" surfaces\n`,
    'notes.md': `# Notes\n\n${task.notes.map((n) => `- ${n.at} (${n.author}): ${n.body}`).join('\n') || '(no notes yet)'}\n`,
  };
}

/** Promote a recurring pattern into a task-shaped packet without a stored task. */
export function patternToTaskLike(pattern: PatternMemory): ActionTask {
  const now = new Date().toISOString();
  return {
    id: `task-from-${pattern.id}`, dataSource: pattern.dataSource, createdAt: now, updatedAt: now,
    title: pattern.patternTitle, severity: 'high', priority: 'p1',
    status: 'New', category: 'Bug', source: `Pattern: ${pattern.patternType}`,
    affectedFeature: pattern.affectedFeature, affectedSport: pattern.affectedSport,
    affectedRoute: pattern.affectedRoute, affectedComponent: null, affectedFilePaths: [],
    owner: null, firstDetectedAt: pattern.firstSeenAt, lastDetectedAt: pattern.lastSeenAt,
    occurrenceCount: pattern.occurrenceCount,
    suggestedNextAction: pattern.recommendedPrevention,
    rootCauseHypothesis: pattern.summary, evidenceSummary: pattern.summary,
    userImpact: 'See pattern summary.', businessImpact: 'Recurring — compounding cost/impact.',
    revenueImpact: null, brandTrustImpact: null, aiQualityImpact: null,
    confidenceScore: pattern.confidenceScore, fixComplexity: 'unknown', estimatedEffort: null,
    dependencies: [], relatedTasks: pattern.relatedTaskIds, relatedReports: pattern.relatedReportIds,
    relatedEvents: pattern.relatedEventIds, reproductionSteps: [], acceptanceCriteria: [],
    resolutionNotes: null, internalLearningTags: pattern.tags, notes: [], history: [],
    fingerprint: pattern.fingerprint, archived: false,
  };
}
