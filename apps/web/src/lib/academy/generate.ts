// ============================================================
// SwingVantage Academy — Release-note → draft training
// ------------------------------------------------------------
// Turns a product release note into DRAFT learning objects routed
// into the CMS for human review (never auto-published). Makes the
// Academy a living system that evolves with the product, while
// keeping the "no unreviewed content" guardrail. Deterministic
// scaffolding — a human edits and publishes.
// ============================================================
import type { CmsLesson, CmsCourse } from './cms';

export interface ReleaseNote {
  title: string;
  body: string;
}

export interface RoleChecklists {
  support: string[];
  sales: string[];
  qa: string[];
  admin: string[];
}

export interface GeneratedTraining {
  lesson: CmsLesson;
  course: CmsCourse;
  checklists: RoleChecklists;
}

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Bullet/numbered lines become objectives; prose lines become walkthrough. */
function splitBody(body: string): { bullets: string[]; paras: string[] } {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
  const bullets: string[] = [];
  const paras: string[] = [];
  for (const l of lines) {
    if (/^([-*•]|\d+[.)])\s+/.test(l)) bullets.push(l.replace(/^([-*•]|\d+[.)])\s+/, ''));
    else paras.push(l);
  }
  return { bullets, paras };
}

export function generateFromRelease(note: ReleaseNote): GeneratedTraining {
  const title = note.title.trim() || 'New feature';
  const { bullets, paras } = splitBody(note.body);
  const now = new Date().toISOString();

  const objectives = (bullets.length ? bullets : [`Understand what "${title}" does`, `Explain ${title} to a user`]).slice(0, 5);
  const walkthrough = paras.length
    ? paras
    : [`${title} is a new SwingVantage capability. Review the release note and the in-app feature, then update this draft with an accurate, plain-English walkthrough.`];

  const lessonId = rid('cms-l');
  const lesson: CmsLesson = {
    id: lessonId,
    title: `What's new: ${title}`,
    estMinutes: 6,
    roleIds: 'all',
    difficulty: 'foundational',
    objectives,
    whyItMatters: `Everyone should understand ${title} so we describe, demo, support, and test it consistently and honestly.`,
    walkthrough,
    bestPractices: ['Keep claims accurate — no overpromising or medical/guarantee language.'],
    completionCriteria: 'Reviewed and approved by a human before publishing.',
    version: '0.1-draft',
    status: 'draft',
    updatedAt: now,
  };

  const course: CmsCourse = {
    id: rid('cms-c'),
    slug: `whats-new-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 60),
    title: `What's New — ${title}`,
    summary: `Release training for ${title}. Draft generated from the release note; edit and publish after review.`,
    roleIds: 'all',
    difficulty: 'foundational',
    estMinutes: 6,
    objectives,
    modules: [{ id: `${lessonId}-m`, title: 'Release', lessonIds: [lessonId] }],
    emoji: '🆕',
    status: 'draft',
    updatedAt: now,
  };

  const checklists: RoleChecklists = {
    support: [`Add ${title} to the support FAQ and macros`, `Note common questions and the first-response answer`, `Confirm the escalation path if ${title} misbehaves`],
    sales: [`Add ${title} to the demo flow where it adds value`, `Write one honest value sentence (no guarantees)`, `Prepare an objection response`],
    qa: [`Write acceptance test cases for ${title}`, `Add edge-case and mobile/accessibility checks`, `Validate any AI output against the guardrails`],
    admin: [`Document ${title} for internal operators`, `Note any feature flag, permission, or config`, `Confirm privacy/security implications`],
  };

  return { lesson, course, checklists };
}
