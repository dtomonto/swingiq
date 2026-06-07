// ============================================================
// SwingVantage Academy — Learning-object model
// ------------------------------------------------------------
// The type system behind the internal enablement platform
// (/admin/academy). Content is authored as typed data
// (lib/academy/content/*), progress is a local-first Zustand
// slice (store/slices/academy), and all derivation (progress %,
// readiness, recommendations, badge/cert eligibility) is pure
// (lib/academy/engine).
//
// Hierarchy: Academy → Vantage Path → Course → Module → Lesson
//            (+ Knowledge Check quiz + Hands-on Challenge)
//            Certification = courses + challenges + final exam.
// ============================================================

/** Internal roles. A learner picks one; it drives recommendations + dashboards. */
export type AcademyRoleId =
  | 'new-hire'
  | 'executive'
  | 'product'
  | 'engineering'
  | 'ai-ml'
  | 'qa'
  | 'support'
  | 'sales'
  | 'marketing'
  | 'content'
  | 'coach'
  | 'partner'
  | 'admin'
  | 'power-user';

export interface AcademyRole {
  id: AcademyRoleId;
  label: string;
  blurb: string;
  emoji: string;
  /** Vantage Paths recommended for this role, in priority order. */
  recommendedPathSlugs: string[];
  /** The headline certification this role works toward (optional). */
  targetCertificationId?: string;
}

export type Difficulty = 'foundational' | 'intermediate' | 'advanced';

/** Progression tiers, derived from points. */
export type MasteryLevelId = 'rookie' | 'qualified' | 'pro' | 'elite';

export interface MasteryLevel {
  id: MasteryLevelId;
  label: string;
  /** Minimum points to reach this tier. */
  minPoints: number;
  blurb: string;
}

export type SportTag = 'golf' | 'tennis' | 'baseball' | 'softball' | 'all';

// ── Assessments ──────────────────────────────────────────────

export type QuestionKind = 'multiple-choice' | 'multi-select' | 'true-false' | 'scenario';

export interface Question {
  id: string;
  kind: QuestionKind;
  /** The prompt. For 'scenario', set the situation here. */
  prompt: string;
  /** Answer options (true-false uses ['True','False']). */
  options: string[];
  /** Index(es) of correct option(s). multi-select uses multiple. */
  correct: number[];
  /** Shown after answering — teaches the "why". */
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  /** 0–100 percent required to pass. */
  passingScore: number;
  /** Randomize question order on each attempt. */
  shuffle?: boolean;
  questions: Question[];
}

// ── Hands-on challenges ──────────────────────────────────────

export type ChallengeKind = 'simulation' | 'roleplay' | 'task' | 'flag-review';

export interface Challenge {
  id: string;
  title: string;
  kind: ChallengeKind;
  /** What the learner is asked to do. */
  prompt: string;
  /** The scenario/material they work against (e.g. a mock ticket, a sample analysis). */
  scenario?: string;
  /** Checklist of what a correct response must include (self-attested in Phase 1). */
  successCriteria: string[];
  /** A model answer revealed after the learner attempts it. */
  sampleSolution?: string;
  estMinutes: number;
}

// ── Lessons ──────────────────────────────────────────────────

/** A single step in a walkthrough or instruction list. */
export interface LessonStep {
  label: string;
  detail?: string;
}

export interface Lesson {
  id: string;
  title: string;
  estMinutes: number;
  roleIds: AcademyRoleId[] | 'all';
  difficulty: Difficulty;
  /** Lesson ids that should be done first (soft prerequisite, surfaced in UI). */
  prerequisites?: string[];
  objectives: string[];
  whyItMatters: string;
  /** Narrative product walkthrough (paragraphs). */
  walkthrough: string[];
  /** A concrete real-world scenario tying the lesson to the job. */
  scenario?: string;
  /** Step-by-step instructions. */
  steps?: LessonStep[];
  commonMistakes?: string[];
  bestPractices?: string[];
  /** Knowledge check quiz id. */
  quizId?: string;
  /** Hands-on challenge id. */
  challengeId?: string;
  /** What counts as "done" (shown to the learner). */
  completionCriteria?: string;
  /** Related in-app features (label + route into the real product). */
  relatedFeatures?: { label: string; route: string }[];
  /** Internal documentation links. */
  docLinks?: { label: string; href: string }[];
  /** Notes specifically for support staff. */
  supportNotes?: string;
  /** Semver-ish content version for staleness tracking. */
  version: string;
}

