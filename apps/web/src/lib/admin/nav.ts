// ============================================================
// SwingVantage Admin — navigation model (single source of truth)
// ------------------------------------------------------------
// Every admin section is declared ONCE here. The sidebar, the
// Command Center grid, breadcrumbs and global search all read from
// this array, so adding a section later is a one-line change.
//
// `built` marks whether the destination route exists yet (sections
// land wave-by-wave). Unbuilt items render disabled with a "Soon"
// chip rather than 404-ing. `external` marks a pre-existing tool we
// link to but do not own. `permission` (optional) gates visibility
// by RBAC role — undefined means "any admin".
// ============================================================

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, Activity, Upload, Brain, FileText, Search, Trophy,
  Wand2, Share2, Clapperboard, DollarSign, Megaphone, TrendingUp, BarChart3,
  Lightbulb, Mail, LifeBuoy, MessageSquare, Bell, Plug, Flag, ScrollText,
  ShieldCheck, Scale, Settings, GraduationCap, Newspaper, BookOpen, Rocket,
  Inbox, ClipboardCheck, BrainCircuit, Gauge, Blend, Telescope, ScanSearch, Sparkles, Bot, Dumbbell, Contrast,
} from 'lucide-react';
import type { Permission } from './rbac';

export type NavGroupId =
  | 'overview'
  | 'people'
  | 'media-ai'
  | 'content'
  | 'growth'
  | 'support'
  | 'operations'
  | 'governance'
  | 'learn';

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

