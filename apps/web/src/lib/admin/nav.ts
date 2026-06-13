// ============================================================
// SwingVantage Admin — navigation model (single source of truth)
// ------------------------------------------------------------
// Every admin section is declared ONCE here. The sidebar, the
// Command Center grid, breadcrumbs and global search all read from
// this array, so adding a section later is a one-line change.
//
// Organized by the QUESTION the operator is asking, not by what was
// built: Operate (is it working? who needs help?) · Grow (is it
// growing? what ships?) · Product (what is the product?) · System
// (is the machine sound?). The `subgroup` on each item names its
// canonical section — the surface these pages consolidate into as the
// Admin OS redesign lands wave-by-wave (Product Health, Video
// Analysis, Decision Center, …). Until those consolidated pages exist,
// the pages stay individually reachable under their section subgroup.
//
// `built` marks whether the destination route exists yet (sections
// land wave-by-wave). Unbuilt items render disabled with a "Soon"
// chip rather than 404-ing. `external` marks a pre-existing tool we
// link to but do not own. `permission` (optional) gates visibility
// by RBAC role — undefined means "any admin". Internal codenames
// (PublishingOS, securityOS, …) survive only as search `keywords`,
// never as labels.
// ============================================================

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Users, Activity, Upload, Brain, FileText, Search, Trophy,
  Wand2, Share2, Clapperboard, DollarSign, Megaphone, TrendingUp, BarChart3,
  Lightbulb, Mail, LifeBuoy, MessageSquare, Bell, Plug, Flag, ScrollText,
  ShieldCheck, Scale, Settings, GraduationCap, Newspaper, BookOpen, Rocket,
  Inbox, ClipboardCheck, BrainCircuit, Gauge, Blend, Telescope, ScanSearch, Sparkles, Bot, Dumbbell, Contrast, ShieldAlert, SquarePen, ClipboardList, Coins, GitBranch, Milestone, Images, Eye, Send, Video, Radar, Network,
} from 'lucide-react';
import type { Permission } from './rbac';

export type NavGroupId =
  | 'pinned'
  | 'operate'
  | 'grow'
  | 'product'
  | 'system';

export interface NavGroup {
  id: NavGroupId;
  label: string;
}

