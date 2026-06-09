// ============================================================
// SwingVantage Milestone Authority System — the 100 milestone catalog (PURE)
// ------------------------------------------------------------
// The single source of truth for WHICH milestones exist, what triggers them,
// and the editorial angle + authority purpose for each. Compact by design: the
// SEO title / meta description / body are DERIVED by the content generator
// (lib/milestones/content.ts) from these fields + a category template, and are
// admin-editable — we never hand-fake 100 metric pages.
//
// To ADD a milestone: append one m(...) entry. The engine, Authority scorer,
// admin center, content generator and (once approved) the public page + sitemap
// all pick it up automatically.
// ============================================================

import type { MilestoneDefinition, MilestoneCategory, TriggerType } from './types';

interface Opts {
  key?: string;
  shortTitle?: string;
  relatedSport?: string;
  relatedFeature?: string;
  relatedPersona?: string;
  relatedPages?: string[];
  primaryKeyword?: string;
}

/** Compact builder — operator defaults to gte (the common case). */
function m(
  id: string,
  slug: string,
  title: string,
  category: MilestoneCategory,
  type: TriggerType,
  value: number,
  pageAngle: string,
  authorityPurpose: string,
  opts: Opts = {},
): MilestoneDefinition {
  return {
    id,
    slug,
    title,
    category,
    trigger: { type, operator: type === 'uptime_percentage' || type === 'page_speed_good' ? 'gte' : 'gte', value, key: opts.key },
    pageAngle,
    authorityPurpose,
    shortTitle: opts.shortTitle,
    relatedSport: opts.relatedSport,
    relatedFeature: opts.relatedFeature,
    relatedPersona: opts.relatedPersona,
    relatedPages: opts.relatedPages,
    primaryKeyword: opts.primaryKeyword,
  };
}