/** Display order of the sidebar groups. */
export const NAV_GROUPS: NavGroup[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People' },
  { id: 'media-ai', label: 'Media & AI' },
  { id: 'content', label: 'Content' },
  { id: 'growth', label: 'Growth & Money' },
  { id: 'support', label: 'Support' },
  { id: 'operations', label: 'Operations' },
  { id: 'governance', label: 'Governance' },
  { id: 'learn', label: 'Learn' },
];

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroupId;
  /** One-line "what this section does" — shown as a tooltip and on cards. */
  blurb: string;
  /** RBAC permission required to see/use the section (undefined = any admin). */
  permission?: Permission;
  /** Whether the destination route exists yet (false → disabled "Soon"). */
  built: boolean;
  /** True for pre-existing tools we link to but did not build here. */
  external?: boolean;
  /** Extra keywords to help global search match. */
  keywords?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  // ── Overview ───────────────────────────────────────────────
  {
    id: 'home', label: 'Command Center', href: '/admin', icon: LayoutDashboard,
    group: 'overview', built: true,
    blurb: 'Your daily operating room — platform health, alerts and what to do next.',
    keywords: ['home', 'dashboard', 'overview', 'kpi'],
  },
  {
    id: 'copilot', label: 'Admin Copilot', href: '/admin/copilot', icon: Sparkles,
    group: 'overview', built: true, permission: 'analytics.view',
    blurb: 'Ask plain-English questions about your platform and get answers computed from your live admin data — what to improve next, which sport is most active, what needs review. Read-only, never destructive.',
    keywords: ['copilot', 'assistant', 'ai', 'ask', 'help me', 'what should i do', 'next best action', 'chat', 'advisor', 'recommend', 'questions'],
  },
  {
    id: 'setup', label: 'Setup & Next Steps', href: '/admin/setup', icon: Rocket,
    group: 'overview', built: true,
    blurb: 'Beginner-friendly checklist of every key, database file and manual step — with copy-paste values.',
    keywords: ['setup', 'getting started', 'next steps', 'onboarding', 'install', 'configure', 'keys', 'env', 'checklist', 'to-do', 'instructions', 'how to'],
  },
  {
    id: 'action-center', label: 'Action Center', href: '/admin/approvals', icon: Inbox,
    group: 'overview', built: true,
    blurb: 'One inbox for everything that needs you — drafts to approve, SEO & video opportunities, audit findings — each linking to the tool that handles it.',
    keywords: ['approvals', 'approve', 'review', 'inbox', 'queue', 'todo', 'tasks', 'pending', 'opportunities', 'needs attention', 'implement'],
  },
  {
    id: 'audits', label: 'Audit Reports', href: '/admin/audits', icon: ClipboardCheck,
    group: 'overview', built: true,
    blurb: 'Every internal audit robot’s findings (SEO, AI, Engagement, Build-health) surfaced in-app, with open → in-progress → done tracking.',
    keywords: ['audit', 'audits', 'reports', 'findings', 'seo audit', 'ai audit', 'security audit', 'master report', 'opportunities', 'recommendations'],
  },
  {
    id: 'central-intelligence', label: 'Central Intelligence', href: '/admin/central-intelligence', icon: BrainCircuit,
    group: 'overview', built: true,
    blurb: 'The platform intelligence brain: ethical user memory, profile & session intelligence, the Founding Members campaign, recommendations and data governance.',
    keywords: ['central intelligence', 'centralintelligenceos', 'intelligence', 'memory', 'founding', 'founding fathers', 'founding members', 'campaign', 'profile completion', 'sessions', 'recommendations', 'governance', 'brain', 'os'],
  },
  {
    id: 'development', label: 'Development Roadmap', href: '/admin/development', icon: Telescope,
    group: 'overview', built: true,
    blurb: 'Features & technologies in development, in plain product language — what is live, in development, and planned across the coaching-intelligence initiative, with its ethics guarantees and feature flags.',
    keywords: ['development', 'roadmap', 'innovation', 'innovation lab', 'features in development', 'technology', 'coaching intelligence', 'coach mix', 'curated drills', 'trend intelligence', 'whats next', 'planned', 'vision'],
  },
  {
    id: 'mental-performance', label: 'Mental Performance', href: '/admin/mental-performance', icon: Brain,
    group: 'overview', built: true,
    blurb: 'Manage the emotion-management & mistake-recovery pillar: routine library, training plans, coach vocabularies, the Mental Performance Intelligence layer (CentralIntelligenceOS), GrowthOS opportunities and the safety/crisis configuration. Performance coaching only — never therapy.',
    keywords: ['mental', 'mental performance', 'mindset', 'emotion', 'composure', 'confidence', 'reset', 'recovery', 'routine', 'sport psychology', 'meditation', 'pressure', 'journal', 'intelligence', 'crisis', 'safety'],
  },

  // ── People ─────────────────────────────────────────────────
  {
    id: 'users', label: 'Users', href: '/admin/users', icon: Users,
    group: 'people', built: true, permission: 'users.view',
    blurb: 'Every account: search, inspect their full journey, suspend or export.',
    keywords: ['accounts', 'members', 'people', 'signups'],
  },
  {
    id: 'athletes', label: 'Athletes', href: '/admin/athletes', icon: Activity,
    group: 'people', built: true, permission: 'users.view',
    blurb: 'Per-sport athlete profiles, skill levels, goals and equipment.',
    keywords: ['profiles', 'players', 'golf', 'tennis', 'baseball'],
  },
  {
    id: 'benchmarks', label: 'Grading Benchmarks', href: '/admin/benchmarks', icon: Gauge,
    group: 'people', built: true, permission: 'users.view',
    blurb: 'Tune the per-profile, per-dimension scores golf sessions are graded against.',
    keywords: ['grading', 'benchmark', 'profile', 'beginner', 'professional', 'score'],
  },

  // ── Media & AI ─────────────────────────────────────────────
  {
    id: 'uploads', label: 'Uploads & Media', href: '/admin/uploads', icon: Upload,
    group: 'media-ai', built: true, permission: 'media.view',
    blurb: 'Analyzed swing videos & photos (metadata) — review, re-run, retention.',
    keywords: ['videos', 'media', 'photos', 'storage'],
  },
  {
    id: 'ai-analyses', label: 'AI Analyses', href: '/admin/ai-analyses', icon: Brain,
    group: 'media-ai', built: true, permission: 'ai.review',
    blurb: 'Review AI swing outputs, confidence and quality queues.',
    keywords: ['analysis', 'model', 'confidence', 'review'],
  },
  {
    id: 'ai-quality', label: 'AI Output Quality', href: '/admin/ai-quality', icon: Brain,
    group: 'media-ai', built: true, permission: 'ai.review',
    blurb: 'Keyless audit of the coaching/AI prose the product ships — safety language (no medical claims), honesty (no overpromising), confidence calibration and clarity — flagging copy that needs a human edit.',
    keywords: ['ai quality', 'output quality', 'coaching quality', 'safety language', 'hallucination', 'overpromising', 'clarity', 'readability', 'confidence calibration', 'content qa', 'trust'],
  },
  {
    id: 'agents', label: 'Agent Registry', href: '/admin/agents', icon: Bot,
    group: 'media-ai', built: true,
    blurb: 'One honest inventory of every agent & automation — what each does, what it reads/produces, keyless vs optional-AI, how it is turned on/off, its safety guardrails, and where to inspect it.',
    keywords: ['agents', 'agent registry', 'ai agents', 'automations', 'workflows', 'bots', 'growth agents', 'guardrails', 'inventory', 'orchestrator'],
  },
  {
    id: 'coach-mix', label: 'Coach Mix', href: '/admin/coach-mix', icon: Blend,
    group: 'media-ai', built: true,
    blurb: 'Ethical coaching-influence engine (CentralIntelligenceOS): blend coach-inspired teaching models, review what’s learned, and bias SwingVantage’s drills & explanations — original content only, admin-gated.',
    keywords: ['coach', 'coaching', 'coach mix', 'influence', 'teaching', 'swing model', 'drills', 'learning', 'central intelligence', 'style', 'blend', 'gankas', 'bender'],
  },

  // ── Content ────────────────────────────────────────────────
  {
    id: 'content', label: 'Content', href: '/admin/content', icon: FileText,
    group: 'content', built: true, permission: 'content.edit',
    blurb: 'All pages, blog, tutorials, manuals and generated fix pages.',
    keywords: ['cms', 'pages', 'articles'],
  },
  {
    id: 'drills', label: 'Drill Library', href: '/admin/drills', icon: Dumbbell,
    group: 'content', built: true, permission: 'content.edit',
    blurb: 'Unified, read-only inventory of every drill across catalogs — sport, category, difficulty, target fault, equipment and source — to see coverage and spot gaps or duplicates.',
    keywords: ['drills', 'drill library', 'practice', 'catalog', 'exercises', 'drillmatch', 'fix stack', 'coverage', 'training'],
  },
  {
    id: 'practice-plans', label: 'Practice Plans', href: '/admin/practice-plans', icon: ClipboardCheck,
    group: 'content', built: true, permission: 'content.edit',
    blurb: 'Preview the practice-planner across sports & skill levels (plus a youth variant) — focus, warm-up, drills, pressure test and success metric. Read-only; plans are generated per athlete.',
    keywords: ['practice plans', 'practice', 'planner', 'training plan', 'routine', 'session plan', 'drills', 'warmup', 'plan templates'],
  },
  {
    id: 'updates', label: 'Publishing', href: '/admin/updates', icon: Newspaper,
    group: 'content', built: true, permission: 'content.publish',
    blurb: 'Review and publish auto-generated changelog entries (Updates & Developer Updates) before they go live.',
    keywords: ['updates', 'changelog', 'dev-updates', 'publish', 'draft', 'release notes', 'announcements'],
  },
  {
    id: 'generated-fixes', label: 'Generated Fixes', href: '/admin/content/generated-fixes', icon: Wand2,
    group: 'content', built: true, permission: 'content.publish',
    blurb: 'Review queue for AI-generated repair/fix pages before they go live.',
    keywords: ['generated', 'fix', 'repair', 'queue', 'relevance'],
  },
  {
    id: 'seo', label: 'SEO / AEO / GEO', href: '/admin/seo', icon: Search,
    group: 'content', built: true, permission: 'seo.edit',
    blurb: 'Manage how SwingVantage appears in Google and AI answer engines.',
    keywords: ['search', 'keywords', 'rankings', 'schema', 'aeo', 'geo'],
  },
  {
    id: 'sports', label: 'Sports', href: '/admin/sports', icon: Trophy,
    group: 'content', built: true, permission: 'sports.manage',
    blurb: 'Configure each sport: faults, drills, fields, templates and journeys.',
    keywords: ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball'],
  },
  {
    id: 'social', label: 'Social Generator', href: '/admin/social', icon: Share2,
    group: 'content', built: true, external: true, permission: 'content.publish',
    blurb: 'Turn published content into platform-native social posts.',
    keywords: ['instagram', 'tiktok', 'x', 'linkedin', 'posts'],
  },
  {
    id: 'video-studio', label: 'Video Studio', href: '/admin/video-studio', icon: Clapperboard,
    group: 'content', built: true, external: true, permission: 'content.edit',
    blurb: 'AI video department: briefs, generation, placement and measurement.',
    keywords: ['video', 'generation', 'render'],
  },
  {
    id: 'feature-education', label: 'Feature Education', href: '/admin/feature-education', icon: BookOpen,
    group: 'content', built: true, permission: 'content.edit',
    blurb: 'Auto-generate tutorials, how-tos, videos & docs for every feature you ship.',
    keywords: ['docs', 'tutorials', 'manuals', 'how-to', 'guides', 'help center', 'registry', 'coverage', 'drift', 'education'],
  },

  // ── Growth & Money ─────────────────────────────────────────
  {
    id: 'monetization', label: 'Monetization', href: '/admin/monetization', icon: DollarSign,
    group: 'growth', built: true, permission: 'monetization.manage',
    blurb: 'Ad placements, affiliate, revenue surfaces and UX safety rules.',
    keywords: ['revenue', 'money', 'affiliate', 'rpm'],
  },
  {
    id: 'ads', label: 'AdsOS', href: '/admin/ads', icon: Megaphone,
    group: 'growth', built: true, external: true, permission: 'ads.manage',
    blurb: 'Ad network status, placements and house-ad inventory.',
    keywords: ['ads', 'network', 'placements'],
  },
  {
    id: 'growth', label: 'GrowthOS', href: '/admin/growth', icon: TrendingUp,
    group: 'growth', built: true, external: true,
    blurb: 'Omnichannel marketing OS: campaigns, channels, CRM, experiments.',
    keywords: ['marketing', 'campaigns', 'growth'],
  },
  {
    id: 'analytics', label: 'Analytics OS', href: '/admin/analytics', icon: BarChart3,
    group: 'growth', built: true, permission: 'analytics.view',
    blurb: 'Unified PostHog control center: product & web analytics, session replay, funnels, feature flags, experiments, surveys, cohorts and SQL — all in one place.',
    keywords: ['metrics', 'funnels', 'reports', 'retention', 'posthog', 'analytics os', 'web analytics', 'product analytics', 'session replay', 'feature flags', 'experiments', 'ab test', 'surveys', 'cohorts', 'hogql', 'sql', 'events'],
  },
  {
    id: 'insights', label: 'Insights', href: '/admin/insights', icon: Lightbulb,
    group: 'growth', built: true, external: true, permission: 'analytics.view',
    blurb: 'Product insight panels and growth-agent recommendations.',
    keywords: ['insights', 'agents'],
  },
  {
    id: 'reengage', label: 'Re-engage', href: '/admin/reengage', icon: Mail,
    group: 'growth', built: true, external: true,
    blurb: 'Lifecycle re-engagement and churn-aware outreach.',
    keywords: ['retention', 'churn', 'email', 'lifecycle'],
  },

  // ── Support ────────────────────────────────────────────────
  {
    id: 'support', label: 'Support', href: '/admin/support', icon: LifeBuoy,
    group: 'support', built: true, permission: 'support.manage',
    blurb: 'Support tickets with user context, assignment and status.',
    keywords: ['tickets', 'help', 'inbox'],
  },
  {
    id: 'feedback', label: 'Feedback', href: '/admin/feedback', icon: MessageSquare,
    group: 'support', built: true, permission: 'support.manage',
    blurb: 'AI/page/tutorial feedback and the feedback-to-roadmap workflow.',
    keywords: ['feedback', 'bugs', 'feature requests', 'roadmap'],
  },
  {
    id: 'notifications', label: 'Notifications', href: '/admin/notifications', icon: Bell,
    group: 'support', built: true,
    blurb: 'Admin notification center: failures, reviews, opportunities, incidents.',
    keywords: ['alerts', 'notifications'],
  },

  // ── Operations ─────────────────────────────────────────────
  {
    id: 'system-health', label: 'System Health', href: '/admin/system-health', icon: Activity,
    group: 'operations', built: true, permission: 'logs.view',
    blurb: 'Integrations, queues, jobs and incidents — in plain English.',
    keywords: ['health', 'status', 'uptime', 'queue', 'jobs'],
  },
  {
    id: 'qa', label: 'QA & Testing', href: '/admin/qa', icon: ClipboardCheck,
    group: 'operations', built: true, permission: 'logs.view',
    blurb: 'A generated manual-QA checklist that tracks the app as it grows — per admin section, AI agent and sport, plus accessibility, mobile, theming and SEO checks. Work P0 first.',
    keywords: ['qa', 'testing', 'test', 'quality assurance', 'checklist', 'regression', 'scenarios', 'accessibility', 'contrast', 'release checklist', 'smoke test'],
  },
  {
    id: 'data-quality', label: 'Data Quality', href: '/admin/data-quality', icon: Search,
    group: 'operations', built: true, permission: 'logs.view',
    blurb: 'Keyless hygiene checks over your content registry — duplicate slugs/titles/meta/keywords, length problems, thin content, mis-tagged sports, missing CTAs — each linking to the fix.',
    keywords: ['data quality', 'hygiene', 'duplicates', 'duplicate content', 'cannibalization', 'orphaned', 'broken links', 'thin content', 'mistagged', 'stale', 'cleanup', 'integrity'],
  },
  {
    id: 'integrations', label: 'Integrations', href: '/admin/integrations', icon: Plug,
    group: 'operations', built: true, permission: 'integrations.manage',
    blurb: 'Every connected service, its state, and a safe test-connection.',
    keywords: ['api', 'providers', 'connections', 'keys'],
  },
  {
    id: 'audit-access', label: 'External Auditor Access', href: '/admin/audit-access', icon: ScanSearch,
    group: 'operations', built: true, permission: 'integrations.manage',
    blurb: 'Give an external auditor (e.g. ChatGPT) read-only access to a single JSON packet — verbatim sitemap & robots, the logged-in app surface, analytics overview — so it can audit the whole app on request.',
    keywords: ['audit', 'auditor', 'chatgpt', 'external', 'analysis', 'review', 'read-only', 'sitemap', 'robots', 'api/audit', 'token', 'inspect', 'crawl'],
  },
  {
    id: 'feature-flags', label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag,
    group: 'operations', built: true, permission: 'flags.manage',
    blurb: 'Turn features on/off, roll out by segment, and roll back safely.',
    keywords: ['flags', 'rollout', 'beta', 'experiments'],
  },
  {
    id: 'audit-log', label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText,
    group: 'operations', built: true, permission: 'logs.view',
    blurb: 'Every admin action: who changed what, when, before and after.',
    keywords: ['audit', 'log', 'history', 'activity'],
  },

  // ── Governance ─────────────────────────────────────────────
  {
    id: 'security', label: 'Security & Roles', href: '/admin/security', icon: ShieldCheck,
    group: 'governance', built: true, permission: 'admins.manage',
    blurb: 'Admin roles, permission matrix and security posture.',
    keywords: ['roles', 'permissions', 'rbac', '2fa', 'security'],
  },
  {
    id: 'legal', label: 'Legal & Privacy', href: '/admin/legal', icon: Scale,
    group: 'governance', built: true, permission: 'legal.manage',
    blurb: 'Policies, disclaimers, consent and data export/deletion requests.',
    keywords: ['legal', 'privacy', 'gdpr', 'consent', 'compliance'],
  },
  {
    id: 'accessibility', label: 'Theme & Accessibility', href: '/admin/accessibility', icon: Contrast,
    group: 'governance', built: true, permission: 'logs.view',
    blurb: 'Live WCAG contrast audit of every theme — scores the readability-critical text/background pairs and flags anything below AA, preventing unreadable (white-on-white) themes.',
    keywords: ['accessibility', 'a11y', 'theme', 'themes', 'contrast', 'wcag', 'readability', 'color', 'white on white', 'dark mode', 'aa', 'aaa'],
  },
  {
    id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings,
    group: 'governance', built: true, permission: 'settings.manage',
    blurb: 'General, brand, upload, AI, SEO, email and notification settings.',
    keywords: ['settings', 'config', 'brand', 'preferences'],
  },

  // ── Learn ──────────────────────────────────────────────────
  {
    id: 'learning', label: 'Admin Academy', href: '/admin/learning', icon: GraduationCap,
    group: 'learn', built: true,
    blurb: 'New here? Guided onboarding, playbooks and a glossary for operators.',
    keywords: ['learn', 'help', 'onboarding', 'academy', 'docs', 'tutorial'],
  },
  {
    id: 'staff-academy', label: 'Staff Academy', href: '/admin/academy', icon: Newspaper,
    group: 'learn', built: true, external: true,
    blurb: 'Internal enablement LMS: courses, certifications and simulations.',
    keywords: ['lms', 'training', 'staff'],
  },
];

