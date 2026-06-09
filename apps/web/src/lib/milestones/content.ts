// ============================================================
// SwingVantage Milestones — content generator (PURE templates)
// ------------------------------------------------------------
// Produces an admin-reviewable content DRAFT for a milestone page from the
// definition + (optional) verified metric, using category-specific templates.
// Deliberately NOT over-automated: drafts are starting points the admin edits,
// and they NEVER fabricate numbers — a metric only appears when the caller
// passes a verified value. The educational context is what keeps pages
// substantive (not thin). PURE + deterministic.
// ============================================================

import type { MilestoneCategory, MilestoneContentDraft, MilestoneDefinition, MilestoneFaq } from './types';
import { recommendInternalLinks } from './internal-links';

export interface ContentInput {
  /** A verified, plain-English metric (e.g. "7 sports live"). Omit if unverified. */
  verifiedMetric?: string;
}

const SPORT_NAME: Record<string, string> = {
  golf: 'golf', tennis: 'tennis', baseball: 'baseball', softball: 'softball',
  pickleball: 'pickleball', padel: 'padel',
};

/** Educational context per category — the substance that earns indexing. */
function educationalContext(def: MilestoneDefinition): string {
  const sport = def.relatedSport ? SPORT_NAME[def.relatedSport] ?? def.relatedSport : null;
  switch (def.category) {
    case 'Swing Analysis':
      return `AI swing analysis turns a single phone video${sport ? ` of a ${sport} swing` : ''} into a prioritized read on what to fix first — sequencing, path, contact and tempo — instead of a long, generic checklist. SwingVantage shows the evidence behind each finding and labels single-camera values as estimates, so the feedback is useful without overpromising.`;
    case 'Sport Coverage':
      return `${sport ? `${cap(sport)} mechanics are their own discipline` : 'Each sport is its own discipline'} — the load, rotation, and contact that matter${sport ? ` in ${sport}` : ''} are different from every other swing sport. SwingVantage treats ${sport ?? 'each sport'} with its own diagnostic engine, drills, and benchmarks rather than relabeling generic tips.`;
    case 'Retesting and Improvement':
      return `Improvement is a loop, not a one-off: one fix, one focused plan, then a retest to confirm it actually worked. Retesting is what separates real progress from guesswork, and it is the core of how SwingVantage measures whether practice is paying off.`;
    case 'Practice Plans':
      return `A good practice plan converts a diagnosis into focused reps — a warm-up, a target fault, the right drills, and a pressure test — so range time changes the swing instead of grooving it. SwingVantage builds plans from your actual priority, not a generic template.`;
    case 'Education and Guides':
      return `Clear, honest education is how athletes turn feedback into change. SwingVantage's guides explain the mechanics behind common faults across all seven sports, in plain language, with links to the tools that put each lesson into practice.`;
    case 'Trust and Privacy':
      return `Trust is a feature. SwingVantage labels every value as measured or estimated, gives users control to export or delete their data, and frames coaching as performance guidance — never medical advice. Transparency about how the analysis works is part of the product, not an afterthought.`;
    case 'Coaching Intelligence':
      return `Coaching intelligence means matching the right drill and the right explanation to the athlete in front of you. SwingVantage learns teaching principles (never copied content) and biases its drill and explanation selection toward what actually helps a given fault.`;
    case 'Search and Authority':
      return `As SwingVantage publishes structured, genuinely useful pages — guides, FAQs, methodology, and sport hubs — it becomes easier for athletes (and answer engines) to find trustworthy swing-improvement information. This milestone marks a step in that discoverability.`;
    case 'Global Access':
      return `Swing improvement is a global need. SwingVantage is built to reach athletes across languages and regions, with localized pages and a structure designed to scale internationally without losing accuracy.`;
    case 'Technical Performance':
      return `A coaching tool is only useful if it is fast, reliable, and accessible. Performance and accessibility work makes SwingVantage usable for more athletes, on more devices, in more conditions.`;
    case 'Platform Growth':
      return `SwingVantage's mission is to give every athlete affordable, honest, AI-powered swing feedback. Growth milestones mark the platform becoming more useful to more people — and link to the tools that make that value concrete.`;
    case 'Product Development':
      return `Each shipped capability is a step toward a complete swing-improvement system — analysis, drills, retesting, and a dashboard that ties it together. This milestone marks one of those steps.`;
    case 'Community Signals':
      return `The best product decisions come from real athletes, parents, and coaches. Community signals — feedback, recurring patterns, real use cases — shape what SwingVantage builds next.`;
    case 'User Success':
      return `An account turns SwingVantage from a one-off check into a personalized, progress-tracking coach: your sports, your faults, your plan, and your history in one place.`;
    case 'Admin and Operations':
      return `Behind the athlete experience, SwingVantage runs intelligent operations — growth, content, security, and now milestone — systems that keep the platform honest, current, and improving.`;
    default:
      return `SwingVantage helps athletes understand and improve their swing with honest, AI-powered feedback across seven sports.`;
  }
}