/** Display order of the sidebar groups. Pinned carries no label. */
export const NAV_GROUPS: NavGroup[] = [
  { id: 'pinned', label: '' },
  { id: 'operate', label: 'Operate' },
  { id: 'grow', label: 'Grow' },
  { id: 'product', label: 'Product' },
  { id: 'system', label: 'System' },
];

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: NavGroupId;
  /** Canonical section this page consolidates into — shown as a subgroup
   *  header so large intent groups stay scannable. */
  subgroup?: string;
  /** One-line "what this section does" — shown as a tooltip and on cards. */
  blurb: string;
  /** RBAC permission required to see/use the section (undefined = any admin). */
  permission?: Permission;
  /** Whether the destination route exists yet (false → disabled "Soon"). */
  built: boolean;
  /** True for pre-existing tools we link to but did not build here. */
  external?: boolean;
  /** Extra keywords to help global search match (incl. internal codenames). */
  keywords?: string[];
  /** Red dot: a live incident exists for this section. Mutually exclusive
   *  with a count. Fed from the shell via sectionCounts. */
  incidentDot?: boolean;
  /** Count-pill colour: neutral (work waiting) vs amber (decision waiting). */
  countType?: 'work' | 'decision';
  /** Extra href prefixes that also activate this item in the sidebar — used when
   *  absorbed surfaces keep their own routes but appear as tabs of this entry. */
  matches?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  // ══ Pinned ═════════════════════════════════════════════════
  {
    id: 'home', label: 'Command Center', href: '/admin', icon: LayoutDashboard,
    group: 'pinned', built: true,
    blurb: 'Your daily operating room — platform health, alerts and what to do next.',
    keywords: ['home', 'dashboard', 'overview', 'kpi'],
  },
  {
    id: 'today-command-center', label: "Today's Tasks", href: '/admin/command-center', icon: Gauge,
    group: 'pinned', built: true,
    blurb: 'DailyActionIntelligenceOS — a prioritized, transparently-scored "to do today" list computed from live signals (drill coverage, audit findings, doc gaps, setup, analytics). Each item explains why it matters, what data is missing, the exact steps, the impact, and how completion is detected.',
    keywords: ['command center', 'today', 'daily', 'cockpit', 'recommendations', 'priorities', 'to do today', 'data gaps', 'feature readiness', 'intelligence scan', 'daily action', 'what should i do', 'operating system', 'briefing'],
  },

  // ══ Operate — is it working? who needs help? ═══════════════
  // Product Health
  {
    id: 'health', label: 'Product Health', href: '/admin/health', icon: Activity,
    group: 'operate', subgroup: 'Product Health', built: true, permission: 'logs.view',
    blurb: 'One place for what’s running and what’s broken — system status, reliability, QA and data quality.',
    keywords: ['health', 'product health', 'overview', 'status', 'incidents', 'what is wrong', 'system health', 'integrations', 'uptime', 'queue', 'jobs', 'reliability', 'reliabilityos', 'failures', 'errors', 'monitoring', 'observability', 'qa', 'testing', 'quality assurance', 'data quality', 'hygiene', 'duplicates'],
    // System Health · Reliability · QA · Data Quality are now tabs of Product
    // Health (HealthTabs); their routes stay live and `matches` keeps this entry
    // active in the sidebar on any of them.
    matches: ['/admin/system-health', '/admin/reliability', '/admin/qa', '/admin/data-quality'],
  },
  // Video Analysis
  {
    id: 'uploads', label: 'Uploads & Media', href: '/admin/uploads', icon: Upload,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'media.view',
    blurb: 'Analyzed swing videos & photos (metadata) — review, re-run, retention.',
    keywords: ['videos', 'media', 'photos', 'storage', 'video analysis'],
  },
  {
    id: 'analysis-jobs', label: 'Analysis Jobs', href: '/admin/analysis-jobs', icon: ClipboardList,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'logs.view',
    blurb: 'Every swing analysis as a traceable job — lifecycle status, confidence, AI provider/model, retries. Retry, request a rerun, send low-confidence runs to human review. Recorded device-local (fleet mirror deferred).',
    keywords: ['analysis jobs', 'job monitor', 'pipeline', 'lifecycle', 'queue', 'status', 'failed', 'needs review', 'human review', 'rerun', 'retry', 'confidence', 'traceability', 'video analysis'],
  },
  {
    id: 'record-assist', label: 'Recording', href: '/admin/record-assist', icon: Video,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'media.view',
    blurb: 'Guided on-device self-recording: sport/action presets, the Frame Readiness scoring model, the voice-guidance catalog, device-compatibility tiers, and a camera-free QA simulator that runs the real engines.',
    keywords: ['record', 'recordassist', 'record assist', 'camera', 'guided recording', 'framing', 'readiness', 'voice guidance', 'pose', 'capture', 'self-record', 'kinetic', 'overlay'],
  },
  {
    id: 'ai-analyses', label: 'AI Analyses', href: '/admin/ai-analyses', icon: Brain,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'ai.review',
    blurb: 'Review AI swing outputs, confidence and quality queues.',
    keywords: ['analysis', 'model', 'confidence', 'review'],
  },
  {
    id: 'ai-quality', label: 'AI Output Quality', href: '/admin/ai-quality', icon: Brain,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'ai.review',
    blurb: 'Keyless audit of the coaching/AI prose the product ships — safety language (no medical claims), honesty (no overpromising), confidence calibration and clarity — flagging copy that needs a human edit.',
    keywords: ['ai quality', 'output quality', 'coaching quality', 'safety language', 'hallucination', 'overpromising', 'clarity', 'readability', 'confidence calibration', 'content qa', 'trust'],
  },
  {
    id: 'motion-lab', label: 'Motion', href: '/admin/motion-lab', icon: Activity,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'ai.review',
    blurb: 'The movement-intelligence control surface: every sport’s motion profile (phases, movement model, overlays), how the Motion Score is composed, the overlay density presets, and a low-confidence review queue computed from on-device sessions. Read-only — honest about single-camera estimates.',
    keywords: ['motion lab', 'motionlab', 'motion', 'movement', 'biomechanics', 'overlays', 'phases', 'profiles', 'scoring weights', 'continuous movement', 'recovery', 'rally', 'low confidence', 'review queue', 'tennis', 'pickleball', 'padel', 'golf', 'swing'],
  },
  {
    id: 'ai-usage', label: 'AI Usage & Billing', href: '/admin/ai-usage', icon: Coins,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'logs.view',
    blurb: 'Track what AI is costing — by feature and by day — and top up provider capacity (pay for more usage) without leaving the dashboard.',
    keywords: ['ai usage', 'ai cost', 'ai spend', 'billing', 'pay', 'top up', 'credits', 'budget', 'tokens', 'metering', 'openai', 'anthropic', 'claude', 'gemini', 'add capacity', 'cost guard', 'wallet'],
  },
  {
    id: 'ai-provider', label: 'AI Provider Control', href: '/admin/ai-provider', icon: Network,
    group: 'operate', subgroup: 'Video Analysis', built: true, permission: 'logs.view',
    blurb: 'The strategic AI routing layer: which provider + model handles each task (Gemini video, OpenAI coach, MediaPipe measurement, Claude narrative), provider health, and a durable per-task override you can change without a redeploy.',
    keywords: ['ai provider', 'ai routing', 'provider control', 'model registry', 'gemini', 'openai', 'anthropic', 'claude', 'mediapipe', 'orchestration', 'router', 'route', 'video understanding', 'coach model', 'failover', 'provider health', 'control center'],
  },
  {
    id: 'agents', label: 'Agent Registry', href: '/admin/agents', icon: Bot,
    group: 'operate', subgroup: 'Video Analysis', built: true,
    blurb: 'One honest inventory of every agent & automation — what each does, what it reads/produces, keyless vs optional-AI, how it is turned on/off, its safety guardrails, and where to inspect it.',
    keywords: ['agents', 'agent registry', 'ai agents', 'automations', 'workflows', 'bots', 'growth agents', 'guardrails', 'inventory', 'orchestrator'],
  },
  // Decision Center
  {
    id: 'decisions', label: 'Decision Center', href: '/admin/decisions', icon: Scale,
    group: 'operate', subgroup: 'Decision Center', built: true, countType: 'decision',
    blurb: 'One ranked queue for every decision that needs you — approvals, audit findings and review queues, top-down by priority.',
    keywords: ['decisions', 'decision center', 'queue', 'priority', 'what needs me', 'ranked', 'approve', 'review queue', 'triage'],
  },
  {
    id: 'action-center', label: 'Action Center', href: '/admin/approvals', icon: Inbox,
    group: 'operate', subgroup: 'Decision Center', built: true, countType: 'work',
    blurb: 'One inbox for everything that needs you — drafts to approve, SEO & video opportunities, audit findings — each linking to the tool that handles it.',
    keywords: ['approvals', 'approve', 'review', 'inbox', 'queue', 'todo', 'tasks', 'pending', 'opportunities', 'needs attention', 'implement', 'decision center', 'decisions'],
  },
  {
    id: 'audits', label: 'Audit Reports', href: '/admin/audits', icon: ClipboardCheck,
    group: 'operate', subgroup: 'Decision Center', built: true, countType: 'work',
    blurb: 'Every internal audit robot’s findings (SEO, AI, Engagement, Build-health) surfaced in-app, with open → in-progress → done tracking.',
    keywords: ['audit', 'audits', 'reports', 'findings', 'seo audit', 'ai audit', 'security audit', 'master report', 'opportunities', 'recommendations'],
  },
  {
    id: 'notifications', label: 'Notifications', href: '/admin/notifications', icon: Bell,
    group: 'operate', subgroup: 'Decision Center', built: true,
    blurb: 'Admin notification center: failures, reviews, opportunities, incidents.',
    keywords: ['alerts', 'notifications'],
  },
  // Users & Athletes
  {
    id: 'users', label: 'Users', href: '/admin/users', icon: Users,
    group: 'operate', subgroup: 'Users & Athletes', built: true, permission: 'users.view',
    blurb: 'Every account: search, inspect their full journey, suspend or export.',
    keywords: ['accounts', 'members', 'people', 'signups'],
  },
  {
    id: 'athletes', label: 'Athletes', href: '/admin/athletes', icon: Activity,
    group: 'operate', subgroup: 'Users & Athletes', built: true, permission: 'users.view',
    blurb: 'Per-sport athlete profiles, skill levels, goals and equipment.',
    keywords: ['profiles', 'players', 'golf', 'tennis', 'baseball'],
  },
  {
    id: 'benchmarks', label: 'Grading Benchmarks', href: '/admin/benchmarks', icon: Gauge,
    group: 'operate', subgroup: 'Users & Athletes', built: true, permission: 'users.view',
    blurb: 'Tune the per-profile, per-dimension scores golf sessions are graded against.',
    keywords: ['grading', 'benchmark', 'profile', 'beginner', 'professional', 'score'],
  },
  {
    id: 'research', label: 'Research & Benchmarks', href: '/admin/research', icon: Telescope,
    group: 'operate', subgroup: 'Users & Athletes', built: true, permission: 'users.view',
    blurb: 'Golf Research & Benchmark Evolution — a 90-day cycle that scores curated sources and generates evidence-backed benchmark-change proposals for admin review (approve / reject / defer). Nothing changes automatically; approved changes publish as a new benchmark version. Dry-run + audit-logged.',
    keywords: ['research', 'benchmark', 'evolution', 'proposals', 'sources', 'evidence', 'grading', 'golf', 'quarterly', 'review', '90-day'],
  },
  {
    id: 'central-intelligence', label: 'Central Intelligence', href: '/admin/central-intelligence', icon: BrainCircuit,
    group: 'operate', subgroup: 'Users & Athletes', built: true,
    blurb: 'The platform intelligence brain: ethical user memory, profile & session intelligence, the Founding Members campaign, recommendations and data governance.',
    keywords: ['central intelligence', 'centralintelligenceos', 'intelligence', 'memory', 'founding', 'founding fathers', 'founding members', 'campaign', 'profile completion', 'sessions', 'recommendations', 'governance', 'brain', 'os'],
  },
  // Support
  {
    id: 'support', label: 'Support', href: '/admin/support', icon: LifeBuoy,
    group: 'operate', subgroup: 'Support', built: true, permission: 'support.manage',
    blurb: 'Support tickets with user context, assignment and status.',
    keywords: ['tickets', 'help', 'inbox'],
  },
  {
    id: 'feedback', label: 'Feedback', href: '/admin/feedback', icon: MessageSquare,
    group: 'operate', subgroup: 'Support', built: true, permission: 'support.manage',
    blurb: 'AI/page/tutorial feedback and the feedback-to-roadmap workflow.',
    keywords: ['feedback', 'bugs', 'feature requests', 'roadmap'],
  },
  {
    id: 'copilot', label: 'Admin Copilot', href: '/admin/copilot', icon: Sparkles,
    group: 'operate', subgroup: 'Support', built: true, permission: 'analytics.view',
    blurb: 'Ask plain-English questions about your platform and get answers computed from your live admin data — what to improve next, which sport is most active, what needs review. Read-only, never destructive.',
    keywords: ['copilot', 'assistant', 'ai', 'ask', 'help me', 'what should i do', 'next best action', 'chat', 'advisor', 'recommend', 'questions'],
  },
  // Signal Radar (promoted to top-level Operate)
  {
    id: 'signal-radar', label: 'Signal Radar', href: '/admin/signal-radar', icon: Radar,
    group: 'operate', subgroup: 'Signal Radar', built: true, permission: 'signals.manage',
    blurb: 'Digital signal intelligence: detect, classify and score who is talking about SwingVantage and what the market is asking for. A Signal Inbox, sentiment/intent/sport/priority scoring, competitor watch, AI answer-engine visibility, a Mention Map and one-click conversion of signals into content ideas, product feedback, partnership leads and reputation risks. Keyless-first (manual + Google Alerts/RSS/CSV import); automated adapters are scaffolded and honest about what is real.',
    keywords: ['signalradar', 'signal radar', 'signalradar os', 'signals', 'mentions', 'brand monitoring', 'mention tracker', 'reputation', 'sentiment', 'competitor', 'competitive intelligence', 'backlinks', 'partnerships', 'creators', 'seo opportunities', 'demand', 'social listening', 'ai visibility', 'answer engine', 'brand intelligence', 'market signals', 'radar'],
  },

  // ══ Grow — is it growing? what ships? ══════════════════════
  // Growth & SEO
  {
    id: 'growth', label: 'Growth', href: '/admin/growth', icon: TrendingUp,
    group: 'grow', subgroup: 'Growth & SEO', built: true, external: true,
    blurb: 'Omnichannel marketing OS: campaigns, channels, CRM, experiments.',
    keywords: ['marketing', 'campaigns', 'growth', 'growthos', 'growth os', 'omnichannel'],
  },
  {
    id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'analytics.view',
    blurb: 'Unified PostHog control center: product & web analytics, session replay, funnels, feature flags, experiments, surveys, cohorts and SQL — all in one place.',
    keywords: ['metrics', 'funnels', 'reports', 'retention', 'posthog', 'analytics os', 'web analytics', 'product analytics', 'session replay', 'feature flags', 'experiments', 'ab test', 'surveys', 'cohorts', 'hogql', 'sql', 'events'],
  },
  {
    id: 'clarity', label: 'Clarity', href: '/admin/clarity', icon: Eye,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'analytics.view',
    blurb: 'Microsoft Clarity control center: session recordings, heatmaps, traffic, engagement and the behavioral quality signals (rage clicks, dead clicks, script errors) — live from the Data Export API plus deep links into Clarity.',
    keywords: ['clarity', 'microsoft clarity', 'clarity os', 'heatmaps', 'session replay', 'recordings', 'rage clicks', 'dead clicks', 'scroll depth', 'engagement', 'quality signals', 'data export', 'behavioral analytics'],
  },
  {
    id: 'insights', label: 'Insights', href: '/admin/insights', icon: Lightbulb,
    group: 'grow', subgroup: 'Growth & SEO', built: true, external: true, permission: 'analytics.view',
    blurb: 'Product insight panels and growth-agent recommendations.',
    keywords: ['insights', 'agents'],
  },
  {
    id: 'seo', label: 'SEO / AEO / GEO', href: '/admin/seo', icon: Search,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'seo.edit',
    blurb: 'Manage how SwingVantage appears in Google and AI answer engines.',
    keywords: ['search', 'keywords', 'rankings', 'schema', 'aeo', 'geo'],
  },
  {
    id: 'milestones', label: 'Milestones', href: '/admin/milestones', icon: Milestone,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'milestones.manage',
    blurb: 'Milestone Authority System: track 100 verifiable brand/product/SEO milestones against real metrics, score each page’s Authority Impact, review & approve earned milestones, and publish dedicated /milestones pages that build domain authority — never fabricated, never thin.',
    keywords: ['milestones', 'milestone authority', 'achievements', 'authority', 'seo', 'aeo', 'geo', 'domain authority', 'updates', 'milestone pages', 'progress', 'verifiable', 'needs data source', 'authority impact score'],
  },
  {
    id: 'reengage', label: 'Lifecycle', href: '/admin/reengage', icon: Mail,
    group: 'grow', subgroup: 'Growth & SEO', built: true, external: true,
    blurb: 'Lifecycle re-engagement and churn-aware outreach.',
    keywords: ['retention', 'churn', 'email', 'lifecycle', 're-engage', 'reengage', 'drip', 'win-back'],
  },
  {
    id: 'monetization', label: 'Monetization', href: '/admin/monetization', icon: DollarSign,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'monetization.manage',
    blurb: 'Ad placements, affiliate, revenue surfaces and UX safety rules.',
    keywords: ['revenue', 'money', 'affiliate', 'rpm'],
  },
  {
    id: 'tier-rollout', label: 'Tier Rollout', href: '/admin/tier-rollout', icon: Coins,
    group: 'grow', subgroup: 'Growth & SEO', built: true, permission: 'monetization.manage',
    blurb: 'Roll the paid membership tiers out gradually: toggle between "Free option" (Pro & Team collect signed-in waitlist interest) and "Full rollout" (all tiers live), backed by live per-tier demand counts.',
    keywords: ['tier rollout', 'tiers', 'membership', 'pricing', 'waitlist', 'pro', 'team', 'rollout', 'gradual launch', 'paid plans', 'subscription', 'demand', 'interest'],
  },
  {
    id: 'ads', label: 'Ads', href: '/admin/ads', icon: Megaphone,
    group: 'grow', subgroup: 'Growth & SEO', built: true, external: true, permission: 'ads.manage',
    blurb: 'Ad network status, placements and house-ad inventory.',
    keywords: ['ads', 'adsos', 'network', 'placements'],
  },
  // Content
  {
    id: 'content', label: 'Content', href: '/admin/content', icon: FileText,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'All pages, blog, tutorials, manuals and generated fix pages.',
    keywords: ['cms', 'pages', 'articles'],
  },
  {
    id: 'drills', label: 'Drill Library', href: '/admin/drills', icon: Dumbbell,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'Unified, read-only inventory of every drill across catalogs — sport, category, difficulty, target fault, equipment and source — to see coverage and spot gaps or duplicates.',
    keywords: ['drills', 'drill library', 'practice', 'catalog', 'exercises', 'drillmatch', 'fix stack', 'coverage', 'training'],
  },
  {
    id: 'drill-editor', label: 'Drill Editor', href: '/admin/drills/manage', icon: SquarePen,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'Create, edit and retire drills as a local-first preview overlay on the code catalogs, then export the overlay as JSON to commit globally. No writes to live data from the browser.',
    keywords: ['drill editor', 'edit drills', 'create drill', 'custom drill', 'manage drills', 'drill overrides', 'retire drill', 'content editing'],
  },
  {
    id: 'practice-plans', label: 'Practice Plans', href: '/admin/practice-plans', icon: ClipboardCheck,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'Preview the practice-planner across sports & skill levels (plus a youth variant) — focus, warm-up, drills, pressure test and success metric. Read-only; plans are generated per athlete.',
    keywords: ['practice plans', 'practice', 'planner', 'training plan', 'routine', 'session plan', 'drills', 'warmup', 'plan templates'],
  },
  {
    id: 'plan-editor', label: 'Plan Template Editor', href: '/admin/practice-plans/manage', icon: ClipboardList,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'Create, edit and retire practice-plan templates seeded from the real planner, as a local-first overlay you export to commit globally. No writes to live data from the browser.',
    keywords: ['plan editor', 'practice plan templates', 'edit plans', 'create plan', 'custom plan', 'plan templates', 'manage plans', 'plan overrides'],
  },
  {
    id: 'feature-education', label: 'Feature Education', href: '/admin/feature-education', icon: BookOpen,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'The Feature Registry + education engine: every shipped feature, its coverage/drift, and auto-generated tutorials, how-tos, videos & docs.',
    keywords: ['docs', 'tutorials', 'manuals', 'how-to', 'guides', 'help center', 'feature registry', 'registry', 'coverage', 'drift', 'education'],
  },
  {
    id: 'assets', label: 'Asset Library', href: '/admin/assets', icon: Images,
    group: 'grow', subgroup: 'Content', built: true, permission: 'content.edit',
    blurb: 'One internal catalog of every generated media asset — training videos, feature walkthroughs, and Video Studio assets — with previews, files, and where each is used. Read-only and self-maintaining.',
    keywords: ['assets', 'digital asset library', 'dam', 'media library', 'generated media', 'videos', 'posters', 'captions', 'catalog'],
  },
  {
    id: 'social', label: 'Social Generator', href: '/admin/social', icon: Share2,
    group: 'grow', subgroup: 'Content', built: true, external: true, permission: 'content.publish',
    blurb: 'Turn published content into platform-native social posts.',
    keywords: ['instagram', 'tiktok', 'x', 'linkedin', 'posts'],
  },
  {
    id: 'video-studio', label: 'Video Studio', href: '/admin/video-studio', icon: Clapperboard,
    group: 'grow', subgroup: 'Content', built: true, external: true, permission: 'content.edit',
    blurb: 'AI video department: briefs, generation, placement and measurement.',
    keywords: ['video', 'generation', 'render'],
  },
  {
    id: 'mental-performance', label: 'Mental Performance', href: '/admin/mental-performance', icon: Brain,
    group: 'grow', subgroup: 'Content', built: true,
    blurb: 'Manage the emotion-management & mistake-recovery pillar: routine library, training plans, coach vocabularies, the Mental Performance Intelligence layer (CentralIntelligenceOS), GrowthOS opportunities and the safety/crisis configuration. Performance coaching only — never therapy.',
    keywords: ['mental', 'mental performance', 'mindset', 'emotion', 'composure', 'confidence', 'reset', 'recovery', 'routine', 'sport psychology', 'meditation', 'pressure', 'journal', 'intelligence', 'crisis', 'safety'],
  },
  {
    id: 'feature-pages', label: 'Feature Pages (public)', href: '/features', icon: ClipboardList,
    group: 'grow', subgroup: 'Content', built: true, external: true, permission: 'content.edit',
    blurb: 'The live, public per-feature guide pages — each feature’s comprehensive description, how-to guide, FAQs and schema. Content lives in @/content/features.',
    keywords: ['features', 'public', 'marketing', 'feature pages', 'guides', 'how-to', 'registry'],
  },
  // Publishing
  {
    id: 'publishing-os', label: 'Publishing', href: '/admin/publishing', icon: Send,
    group: 'grow', subgroup: 'Publishing', built: true, permission: 'content.publish',
    blurb: 'The publishing operating layer: turn admin decisions into safe, live product changes through a Draft → Review → Validated → Published → Rolled-back workflow. Durable database-backed publishing (no read-only-filesystem dead-ends), risk-classified confirmation, a publishable-areas audit, validation gates and an audit trail.',
    keywords: ['publishingos', 'publishing os', 'publish', 'publishing', 'publish center', 'go live', 'rollback', 'roll back', 'unpublish', 'schedule', 'draft', 'review', 'validate', 'deploy', 'publish queue', 'publishable areas', 'version history', 'audit trail', 'durable publishing', 'view only', 'read only'],
  },
  {
    id: 'updates', label: 'Updates', href: '/admin/updates', icon: Newspaper,
    group: 'grow', subgroup: 'Publishing', built: true, permission: 'content.publish',
    blurb: 'Review and publish auto-generated changelog entries (Updates & Developer Updates) before they go live.',
    keywords: ['updates', 'changelog', 'dev-updates', 'publish', 'draft', 'release notes', 'announcements'],
  },
  {
    id: 'library-publishing', label: 'Library Publishing', href: '/admin/library', icon: Clapperboard,
    group: 'grow', subgroup: 'Publishing', built: true, permission: 'content.publish',
    blurb: 'Choose which training videos appear on the public /learn pages. Every video is already in the in-app library; flip a few to public per week to roll them out to search gradually.',
    keywords: ['library', 'video library', 'learn', 'publish', 'videos', 'training videos', 'rollout', 'seo'],
  },
  {
    id: 'generated-fixes', label: 'Generated Fixes', href: '/admin/content/generated-fixes', icon: Wand2,
    group: 'grow', subgroup: 'Publishing', built: true, permission: 'content.publish',
    blurb: 'Review queue for AI-generated repair/fix pages before they go live.',
    keywords: ['generated', 'fix', 'repair', 'queue', 'relevance'],
  },
  // Experiments
  {
    id: 'feature-flags', label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag,
    group: 'grow', subgroup: 'Experiments', built: true, permission: 'flags.manage',
    blurb: 'Turn features on/off, roll out by segment, and roll back safely.',
    keywords: ['flags', 'rollout', 'beta', 'experiments'],
  },

  // ══ Product — what is the product? ═════════════════════════
  {
    id: 'sports', label: 'Sports', href: '/admin/sports', icon: Trophy,
    group: 'product', subgroup: 'Sports', built: true, permission: 'sports.manage',
    blurb: 'Configure each sport: faults, drills, fields, templates and journeys.',
    keywords: ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball'],
  },
  {
    id: 'theme-lab', label: 'Theme Lab', href: '/admin/theme-lab', icon: Contrast,
    group: 'product', subgroup: 'Theme Lab', built: true, permission: 'flags.manage',
    blurb: 'Govern the live theme: pin every visitor to one theme (a kill-switch for a broken theme), opt into seasonal themes, and see exactly which theme the resolver returns and why. Local-first operator control over the 7-theme engine; appearance only, never data or coaching.',
    keywords: ['theme', 'themes', 'theme lab', 'themelab', 'dark performance', 'appearance', 'look', 'kill-switch', 'pin', 'seasonal', 'rollout', 'design', 'brand', 'data-theme'],
  },
  {
    id: 'accessibility', label: 'Theme & Accessibility', href: '/admin/accessibility', icon: Contrast,
    group: 'product', subgroup: 'Theme Lab', built: true, permission: 'logs.view',
    blurb: 'Live WCAG contrast audit of every theme — scores the readability-critical text/background pairs and flags anything below AA, preventing unreadable (white-on-white) themes.',
    keywords: ['accessibility', 'a11y', 'theme', 'themes', 'contrast', 'wcag', 'readability', 'color', 'white on white', 'dark mode', 'aa', 'aaa'],
  },

  // ══ System — is the machine sound? ═════════════════════════
  // Logs & Audit
  {
    id: 'audit-log', label: 'Audit Log', href: '/admin/audit-log', icon: ScrollText,
    group: 'system', subgroup: 'Logs & Audit', built: true, permission: 'logs.view',
    blurb: 'Every admin action: who changed what, when, before and after.',
    keywords: ['audit', 'log', 'history', 'activity'],
  },
  {
    id: 'audit-access', label: 'External Auditor Access', href: '/admin/audit-access', icon: ScanSearch,
    group: 'system', subgroup: 'Logs & Audit', built: true, permission: 'integrations.manage',
    blurb: 'Give an external auditor (e.g. ChatGPT) read-only access to a single JSON packet — verbatim sitemap & robots, the logged-in app surface, analytics overview — so it can audit the whole app on request.',
    keywords: ['audit', 'auditor', 'chatgpt', 'external', 'analysis', 'review', 'read-only', 'sitemap', 'robots', 'api/audit', 'token', 'inspect', 'crawl'],
  },
  {
    id: 'branch-guardian', label: 'Branches', href: '/admin/branch-guardian', icon: GitBranch,
    group: 'system', subgroup: 'Logs & Audit', built: true, permission: 'devops.manage',
    blurb: 'Git/worktree governance: a live Git Cleanliness Score, branch & worktree health, ranked NON-DESTRUCTIVE cleanup recommendations with copy-paste-safe commands, protected-branch & naming rules, and an audit log. Nothing is ever executed — it prepares commands and you approve them.',
    keywords: ['branchguardian', 'branch guardian', 'branchguardianos', 'git', 'branches', 'worktree', 'worktrees', 'cleanup', 'stale branches', 'merged branches', 'hygiene', 'developer operations', 'devops', 'rebase', 'prune', 'naming convention', 'release hygiene', 'repo health'],
  },
  // Settings
  {
    id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings,
    group: 'system', subgroup: 'Settings', built: true, permission: 'settings.manage',
    blurb: 'General, brand, upload, AI, SEO, email and notification settings.',
    keywords: ['settings', 'config', 'brand', 'preferences'],
  },
  {
    id: 'integrations', label: 'Integrations', href: '/admin/integrations', icon: Plug,
    group: 'system', subgroup: 'Settings', built: true, permission: 'integrations.manage',
    blurb: 'Every connected service, its state, and a safe test-connection.',
    keywords: ['api', 'providers', 'connections', 'keys'],
  },
  {
    id: 'connector-os', label: 'Connectors', href: '/admin/connector-os', icon: Plug,
    group: 'system', subgroup: 'Settings', built: true, permission: 'integrations.manage',
    blurb: 'One honest status board for every connector — analytics, reliability, SEO, security, video and monetization — grouped by layer, showing configured vs keyless-default and the env var(s) that turn each on. Single typed source of truth (lib/connector-os); booleans only, never secrets.',
    keywords: ['connectoros', 'connector os', 'connectors', 'connector status', 'analytics', 'posthog', 'ga4', 'sentry', 'turnstile', 'indexnow', 'bing', 'mux', 'cloudinary', 'mediapipe', 'keyless', 'env', 'observability', 'reliability', 'video', 'status board'],
  },
  {
    id: 'security', label: 'Security & Roles', href: '/admin/security', icon: ShieldCheck,
    group: 'system', subgroup: 'Settings', built: true, permission: 'admins.manage',
    blurb: 'Admin roles, permission matrix and security posture.',
    keywords: ['roles', 'permissions', 'rbac', '2fa', 'security'],
  },
  {
    id: 'security-os', label: 'Security Center', href: '/admin/security-os', icon: ShieldAlert,
    group: 'system', subgroup: 'Settings', built: true, permission: 'security.manage',
    blurb: 'The security operating system: a live Security Health Score, prioritized findings & recommendations, AI/data/API risk posture, audit logging and incident runbooks — what’s wrong, why it matters, and exactly what to do today.',
    keywords: ['securityos', 'security os', 'security', 'vulnerability', 'vulnerabilities', 'findings', 'risk', 'posture', 'health score', 'owasp', 'threat', 'ai security', 'prompt injection', 'audit', 'compliance', 'hardening', 'remediation', 'incident', 'runbook'],
  },
  {
    id: 'legal', label: 'Legal & Privacy', href: '/admin/legal', icon: Scale,
    group: 'system', subgroup: 'Settings', built: true, permission: 'legal.manage',
    blurb: 'Policies, disclaimers, consent and data export/deletion requests.',
    keywords: ['legal', 'privacy', 'gdpr', 'consent', 'compliance'],
  },
  {
    id: 'setup', label: 'Setup & Next Steps', href: '/admin/setup', icon: Rocket,
    group: 'system', subgroup: 'Settings', built: true,
    blurb: 'Beginner-friendly checklist of every key, database file and manual step — with copy-paste values.',
    keywords: ['setup', 'getting started', 'next steps', 'onboarding', 'install', 'configure', 'keys', 'env', 'checklist', 'to-do', 'instructions', 'how to'],
  },
  // Help
  {
    id: 'development', label: 'Development Roadmap', href: '/admin/development', icon: Telescope,
    group: 'system', subgroup: 'Help', built: true,
    blurb: 'Features & technologies in development, in plain product language — what is live, in development, and planned across the coaching-intelligence initiative, with its ethics guarantees and feature flags.',
    keywords: ['development', 'roadmap', 'innovation', 'innovation lab', 'features in development', 'technology', 'coaching intelligence', 'coach mix', 'curated drills', 'trend intelligence', 'whats next', 'planned', 'vision'],
  },
  {
    id: 'coach-mix', label: 'Coach Mix', href: '/admin/coach-mix', icon: Blend,
    group: 'system', subgroup: 'Help', built: true,
    blurb: 'Ethical coaching-influence engine (CentralIntelligenceOS): blend coach-inspired teaching models, review what’s learned, and bias SwingVantage’s drills & explanations — original content only, admin-gated.',
    keywords: ['coach', 'coaching', 'coach mix', 'influence', 'teaching', 'swing model', 'drills', 'learning', 'central intelligence', 'style', 'blend', 'gankas', 'bender'],
  },
  {
    id: 'learning', label: 'Admin Academy', href: '/admin/learning', icon: GraduationCap,
    group: 'system', subgroup: 'Help', built: true,
    blurb: 'New here? Guided onboarding, playbooks and a glossary for operators.',
    keywords: ['learn', 'help', 'onboarding', 'academy', 'docs', 'tutorial'],
  },
  {
    id: 'staff-academy', label: 'Staff Academy', href: '/admin/academy', icon: Newspaper,
    group: 'system', subgroup: 'Help', built: true, external: true,
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
  let bestLen = -1;
  for (const item of NAV_ITEMS) {
    for (const href of [item.href, ...(item.matches ?? [])]) {
      if (pathname === href || pathname.startsWith(href + '/')) {
        if (href.length > bestLen) {
          best = item;
          bestLen = href.length;
        }
      }
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
