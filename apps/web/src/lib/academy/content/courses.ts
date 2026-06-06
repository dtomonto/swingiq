// SwingVantage Academy — Courses (seed content). One module per course
// for Phase 1 simplicity; the model supports multiple modules per course.
import type { Course } from '../types';

const mod = (id: string, title: string, lessonIds: string[]) => ({ id, title, lessonIds });

export const COURSES: Course[] = [
  // ── Foundations ────────────────────────────────────────────
  {
    id: 'c-what-is', slug: 'what-swingvantage-is', title: 'What SwingVantage Is',
    summary: 'The crisp, accurate mental model of the product everyone shares.',
    roleIds: 'all', difficulty: 'foundational', estMinutes: 13, emoji: '🧭',
    objectives: ['Describe the product in one sentence', 'Name the five sports', 'Explain the honest-by-design philosophy'],
    modules: [mod('m-what-is', 'The Basics', ['l-what-is-overview', 'l-what-is-value'])],
    badgeId: 'b-product-tour',
  },
  {
    id: 'c-sports', slug: 'supported-sports', title: 'Supported Sports Overview',
    summary: 'How the multi-sport model works across golf, tennis, baseball, and softball.',
    roleIds: 'all', difficulty: 'foundational', estMinutes: 6, emoji: '🏟️',
    sports: ['golf', 'tennis', 'baseball', 'softball'],
    objectives: ['Name all five sports', 'Describe how guidance differs by sport'],
    modules: [mod('m-sports', 'Multi-Sport', ['l-sports-overview'])],
  },
  {
    id: 'c-personas', slug: 'core-personas', title: 'Core User Personas',
    summary: 'Athlete, parent, coach, and team — and how to speak to each.',
    roleIds: 'all', difficulty: 'foundational', estMinutes: 7, emoji: '👥',
    objectives: ['Identify the personas', 'Tailor language per persona'],
    modules: [mod('m-personas', 'Who We Serve', ['l-personas'])],
  },
  {
    id: 'c-journey', slug: 'user-journey', title: 'End-to-End User Journey',
    summary: 'The full first-use journey and where each feature fits — including profile creation.',
    roleIds: 'all', difficulty: 'foundational', estMinutes: 16, emoji: '🗺️',
    objectives: ['Trace the journey', 'Create a player profile'],
    modules: [mod('m-journey', 'The Journey', ['l-journey', 'l-create-profile'])],
  },
  {
    id: 'c-responsible-ai', slug: 'responsible-ai', title: 'Responsible AI & User Trust',
    summary: 'The guardrails that keep our AI honest and our users safe.',
    roleIds: 'all', difficulty: 'intermediate', estMinutes: 10, emoji: '🛡️',
    objectives: ['Apply the guardrails', 'Rewrite non-compliant statements'],
    modules: [mod('m-rai', 'Guardrails', ['l-responsible-ai'])],
    badgeId: 'b-responsible-ai',
  },

  // ── Video Analysis Mastery ─────────────────────────────────
  {
    id: 'c-upload', slug: 'uploading-videos', title: 'How Users Upload Videos',
    summary: 'Capture, formats, camera angles, and the failures that hurt analysis.',
    roleIds: 'all', difficulty: 'foundational', estMinutes: 20, emoji: '🎥',
    objectives: ['Coach capture best practices', 'Diagnose upload/analysis failures'],
    modules: [mod('m-upload', 'Capture', ['l-upload', 'l-camera-angles'])],
  },
  {
    id: 'c-analysis', slug: 'analysis-workflow', title: 'AI Swing Analysis Workflow',
    summary: 'How feedback is generated and what confidence really means.',
    roleIds: 'all', difficulty: 'intermediate', estMinutes: 9, emoji: '⚙️',
    prerequisiteCourseIds: ['c-upload'],
    objectives: ['Describe the pipeline', 'Explain confidence'],
    modules: [mod('m-analysis', 'The Pipeline', ['l-analysis-workflow'])],
  },
  {
    id: 'c-results', slug: 'interpreting-results', title: 'Interpreting & Explaining Results',
    summary: 'Turn an analysis into a calm, clear, honest explanation for any user.',
    roleIds: 'all', difficulty: 'intermediate', estMinutes: 11, emoji: '💬',
    prerequisiteCourseIds: ['c-analysis'],
    objectives: ['Explain results in plain English', 'Frame confidence and safety'],
    modules: [mod('m-results', 'Explaining', ['l-explain-feedback'])],
  },
  {
    id: 'c-3d', slug: '3d-motion-mapping', title: '3D Motion Mapping Overview',
    summary: 'Explain the most impressive — and most misunderstood — feature, honestly.',
    roleIds: 'all', difficulty: 'intermediate', estMinutes: 11, emoji: '🧍',
    objectives: ['Explain what 3D does and does not do', 'Describe it simply'],
    modules: [mod('m-3d', '3D Insight', ['l-3d-overview'])],
  },

  // ── Coach Mode ─────────────────────────────────────────────
  {
    id: 'c-coach-dash', slug: 'coach-dashboard', title: 'Coach Dashboard Overview',
    summary: 'Manage many athletes and give each a clear next step.',
    roleIds: ['coach', 'partner', 'power-user', 'support', 'sales'], difficulty: 'intermediate', estMinutes: 8, emoji: '📋',
    objectives: ['Navigate the dashboard', 'Manage a roster'],
    modules: [mod('m-coach-dash', 'The Dashboard', ['l-coach-dash'])],
  },
  {
    id: 'c-coach-workflow', slug: 'coaching-workflow', title: 'Drills & Progress in Coach Mode',
    summary: 'Assign one fix, then prove it worked.',
    roleIds: ['coach', 'partner', 'power-user'], difficulty: 'intermediate', estMinutes: 14, emoji: '🎯',
    prerequisiteCourseIds: ['c-coach-dash'],
    objectives: ['Assign drills well', 'Review progress and retests'],
    modules: [mod('m-coach-workflow', 'Coach the Loop', ['l-assign-drills', 'l-review-progress'])],
  },

  // ── Support ────────────────────────────────────────────────
  {
    id: 'c-support-console', slug: 'support-console', title: 'Support Console & Triage',
    summary: 'A consistent method to triage and resolve tickets fast.',
    roleIds: ['support', 'admin', 'power-user'], difficulty: 'intermediate', estMinutes: 8, emoji: '🎧',
    objectives: ['Triage systematically', 'Know the first checks'],
    modules: [mod('m-support-console', 'Triage', ['l-support-triage'])],
  },
  {
    id: 'c-top-issues', slug: 'top-issues', title: 'Top User Issues & Escalation',
    summary: 'The handful of issues that drive most tickets — and when to escalate.',
    roleIds: ['support', 'admin', 'power-user'], difficulty: 'intermediate', estMinutes: 17, emoji: '🛠️',
    prerequisiteCourseIds: ['c-support-console'],
    objectives: ['Resolve frequent issues', 'Apply escalation/refund rules'],
    modules: [mod('m-top-issues', 'Resolve & Escalate', ['l-top-issues', 'l-escalation'])],
  },

  // ── Sales ──────────────────────────────────────────────────
  {
    id: 'c-positioning', slug: 'product-positioning', title: 'Product Positioning',
    summary: 'The core positioning and real differentiators.',
    roleIds: ['sales', 'partner', 'marketing'], difficulty: 'intermediate', estMinutes: 8, emoji: '📣',
    objectives: ['Deliver the positioning', 'Name differentiators'],
    modules: [mod('m-positioning', 'Position', ['l-positioning'])],
  },
  {
    id: 'c-demos', slug: 'persona-demos', title: 'Persona-Based Demos & Objections',
    summary: 'Tailor the demo to the buyer and handle objections with confidence.',
    roleIds: ['sales', 'partner'], difficulty: 'advanced', estMinutes: 20, emoji: '🎤',
    prerequisiteCourseIds: ['c-positioning'],
    objectives: ['Run persona demos', 'Handle objections'],
    modules: [mod('m-demos', 'Demo & Objections', ['l-demos', 'l-objections'])],
  },

  // ── Admin ──────────────────────────────────────────────────
  {
    id: 'c-admin', slug: 'admin-operations', title: 'Admin, Security & Privacy',
    summary: 'Operate the platform safely: tools, secrets hygiene, and privacy posture.',
    roleIds: ['admin', 'engineering', 'ai-ml'], difficulty: 'advanced', estMinutes: 17, emoji: '⚙️',
    objectives: ['Use admin tools', 'Apply secrets/privacy basics'],
    modules: [mod('m-admin', 'Operate Safely', ['l-admin-users', 'l-security-privacy'])],
  },
];