export interface Module {
  id: string;
  title: string;
  /** Ordered lesson ids. */
  lessonIds: string[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  roleIds: AcademyRoleId[] | 'all';
  sports?: SportTag[];
  difficulty: Difficulty;
  estMinutes: number;
  /** Course-level objectives. */
  objectives: string[];
  /** Course ids that should be completed first. */
  prerequisiteCourseIds?: string[];
  modules: Module[];
  /** Performance Badge granted on course completion. */
  badgeId?: string;
  /** Emoji/icon for the catalog card. */
  emoji?: string;
}

export interface VantagePath {
  id: string;
  slug: string;
  title: string;
  /** One-paragraph purpose. */
  purpose: string;
  roleIds: AcademyRoleId[] | 'all';
  /** Ordered course ids that make up the path. */
  courseIds: string[];
  difficulty: Difficulty;
  /** Certification this path works toward (optional). */
  certificationId?: string;
  emoji: string;
  /** Tailwind accent token suffix, e.g. 'primary' | 'accent-secondary'. */
  accent?: string;
}

// ── Badges & certifications ──────────────────────────────────

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  emoji: string;
  /** How it's earned, in plain English (shown in the gallery). */
  criteria: string;
}

export interface Certification {
  id: string;
  name: string;
  description: string;
  /** All of these courses must be complete. */
  requiredCourseIds: string[];
  /** All of these challenges must be submitted. */
  requiredChallengeIds?: string[];
  /** Final assessment quiz id (must pass). */
  finalAssessmentQuizId?: string;
  passingScore: number;
  /** Months until recertification is required (null = never expires). */
  expiresMonths: number | null;
  /** Badge granted on certification. */
  badgeId: string;
  emoji: string;
}

// ── Progress (persisted in the Zustand store) ────────────────

export interface QuizAttemptRecord {
  attempts: number;
  bestScore: number;
  passed: boolean;
  lastAttemptAt: string;
}

export interface CertificationRecord {
  earnedAt: string;
  /** ISO date this cert expires, or null if it never does. */
  expiresAt: string | null;
}

/** A learning assignment (self- or manager-assigned). */
export interface Assignment {
  id: string;
  targetType: 'course' | 'path';
  targetId: string;
  assignedBy?: string;
  /** ISO due date, optional. */
  dueAt?: string;
  createdAt: string;
}

export interface AcademyProgress {
  /** Selected role; null until the learner picks one. */
  roleId: AcademyRoleId | null;
  /** Completed lesson ids. */
  completedLessonIds: string[];
  /** Quiz results keyed by quiz id. */
  quizAttempts: Record<string, QuizAttemptRecord>;
  /** Simulation results keyed by simulation id (Phase 6). */
  simulationAttempts: Record<string, QuizAttemptRecord>;
  /** Challenge submissions keyed by challenge id → ISO submittedAt. */
  challengeSubmissions: Record<string, string>;
  /** Earned badges keyed by badge id → ISO earnedAt. */
  earnedBadges: Record<string, string>;
  /** Earned certifications keyed by cert id. */
  certifications: Record<string, CertificationRecord>;
  /** Lifetime points. */
  points: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  /** Distinct yyyy-mm-dd days the learner was active — powers streaks/momentum. */
  activityDays: string[];
  /** Optional display name printed on certificates. */
  learnerName?: string;
  /** Assigned courses/paths (self- or manager-assigned). */
  assignments: Assignment[];
}

export const DEFAULT_ACADEMY_PROGRESS: AcademyProgress = {
  roleId: null,
  completedLessonIds: [],
  quizAttempts: {},
  simulationAttempts: {},
  challengeSubmissions: {},
  earnedBadges: {},
  certifications: {},
  points: 0,
  startedAt: null,
  lastActivityAt: null,
  activityDays: [],
  assignments: [],
};

// ── Points economy (premium, restrained) ─────────────────────
export const POINTS = {
  lesson: 10,
  quizPass: 25,
  challenge: 30,
  simulation: 35,
  certification: 150,
} as const;

export const MASTERY_LEVELS: MasteryLevel[] = [
  { id: 'rookie', label: 'Rookie', minPoints: 0, blurb: 'Getting oriented.' },
  { id: 'qualified', label: 'Qualified', minPoints: 150, blurb: 'Job-ready on the basics.' },
  { id: 'pro', label: 'Pro', minPoints: 500, blurb: 'Fluent and demo-ready.' },
  { id: 'elite', label: 'Elite', minPoints: 1200, blurb: 'A go-to expert others learn from.' },
];