function faqsFor(def: MilestoneDefinition, verifiedMetric?: string): MilestoneFaq[] {
  const faqs: MilestoneFaq[] = [
    { q: `What does the "${def.title}" milestone mean?`, a: `${def.pageAngle} ${verifiedMetric ? `Verified: ${verifiedMetric}.` : ''}`.trim() },
    { q: 'Why does this milestone matter?', a: def.authorityPurpose },
  ];
  if (def.relatedSport) {
    faqs.push({ q: `How does SwingVantage help with ${SPORT_NAME[def.relatedSport] ?? def.relatedSport}?`, a: educationalContext(def) });
  }
  faqs.push({ q: 'Is SwingVantage free to use?', a: 'Yes — SwingVantage is free to use. You can analyze a swing or import your data without an account.' });
  return faqs;
}

function keywordsFor(def: MilestoneDefinition): { primary: string; secondary: string[] } {
  const sport = def.relatedSport ? `${SPORT_NAME[def.relatedSport] ?? def.relatedSport} swing analysis` : 'AI swing analysis';
  const primary = def.primaryKeyword ?? sport;
  const secondary = Array.from(
    new Set([
      'AI sports coaching',
      'swing improvement',
      def.relatedSport ? `${SPORT_NAME[def.relatedSport]} drills` : 'practice plans',
      def.category.toLowerCase(),
    ].filter(Boolean)),
  );
  return { primary, secondary };
}

/** Generate a reviewable content draft for a milestone. PURE. */
export function generateMilestoneContent(def: MilestoneDefinition, input: ContentInput = {}): MilestoneContentDraft {
  const { verifiedMetric } = input;
  const kw = keywordsFor(def);
  const edu = educationalContext(def);

  const summary = verifiedMetric
    ? `${def.title} — ${verifiedMetric}. ${def.pageAngle}`
    : `${def.title}. ${def.pageAngle}`;

  return {
    seoTitle: def.seoTitle ?? `${def.title} | SwingVantage`,
    metaDescription:
      def.metaDescription ??
      truncate(`${def.pageAngle} ${def.authorityPurpose}`, 158),
    summary,
    whatItMeans: def.pageAngle,
    howUsersBenefit: benefitFor(def.category, def.relatedSport),
    educationalContext: edu,
    relatedFeatureContext: def.relatedFeature
      ? `This milestone is tied to ${def.relatedFeature}. ${edu}`
      : edu,
    faqs: faqsFor(def, verifiedMetric),
    internalLinkSuggestions: recommendInternalLinks(def),
    shareSnippet: `SwingVantage milestone: ${def.title}${verifiedMetric ? ` (${verifiedMetric})` : ''}.`,
    updateCardCopy: truncate(`${def.title} — ${def.pageAngle}`, 160),
    primaryKeyword: kw.primary,
    secondaryKeywords: kw.secondary,
  };
}

function benefitFor(category: MilestoneCategory, sport?: string): string {
  const s = sport ? SPORT_NAME[sport] ?? sport : 'your';
  switch (category) {
    case 'Swing Analysis':
    case 'Sport Coverage':
      return `You get clear, prioritized feedback on ${sport ? `your ${s} swing` : 'your swing'} — the one thing to fix first, why it matters, and how to practice it.`;
    case 'Retesting and Improvement':
      return 'You can confirm whether your practice actually worked, instead of guessing — the retest closes the loop.';
    case 'Practice Plans':
      return 'You get a focused practice plan built from your real priority, so range time changes your swing.';
    case 'Trust and Privacy':
      return 'You stay in control of your data and always know what is measured vs. estimated.';
    default:
      return 'You get honest, AI-powered swing feedback that helps you improve faster.';
  }
}

function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
function truncate(s: string, n: number): string { return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…'; }