export const MILESTONE_CATALOG: MilestoneDefinition[] = [
  // ── Platform Growth ──────────────────────────────────────────────────────
  m('m001', 'first-public-swingvantage-milestone', 'First Public SwingVantage Milestone', 'Platform Growth', 'admin_manual', 1, 'Explain the SwingVantage mission, product direction, and milestone system.', 'Establish brand narrative and update hub.', { relatedPages: ['/about', '/features', '/methodology'] }),
  m('m002', '100-total-visitors', '100 Total Visitors Reached', 'Platform Growth', 'total_visitors', 100, 'Early audience validation for AI swing improvement.', 'Signals momentum and introduces core product pages.'),
  m('m003', '500-total-visitors', '500 Total Visitors Reached', 'Platform Growth', 'total_visitors', 500, 'What early visitors are exploring on SwingVantage.', 'Builds trust and links to top entry pages.'),
  m('m004', '1000-total-visitors', '1,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 1000, 'Why swing analysis demand is growing.', 'Supports AI sports coaching authority.'),
  m('m005', '5000-total-visitors', '5,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 5000, 'How broader traffic supports product learning.', 'Strengthens brand credibility.'),
  m('m006', '10000-total-visitors', '10,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 10000, "SwingVantage's expanding audience across sports.", 'Links to multi-sport hubs.'),
  m('m007', '25000-total-visitors', '25,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 25000, 'Multi-sport swing improvement interest.', 'Supports market education.'),
  m('m008', '50000-total-visitors', '50,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 50000, 'What users look for in AI swing feedback.', 'Builds category trust.'),
  m('m009', '100000-total-visitors', '100,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 100000, 'The rise of self-guided swing analysis.', 'Major authority milestone.'),
  m('m010', '1000000-total-visitors', '1,000,000 Total Visitors Reached', 'Platform Growth', 'total_visitors', 1000000, 'SwingVantage as a scaled learning destination.', 'High-authority brand proof page.'),

  // ── User Success ─────────────────────────────────────────────────────────
  m('m011', 'first-registered-user', 'First Registered User', 'User Success', 'registered_users', 1, 'The first step toward personalized swing improvement.', 'Introduces account/dashboard value.'),
  m('m012', '100-registered-users', '100 Registered Users', 'User Success', 'registered_users', 100, 'Why users create accounts for swing progress.', 'Supports conversion pages.'),
  m('m013', '500-registered-users', '500 Registered Users', 'User Success', 'registered_users', 500, 'Building a practice-tracking user base.', 'Trust signal for account creation.'),
  m('m014', '1000-registered-users', '1,000 Registered Users', 'User Success', 'registered_users', 1000, 'Personalized swing plans at scale.', 'Supports user growth authority.'),
  m('m015', '5000-registered-users', '5,000 Registered Users', 'User Success', 'registered_users', 5000, 'Scaling personalized sports improvement.', 'Broad brand proof.'),

  // ── Swing Analysis ───────────────────────────────────────────────────────
  m('m016', 'first-swing-uploaded', 'First Swing Uploaded', 'Swing Analysis', 'swing_uploads', 1, 'How SwingVantage turns video into feedback.', 'Explains upload workflow.', { relatedFeature: 'Analyze' }),
  m('m017', '100-swing-uploads', '100 Swing Uploads', 'Swing Analysis', 'swing_uploads', 100, 'Early swing-analysis usage patterns.', 'Links to analyzer and sample reports.'),
  m('m018', '500-swing-uploads', '500 Swing Uploads', 'Swing Analysis', 'swing_uploads', 500, 'What repeated swing uploads reveal about practice needs.', 'Supports swing-analysis authority.'),
  m('m019', '1000-swing-uploads', '1,000 Swing Uploads', 'Swing Analysis', 'swing_uploads', 1000, 'Why video-based analysis helps everyday athletes.', 'Strong analyzer trust page.'),
  m('m020', '5000-swing-uploads', '5,000 Swing Uploads', 'Swing Analysis', 'swing_uploads', 5000, 'Scaling video feedback across multiple sports.', 'Multi-sport analysis authority.'),
  m('m021', '10000-swing-uploads', '10,000 Swing Uploads', 'Swing Analysis', 'swing_uploads', 10000, 'Large-scale learning from swing videos.', 'Major category credibility.'),
  m('m022', 'first-ai-swing-analysis', 'First AI Swing Analysis Completed', 'Swing Analysis', 'swing_analyses', 1, 'What an AI swing analysis includes.', 'Explains product methodology.', { relatedFeature: 'AI Analyses', relatedPages: ['/methodology'] }),
  m('m023', '100-ai-swing-analyses', '100 AI Swing Analyses Completed', 'Swing Analysis', 'swing_analyses', 100, 'The value of clear, prioritized swing feedback.', 'Supports product trust.'),
  m('m024', '1000-ai-swing-analyses', '1,000 AI Swing Analyses Completed', 'Swing Analysis', 'swing_analyses', 1000, 'How AI feedback helps simplify improvement.', 'High-value AI sports page.'),
  m('m025', '10000-ai-swing-analyses', '10,000 AI Swing Analyses Completed', 'Swing Analysis', 'swing_analyses', 10000, 'How analysis volume improves product learning.', 'Strong trust and scale signal.'),

  // ── Retesting and Improvement ────────────────────────────────────────────
  m('m026', 'first-retest-completed', 'First Retest Completed', 'Retesting and Improvement', 'retests_completed', 1, 'Why retesting matters after a swing fix.', 'Reinforces one fix, one plan, one retest.', { relatedPages: ['/methodology'] }),
  m('m027', '100-retests-completed', '100 Retests Completed', 'Retesting and Improvement', 'retests_completed', 100, 'Measuring whether practice is working.', 'Builds improvement methodology authority.'),
  m('m028', '500-retests-completed', '500 Retests Completed', 'Retesting and Improvement', 'retests_completed', 500, 'The feedback loop behind better practice.', 'Strengthens learning system authority.'),
  m('m029', '1000-retests-completed', '1,000 Retests Completed', 'Retesting and Improvement', 'retests_completed', 1000, 'Retesting as a smarter way to improve.', 'Differentiates SwingVantage.'),
  m('m030', '10000-retests-completed', '10,000 Retests Completed', 'Retesting and Improvement', 'retests_completed', 10000, 'Building improvement loops at scale.', 'Major methodology authority.'),

  // ── Practice Plans ───────────────────────────────────────────────────────
  m('m031', 'first-practice-plan-generated', 'First Practice Plan Generated', 'Practice Plans', 'drill_plans_generated', 1, 'How SwingVantage turns diagnosis into drills.', 'Connects analysis to action.', { relatedFeature: 'Practice Plans' }),
  m('m032', '100-practice-plans-generated', '100 Practice Plans Generated', 'Practice Plans', 'drill_plans_generated', 100, 'Why athletes need focused practice plans.', 'Supports drill content clusters.'),
  m('m033', '1000-practice-plans-generated', '1,000 Practice Plans Generated', 'Practice Plans', 'drill_plans_generated', 1000, 'Personalized drills across sports.', 'Links to drill libraries.'),
  m('m034', '5000-practice-plans-generated', '5,000 Practice Plans Generated', 'Practice Plans', 'drill_plans_generated', 5000, 'Practice planning as a product moat.', 'Builds AI coaching authority.'),
  m('m035', '10000-practice-plans-generated', '10,000 Practice Plans Generated', 'Practice Plans', 'drill_plans_generated', 10000, 'Scaling personalized improvement plans.', 'High-value authority page.'),

  // ── Sport Coverage ───────────────────────────────────────────────────────
  m('m036', 'first-golf-analysis', 'First Golf Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'How SwingVantage analyzes golf swings.', 'Golf hub strengthening.', { key: 'golf', relatedSport: 'golf', relatedPages: ['/golf-swing-analysis', '/sample-report/golf'] }),
  m('m037', '1000-golf-analyses', '1,000 Golf Analyses Completed', 'Sport Coverage', 'sport_analyses', 1000, 'Common golf swing improvement themes.', 'Golf topical authority.', { key: 'golf', relatedSport: 'golf', relatedPages: ['/golf-swing-analysis'] }),
  m('m038', 'first-tennis-analysis', 'First Tennis Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'How SwingVantage supports tennis stroke improvement.', 'Tennis hub strengthening.', { key: 'tennis', relatedSport: 'tennis', relatedPages: ['/tennis-swing-analysis'] }),
  m('m039', '1000-tennis-analyses', '1,000 Tennis Analyses Completed', 'Sport Coverage', 'sport_analyses', 1000, 'Tennis swing feedback for recreational players.', 'Tennis topical authority.', { key: 'tennis', relatedSport: 'tennis' }),
  m('m040', 'first-baseball-analysis', 'First Baseball Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'How video feedback supports baseball hitting mechanics.', 'Baseball hub strengthening.', { key: 'baseball', relatedSport: 'baseball', relatedPages: ['/baseball-swing-analysis'] }),
  m('m041', '1000-baseball-analyses', '1,000 Baseball Analyses Completed', 'Sport Coverage', 'sport_analyses', 1000, 'Baseball swing mechanics at scale.', 'Baseball topical authority.', { key: 'baseball', relatedSport: 'baseball' }),
  m('m042', 'first-softball-analysis', 'First Softball Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'AI feedback for fast-pitch and slow-pitch swings.', 'Softball hub strengthening.', { key: 'softball', relatedSport: 'softball', relatedPages: ['/softball-swing-analysis'] }),
  m('m043', '1000-softball-analyses', '1,000 Softball Analyses Completed', 'Sport Coverage', 'sport_analyses', 1000, 'Common softball hitting development patterns.', 'Softball topical authority.', { key: 'softball', relatedSport: 'softball' }),
  m('m044', 'first-pickleball-analysis', 'First Pickleball Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'Swing and stroke feedback for pickleball players.', 'Pickleball hub strengthening.', { key: 'pickleball', relatedSport: 'pickleball', relatedPages: ['/pickleball'] }),
  m('m045', 'first-padel-analysis', 'First Padel Analysis Completed', 'Sport Coverage', 'sport_analyses', 1, 'Padel technique feedback and swing learning.', 'Padel hub strengthening.', { key: 'padel', relatedSport: 'padel', relatedPages: ['/padel'] }),
  m('m046', 'all-core-sports-activated', 'All Core Sports Activated', 'Sport Coverage', 'active_sports_count', 7, "SwingVantage's multi-sport foundation.", 'Multi-sport positioning.', { relatedPages: ['/features'] }),
  m('m047', 'first-multi-sport-user', 'First Multi-Sport User', 'Sport Coverage', 'multi_sport_users', 1, 'Why swing athletes often learn across sports.', 'Cross-sport authority.', { relatedFeature: 'Athlete General Intelligence', relatedPages: ['/agi'] }),
  m('m048', '100-multi-sport-users', '100 Multi-Sport Users', 'Sport Coverage', 'multi_sport_users', 100, 'Cross-sport improvement trends.', 'Supports multi-sport differentiation.'),

  // ── Education and Guides ─────────────────────────────────────────────────
  m('m049', 'first-sample-report-viewed', 'First Sample Report Viewed', 'Education and Guides', 'sample_report_views', 1, 'Why sample reports build trust before upload.', 'Links to sample reports.', { relatedPages: ['/sample-report'] }),
  m('m050', '1000-sample-report-views', '1,000 Sample Report Views', 'Education and Guides', 'sample_report_views', 1000, 'What users learn from sample analysis reports.', 'Improves sample report authority.', { relatedPages: ['/sample-report'] }),
  m('m051', 'first-educational-guide', 'First Educational Guide Published', 'Education and Guides', 'published_guides', 1, 'SwingVantage as a swing education platform.', 'Establishes guide cluster.', { relatedPages: ['/resources'] }),
  m('m052', '25-educational-guides', '25 Educational Guides Published', 'Education and Guides', 'published_guides', 25, 'Building a multi-sport swing library.', 'Content authority.'),
  m('m053', '50-educational-guides', '50 Educational Guides Published', 'Education and Guides', 'published_guides', 50, 'Expanding swing education coverage.', 'Topical depth.'),
  m('m054', '100-educational-guides', '100 Educational Guides Published', 'Education and Guides', 'published_guides', 100, "SwingVantage's educational content library.", 'Major topical authority signal.'),
  m('m055', 'first-grip-education-page', 'First Grip Education Page Published', 'Education and Guides', 'mechanics_pages', 1, 'Why grip matters across swing sports.', 'Builds mechanics cluster.', { key: 'grip' }),
  m('m056', 'first-weight-distribution-page', 'First Weight Distribution Page Published', 'Education and Guides', 'mechanics_pages', 1, 'How weight distribution affects power and control.', 'Builds mechanics cluster.', { key: 'weight' }),
  m('m057', 'first-swing-plane-page', 'First Swing Plane Page Published', 'Education and Guides', 'mechanics_pages', 1, 'How swing plane influences contact and consistency.', 'Builds swing mechanics authority.', { key: 'plane' }),

  // ── Search and Authority ─────────────────────────────────────────────────
  m('m058', 'first-faq-cluster', 'First FAQ Cluster Published', 'Search and Authority', 'faq_clusters', 1, 'Answering common swing-analysis questions.', 'AEO/GEO support.', { relatedPages: ['/faq'] }),
  m('m059', '100-faqs-published', '100 FAQs Published', 'Search and Authority', 'faq_count', 100, 'Building an answer engine for swing improvement.', 'AEO topical coverage.', { relatedPages: ['/faq'] }),
  m('m060', 'first-methodology-page', 'First Methodology Page Published', 'Trust and Privacy', 'methodology_pages', 1, 'How SwingVantage explains its analysis approach.', 'Trust and transparency.', { relatedPages: ['/methodology'] }),
  m('m061', 'privacy-controls-published', 'Privacy Controls Published', 'Trust and Privacy', 'feature_flag', 1, 'User control over swing videos and data.', 'Trust-building authority.', { key: 'privacy', relatedPages: ['/privacy', '/trust'] }),
  m('m062', 'export-delete-controls', 'Export and Delete Controls Published', 'Trust and Privacy', 'feature_flag', 1, 'Why data control matters in AI sports tools.', 'Privacy trust.', { key: 'dataControls', relatedPages: ['/privacy'] }),
  m('m063', 'confidence-labeling-system', 'Confidence Labeling System Launched', 'Trust and Privacy', 'feature_flag', 1, 'Honest confidence levels in AI feedback.', 'AI transparency authority.', { key: 'confidence', relatedPages: ['/methodology'] }),
  m('m064', 'first-accessibility-improvement', 'First Accessibility Improvement Shipped', 'Technical Performance', 'feature_flag', 1, 'Making swing improvement more accessible.', 'Product quality/trust.', { key: 'accessibility' }),
  m('m065', 'mobile-upload-experience-improved', 'Mobile Upload Experience Improved', 'Technical Performance', 'feature_flag', 1, 'Better mobile video upload for athletes.', 'Mobile usability authority.', { key: 'mobileUpload' }),
  m('m066', 'page-speed-milestone', 'Page Speed Milestone Reached', 'Technical Performance', 'page_speed_good', 1, 'Why fast sports tools improve user experience.', 'Technical trust.'),
  m('m067', '99-percent-uptime', '99% Uptime Milestone', 'Technical Performance', 'uptime_percentage', 99, 'Reliability for swing analysis users.', 'Technical credibility.', { shortTitle: '99% Uptime' }),

  // ── Admin and Operations ─────────────────────────────────────────────────
  m('m068', 'first-admin-intelligence-tool', 'First Admin Intelligence Tool Launched', 'Admin and Operations', 'feature_flag', 1, 'How admin intelligence improves the platform.', 'Product sophistication.', { key: 'adminAiTools' }),
  m('m069', 'growthos-connected-to-milestones', 'GrowthOS Connected to Milestones', 'Admin and Operations', 'feature_flag', 1, 'Turning growth signals into product updates.', 'Operational authority.', { key: 'growthos' }),
  m('m070', 'centralintelligenceos-connected-to-milestones', 'CentralIntelligenceOS Connected to Milestones', 'Admin and Operations', 'feature_flag', 1, 'How platform intelligence supports learning.', 'AI systems authority.', { key: 'cios' }),

  // ── Coaching Intelligence ────────────────────────────────────────────────
  m('m071', 'first-coach-style-learning-configuration', 'First Coach-Style Learning Configuration Added', 'Coaching Intelligence', 'feature_flag', 1, 'Teaching-style customization in SwingVantage.', 'Coaching intelligence authority.', { key: 'coachMix' }),
  m('m072', 'coach-mix-admin-controls', 'Coach Mix Admin Controls Launched', 'Coaching Intelligence', 'feature_flag', 1, 'Admin-configurable teaching strategies.', 'Advanced coaching product authority.', { key: 'coachMixAdmin' }),
  m('m073', 'user-selectable-teaching-style', 'User-Selectable Teaching Style Launched', 'Coaching Intelligence', 'feature_flag', 1, 'Personalizing how swing feedback is taught.', 'Personalization authority.', { key: 'userTeachingStyle' }),
  m('m074', 'first-curated-drill-recommendation', 'First Curated Drill Recommendation Shown', 'Coaching Intelligence', 'feature_flag', 1, "Curated drills for a user's current game.", 'Drill system authority.', { key: 'curatedDrills' }),
  m('m075', '1000-curated-drill-recommendations', '1,000 Curated Drill Recommendations Shown', 'Coaching Intelligence', 'curated_drill_recommendations', 1000, 'Scaling personalized drill recommendations.', 'AI coaching authority.'),
  m('m076', 'first-trend-based-drill-created', 'First Trend-Based Drill Created', 'Coaching Intelligence', 'trend_based_drills', 1, 'Using common user problems to guide content.', 'Trend intelligence authority.'),

  // ── Product Development ──────────────────────────────────────────────────
  m('m077', 'first-video-tutorial-generated', 'First Video Tutorial Generated', 'Product Development', 'video_tutorials', 1, 'Turning swing insights into instructional videos.', 'Video learning authority.', { relatedPages: ['/library'] }),
  m('m078', '100-video-tutorials-generated', '100 Video Tutorials Generated', 'Product Development', 'video_tutorials', 100, 'Building a video-first swing learning library.', 'Multimedia authority.', { relatedPages: ['/library'] }),
  m('m079', 'first-welcome-back-recommendation', 'First AI Welcome-Back Recommendation', 'Product Development', 'feature_flag', 1, 'Helping users resume practice intelligently.', 'Retention feature authority.', { key: 'welcomeBack' }),
  m('m080', 'first-user-dashboard-milestone', 'First User Dashboard Milestone', 'Product Development', 'feature_flag', 1, 'Making the dashboard a swing improvement command center.', 'Product ecosystem authority.', { key: 'dashboard' }),

  // ── Search and Authority (off-page / search) ─────────────────────────────
  m('m081', 'first-organic-search-click', 'First Organic Search Click', 'Search and Authority', 'organic_clicks', 1, 'SwingVantage begins earning organic discovery.', 'SEO journey page.'),
  m('m082', '100-organic-search-clicks', '100 Organic Search Clicks', 'Search and Authority', 'organic_clicks', 100, 'Early search demand for swing improvement.', 'Search traction signal.'),
  m('m083', '1000-organic-search-clicks', '1,000 Organic Search Clicks', 'Search and Authority', 'organic_clicks', 1000, 'Growing organic discovery for AI sports coaching.', 'SEO authority.'),
  m('m084', '10000-organic-search-clicks', '10,000 Organic Search Clicks', 'Search and Authority', 'organic_clicks', 10000, 'SwingVantage as a search-discovered sports tool.', 'Major search authority.'),
  m('m085', '100-indexed-pages', '100 Indexed Pages', 'Search and Authority', 'indexed_pages', 100, 'Building a crawlable swing education library.', 'Indexation proof.'),
  m('m086', '500-indexed-pages', '500 Indexed Pages', 'Search and Authority', 'indexed_pages', 500, 'Scaling structured sports knowledge.', 'Search footprint authority.'),
  m('m087', 'first-backlink-earned', 'First Backlink Earned', 'Search and Authority', 'backlinks', 1, 'External recognition of SwingVantage.', 'Off-page authority.'),
  m('m088', '100-backlinks-earned', '100 Backlinks Earned', 'Search and Authority', 'backlinks', 100, 'Growing external trust around SwingVantage.', 'Domain authority signal.'),
  m('m089', 'first-answer-engine-citation-candidate', 'First Featured Snippet / AI Answer Citation Candidate', 'Search and Authority', 'admin_manual', 1, 'Structuring SwingVantage for answer engines.', 'AEO/GEO proof.', { shortTitle: 'First AI Answer Candidate' }),

  // ── Global Access ────────────────────────────────────────────────────────
  m('m090', 'first-international-visitor', 'First International Visitor', 'Global Access', 'countries_with_visitors', 2, 'Swing improvement as a global need.', 'International expansion.'),
  m('m091', 'visitors-from-10-countries', 'Visitors from 10 Countries', 'Global Access', 'countries_with_visitors', 10, 'Multi-country interest in swing analysis.', 'Global authority.'),
  m('m092', 'visitors-from-50-countries', 'Visitors from 50 Countries', 'Global Access', 'countries_with_visitors', 50, 'Global reach of AI sports coaching.', 'International trust.'),
  m('m093', 'first-multilanguage-page', 'First Multi-Language Page Published', 'Global Access', 'multilingual_pages', 1, 'Making swing education more globally accessible.', 'International SEO.'),
  m('m094', 'top-20-language-framework', 'Top 20 Language Framework Launched', 'Global Access', 'feature_flag', 1, 'Scaling SwingVantage for global users.', 'Multilingual authority.', { key: 'top20Lang' }),

  // ── Community Signals ────────────────────────────────────────────────────
  m('m095', 'first-user-feedback', 'First User Feedback Received', 'Community Signals', 'user_feedback_count', 1, 'How user feedback shapes SwingVantage.', 'Community trust.'),
  m('m096', '100-user-feedback-signals', '100 User Feedback Signals Received', 'Community Signals', 'user_feedback_count', 100, 'Learning from user needs and product friction.', 'Feedback-driven product authority.'),
  m('m097', 'first-improvement-pattern-identified', 'First Improvement Pattern Identified', 'Community Signals', 'improvement_patterns', 1, 'Identifying common swing problems across users.', 'Insight authority.'),
  m('m098', 'first-parent-coach-use-case', 'First Parent or Coach Use Case Published', 'Community Signals', 'parent_coach_pages', 1, 'How parents and coaches can use SwingVantage.', 'Persona authority.', { relatedPersona: 'parent', relatedPages: ['/parents', '/coaches'] }),
  m('m099', 'first-team-facility-use-case', 'First Team or Facility Use Case Published', 'Community Signals', 'team_facility_pages', 1, 'Using SwingVantage in team and facility settings.', 'B2B/B2B2C authority.', { relatedPersona: 'coach', relatedPages: ['/teams'] }),

  // ── Anchor ───────────────────────────────────────────────────────────────
  m('m100', 'swingvantage-authority-system-activated', 'SwingVantage Authority System Fully Activated', 'Platform Growth', 'feature_flag', 1, 'How milestones, updates, and authority pages work together.', 'Anchor page for the milestone ecosystem.', { key: 'milestoneSystemLive', relatedPages: ['/updates/milestones', '/updates'] }),
];

/** Lookup by id. */
export const findMilestoneDefinition = (id: string): MilestoneDefinition | undefined =>
  MILESTONE_CATALOG.find((d) => d.id === id);

/** Lookup by slug. */
export const findMilestoneBySlug = (slug: string): MilestoneDefinition | undefined =>
  MILESTONE_CATALOG.find((d) => d.slug === slug);