/** Items visible to a role (filters by permission). */
export function navItemsForRole(
  hasPermission: (p: Permission) => boolean,
): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.permission || hasPermission(i.permission));
}

/** Group the (already permission-filtered) items for sidebar rendering. */
export function groupNavItems(items: NavItem[]): { group: NavGroup; items: NavItem[] }[] {
  return NAV_GROUPS.map((group) => ({
    group,
    items: items.filter((i) => i.group === group.id),
  })).filter((g) => g.items.length > 0);
}

/** Find the nav item whose href best matches a pathname (longest prefix). */
export function activeNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined;
  for (const item of NAV_ITEMS) {
    if (pathname === item.href || pathname.startsWith(item.href + '/')) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  return best;
}

export const findNavItem = (id: string): NavItem | undefined =>
  NAV_ITEMS.find((i) => i.id === id);

/**
 * Whether a destination href corresponds to a built route. Used to gate
 * CTAs (e.g. Command Center alerts) so links never point at a "Soon"
 * section that would 404. Unknown/external hrefs are assumed routable.
 */
export function isHrefBuilt(href: string): boolean {
  const exact = NAV_ITEMS.find((i) => i.href === href);
  if (exact) return exact.built;
  const prefix = activeNavItem(href);
  return prefix ? prefix.built : true;
}
