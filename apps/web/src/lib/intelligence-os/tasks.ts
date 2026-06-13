// ============================================================
// SwingVantage — First-Party Intelligence OS · Action Tasks (SERVER-ONLY)
// ------------------------------------------------------------
// The clickable Action OS layer. Every Critical / High Priority / Needs
// Attention item is a traceable task. Tasks are deduped by fingerprint so a
// recurring issue increments an occurrence count instead of spawning copies.
// Callers are already behind requireAdmin(). Keyless-first via ./store.
// ============================================================

import { taskRepo } from './store';
import { genId } from './router';
import { stableHash, semanticFingerprint } from './fingerprint';
import type {
  ActionTask, TaskSeverity, TaskPriority, TaskCategory, TaskStatus, Sport, SafetyFlag, FixComplexity,
} from './types';

/** Stable dedup key: category + route + component + severity + signature meaning. */
export function taskFingerprint(facets: {
  category: string; affectedRoute?: string | null; affectedComponent?: string | null;
  severity?: string; signature: string;
}): string {
  const scope = [
    facets.category,
    (facets.affectedRoute ?? '').toLowerCase(),
    (facets.affectedComponent ?? '').toLowerCase(),
    facets.severity ?? '',
  ].join('::');
  return `tfp_${stableHash(`${scope}::${semanticFingerprint(facets.signature)}`)}`;
}

/** Reasonable default priority from severity (admin can override). */
function defaultPriority(severity: TaskSeverity): TaskPriority {
  if (severity === 'critical') return 'p0';
  if (severity === 'high') return 'p1';
  if (severity === 'medium') return 'p2';
  return 'p3';
}

export interface CreateTaskInput {
  title: string;
  severity: TaskSeverity;
  category: TaskCategory;
  source: string;
  priority?: TaskPriority;
  affectedFeature?: string;
  affectedSport?: Sport;
  affectedRoute?: string | null;
  affectedComponent?: string | null;
  affectedFilePaths?: string[];
  suggestedNextAction?: string;
  rootCauseHypothesis?: string;
  evidenceSummary?: string;
  userImpact?: string;
  businessImpact?: string;
  revenueImpact?: string | null;
  brandTrustImpact?: string | null;
  aiQualityImpact?: string | null;
  confidenceScore?: number;
  fixComplexity?: FixComplexity;
  estimatedEffort?: string | null;
  reproductionSteps?: string[];
  acceptanceCriteria?: string[];
  relatedReportIds?: string[];
  relatedEventIds?: string[];
  relatedKnowledgeIds?: string[];
  internalLearningTags?: string[];
  safetyFlags?: SafetyFlag[];
  /** Discriminating text for the dedup fingerprint (defaults to the title). */
  signature?: string;
}

/**
 * Create a task, or — when an open task with the same fingerprint already
 * exists — dedupe into it (bump occurrenceCount, refresh lastDetectedAt, append
 * a history entry). Never spawns a duplicate of a live issue.
 */
export async function upsertTask(input: CreateTaskInput): Promise<{ task: ActionTask; deduped: boolean }> {
  const now = new Date().toISOString();
  const fingerprint = taskFingerprint({
    category: input.category, affectedRoute: input.affectedRoute, affectedComponent: input.affectedComponent,
    severity: input.severity, signature: input.signature ?? input.title,
  });

  const existing = (await taskRepo.list()).find(
    (t) => t.fingerprint === fingerprint && t.status !== 'archived' && t.status !== 'ignored',
  );
  if (existing) {
    const updated = await taskRepo.update(existing.id, {
      occurrenceCount: existing.occurrenceCount + 1,
      lastDetectedAt: now,
      history: [...existing.history, { at: now, event: 'recurrence', detail: `Re-detected from ${input.source}` }],
    });
    return { task: updated ?? existing, deduped: true };
  }

  const severity = input.severity;
  const task: ActionTask = {
    id: genId('task'),
    title: input.title,
    severity,
    priority: input.priority ?? defaultPriority(severity),
    status: 'new',
    category: input.category,
    source: input.source,
    affectedFeature: input.affectedFeature ?? 'unknown',
    affectedSport: input.affectedSport ?? 'none',
    affectedRoute: input.affectedRoute ?? null,
    affectedComponent: input.affectedComponent ?? null,
    affectedFilePaths: input.affectedFilePaths ?? [],
    owner: null,
    firstDetectedAt: now,
    lastDetectedAt: now,
    occurrenceCount: 1,
    suggestedNextAction: input.suggestedNextAction ?? '',
    rootCauseHypothesis: input.rootCauseHypothesis ?? '',
    evidenceSummary: input.evidenceSummary ?? '',
    userImpact: input.userImpact ?? '',
    businessImpact: input.businessImpact ?? '',
    revenueImpact: input.revenueImpact ?? null,
    brandTrustImpact: input.brandTrustImpact ?? null,
    aiQualityImpact: input.aiQualityImpact ?? null,
    confidenceScore: input.confidenceScore ?? 0.6,
    fixComplexity: input.fixComplexity ?? 'unknown',
    estimatedEffort: input.estimatedEffort ?? null,
    dependencies: [],
    relatedTaskIds: [],
    relatedReportIds: input.relatedReportIds ?? [],
    relatedEventIds: input.relatedEventIds ?? [],
    relatedKnowledgeIds: input.relatedKnowledgeIds ?? [],
    reproductionSteps: input.reproductionSteps ?? [],
    acceptanceCriteria: input.acceptanceCriteria ?? [],
    resolutionNotes: null,
    internalLearningTags: input.internalLearningTags ?? [],
    safetyFlags: input.safetyFlags ?? [],
    fingerprint,
    notes: [],
    history: [{ at: now, event: 'created', detail: `Opened from ${input.source}` }],
    dataSource: 'real',
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
  return { task: await taskRepo.create(task), deduped: false };
}

/** Change status, appending a history entry. */
export async function changeTaskStatus(id: string, status: TaskStatus): Promise<ActionTask | undefined> {
  const t = await taskRepo.get(id);
  if (!t) return undefined;
  const now = new Date().toISOString();
  return taskRepo.update(id, {
    status,
    archived: status === 'archived' ? true : t.archived,
    history: [...t.history, { at: now, event: 'status-change', detail: `${t.status} → ${status}` }],
  });
}

/** Append an admin note. */
export async function addTaskNote(id: string, author: string, body: string): Promise<ActionTask | undefined> {
  const t = await taskRepo.get(id);
  if (!t) return undefined;
  return taskRepo.update(id, { notes: [...t.notes, { at: new Date().toISOString(), author, body }] });
}

/** Generic patch with history breadcrumb (used for escalate / ignore / link). */
export async function patchTask(id: string, patch: Partial<ActionTask>, historyEvent?: string, detail?: string): Promise<ActionTask | undefined> {
  const t = await taskRepo.get(id);
  if (!t) return undefined;
  const history = historyEvent ? [...t.history, { at: new Date().toISOString(), event: historyEvent, detail }] : t.history;
  return taskRepo.update(id, { ...patch, history });
}
