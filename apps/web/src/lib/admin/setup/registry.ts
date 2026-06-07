// ============================================================
// SwingVantage Admin — Setup & Next Steps: resolver (pure + isomorphic)
// ------------------------------------------------------------
// Turns the catalog + generated tasks + a secret-free SetupSignal +
// the owner's "I did this" acknowledgements into ordered, status-tagged
// cards. PURE and DETERMINISTIC: no env reads, no server imports — the
// server passes the signal in. That keeps it trivially testable and lets
// the same logic run in the client board.
// ============================================================

import type {
  SetupTask, ResolvedTask, SetupSignal, SetupStatus, SetupSummary,
  SetupCategory, SetupPriority,
} from './types';

/** Stable display order of the category groups. */
export const CATEGORY_ORDER: SetupCategory[] = [
  'go-live', 'data', 'ai', 'email', 'growth', 'reliability', 'local-setup', 'deploy',
];

export const CATEGORY_META: Record<SetupCategory, { label: string; blurb: string }> = {
  'go-live': {
    label: 'Go-live essentials',
    blurb: 'The handful of things to set before real users arrive.',
  },
  data: {
    label: 'Database setup',
    blurb: 'One-time database files to paste into Supabase so features have somewhere to store data.',
  },
  ai: {
    label: 'AI features',
    blurb: 'Unlock real AI coaching, swing vision and photo import — and cap what they can spend.',
  },
  email: {
    label: 'Email',
    blurb: 'Send sign-in emails and receive messages from your contact form.',
  },
  growth: {
    label: 'Growth & money',
    blurb: 'Measure traffic, run ads, take payments — added as you grow (most can wait).',
  },
  reliability: {
    label: 'Reliability & security',
    blurb: 'Guardrails worth adding once the app is deployed to the public.',
  },
  'local-setup': {
    label: 'On your computer',
    blurb: 'One-time setup steps you run once per machine.',
  },
  deploy: {
    label: 'Shipping & deploys',
    blurb: 'How your changes reach swingvantage.com — reference, nothing to fill in.',
  },
};

const PRIORITY_RANK: Record<SetupPriority, number> = {
  required: 0, recommended: 1, optional: 2,
};

/** True when a detection has a real, live signal behind it (not a checkbox). */
function isAutoDetected(task: SetupTask): boolean {
  return task.detect.kind === 'capability'
    || task.detect.kind === 'env'
    || task.detect.kind === 'derived';
}

/** Is this task satisfied by the live signal? (Only for auto-detected kinds.) */
function satisfiedBySignal(task: SetupTask, signal: SetupSignal): boolean {
  const d = task.detect;
  switch (d.kind) {
    case 'capability':
      return signal.caps[d.cap] === true;
    case 'env':
      return d.anyOf.some((name) => signal.env[name] === true);
    case 'derived':
      return signal.derived[d.key] === true;
    default:
      return false;
  }
}

function statusFor(task: SetupTask, satisfied: boolean): SetupStatus {
  if (task.detect.kind === 'info') return 'reference';
  if (satisfied) return 'done';
  return task.priority === 'optional' ? 'optional-todo' : 'action-needed';
}

/**
 * Resolve one task against the live signal + the set of task ids the owner
 * has manually marked done. Live signals win for anything observable;
 * acknowledgements only decide `manual` tasks.
 */
export function resolveTask(
  task: SetupTask,
  signal: SetupSignal,
  acknowledged: ReadonlySet<string>,
): ResolvedTask {
  const auto = isAutoDetected(task);
  const satisfied = auto
    ? satisfiedBySignal(task, signal)
    : acknowledged.has(task.id); // manual/info: only the owner can complete it
  return { ...task, status: statusFor(task, satisfied), autoDetected: auto && satisfied };
}

/** De-duplicate by id (earlier wins — catalog before generated). */
export function dedupeById(tasks: SetupTask[]): SetupTask[] {
  const seen = new Set<string>();
  const out: SetupTask[] = [];
  for (const t of tasks) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

/** Resolve + sort the whole set. Order: status (to-do first), then priority. */
export function resolveAll(
  tasks: SetupTask[],
  signal: SetupSignal,
  acknowledged: ReadonlySet<string>,
): ResolvedTask[] {
  const STATUS_RANK: Record<SetupStatus, number> = {
    'action-needed': 0, 'optional-todo': 1, done: 2, reference: 3,
  };
  return dedupeById(tasks)
    .map((t) => resolveTask(t, signal, acknowledged))
    .sort((a, b) => {
      const s = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (s !== 0) return s;
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (p !== 0) return p;
      return a.title.localeCompare(b.title);
    });
}

/** Group resolved tasks by category, in display order, dropping empty groups. */
export function groupByCategory(
  tasks: ResolvedTask[],
): { category: SetupCategory; label: string; blurb: string; tasks: ResolvedTask[] }[] {
  return CATEGORY_ORDER
    .map((category) => ({
      category,
      label: CATEGORY_META[category].label,
      blurb: CATEGORY_META[category].blurb,
      tasks: tasks.filter((t) => t.category === category),
    }))
    .filter((g) => g.tasks.length > 0);
}

/** Headline numbers for the progress meter. Info/reference cards don't count. */
export function summarize(tasks: ResolvedTask[]): SetupSummary {
  const counted = tasks.filter((t) => t.status !== 'reference');
  const essentials = counted.filter((t) => t.priority !== 'optional');
  const optional = counted.filter((t) => t.priority === 'optional');
  return {
    essentialsTotal: essentials.length,
    essentialsDone: essentials.filter((t) => t.status === 'done').length,
    optionalTotal: optional.length,
    optionalDone: optional.filter((t) => t.status === 'done').length,
    requiredOutstanding: counted.filter(
      (t) => t.priority === 'required' && t.status !== 'done',
    ).length,
  };
}
