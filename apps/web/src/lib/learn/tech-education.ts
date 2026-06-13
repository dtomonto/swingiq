// ============================================================
// SwingVantage — Technology Education Articles (registry + SEO/AEO/GEO)
// ------------------------------------------------------------
// SINGLE source of truth for the /learn technology explainer pages
// (heuristic data, AI in sports, retesting, player profiles, etc.).
//
// WHY A REGISTRY: every one of these pages must hit the strictest
// SEO/AEO/GEO bar, identically:
//   • SEO  — unique <title> (≤70 chars) + meta description (70–175),
//            canonical, Article schema with published/modified dates.
//   • AEO  — a direct, self-contained answer (`answerSummary`) rendered
//            right under the H1, FAQPage schema with real-query phrasing,
//            and Speakable selectors over the H1 + answer block.
//   • GEO  — short, citable, context-free statements an answer engine can
//            lift verbatim, plus consistent Breadcrumb trails.
//
// Centralizing the SEO-critical fields here (not in each page) means a
// test can mechanically enforce the standard across every article, and
// the duplicate-content gate can never drift. Page bodies stay bespoke;
// only the machine-readable SEO/AEO surface is shared.
// ============================================================

import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  breadcrumbListSchema,
  type Breadcrumb,
} from '@/lib/seo/jsonLd';

export interface TechEducationFaq {
  question: string;
  answer: string;
}

export interface TechEducationArticle {
  /** Slug under /learn, e.g. 'what-is-heuristic-data'. */
  slug: string;
  /** <title> base (brand suffix added by buildMetadata). Keep ≤ ~58 chars. */
  title: string;
  /** Visible H1 (may differ from the <title> for stronger on-page phrasing). */
  heading: string;
  /** Meta description — 70–175 chars, unique across the whole site. */
  description: string;
  /**
   * The AEO/GEO direct answer: 1–2 self-contained sentences rendered right
   * under the H1 (with `data-aeo-summary`) and referenced by Speakable. This
   * is the block answer engines quote, so it must stand on its own.
   */
  answerSummary: string;
  /** Short breadcrumb label for the trail + nav. */
  breadcrumbLabel: string;
  datePublished: string;
  dateModified: string;
  /** FAQs — questions phrased as real user queries (AEO). Minimum 2. */
  faqs: TechEducationFaq[];
}

const PUBLISHED = '2026-06-13';
const MODIFIED = '2026-06-13';

/** Canonical path for a tech-education article. */
export function techEducationPath(slug: string): string {
  return `/learn/${slug}`;
}

export const TECH_EDUCATION_ARTICLES: TechEducationArticle[] = [
  {
    slug: 'what-is-heuristic-data',
    title: 'What Is Heuristic Data?',
    heading: 'What Is Heuristic Data?',
    description:
      'Learn how heuristic data gives SwingVantage fast, structured, sport-specific swing recommendations from player profiles, miss patterns, session history, and retests.',
    answerSummary:
      'Heuristic data is structured, rules-based performance logic. SwingVantage uses it to turn signals like your sport, skill level, swing miss, ball flight, video clues, and history into a fast, useful next-best action — before deeper AI analysis is needed.',
    breadcrumbLabel: 'What Is Heuristic Data?',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is heuristic data?',
        answer:
          'Heuristic data is structured, rules-based performance intelligence. It uses known patterns, athlete inputs, symptoms, movement clues, historical results, and sport-specific logic to produce useful guidance quickly — before deeper AI analysis is needed.',
      },
      {
        question: 'Is heuristic data the same as AI?',
        answer:
          'No. Heuristic intelligence applies proven, transparent rules to your inputs, so its logic is easy to audit. AI analysis (such as video breakdowns) goes deeper and is better for nuanced patterns. SwingVantage uses heuristics for a fast first pass and AI when more depth adds value — they work together.',
      },
      {
        question: 'Why does SwingVantage use heuristic intelligence?',
        answer:
          'Because it is fast, cost-efficient, consistent, and easy to explain. Heuristics give you an instant, structured first read for common swing flaws and a clear next best action, which is ideal for free and instant estimates and for beginner and intermediate athletes.',
      },
      {
        question: 'Is a heuristic estimate accurate?',
        answer:
          'A heuristic estimate is a structured starting point, not a final diagnosis. It is reliable for common miss patterns and improves as you add clearer video, more sessions, and retest results. Every SwingVantage finding carries an honest confidence label so you always know how much weight to give it.',
      },
      {
        question: 'How does heuristic data help athletes improve?',
        answer:
          'It turns scattered inputs — your sport, skill level, swing miss, ball flight, video clues, and history — into one prioritized next-best action, so you practice the thing most likely to help instead of guessing.',
      },
      {
        question: 'How does heuristic data work with AI analysis?',
        answer:
          'Heuristics produce a fast, auditable first pass; AI analysis and video review add depth and confidence over time. Retesting and session history then confirm whether the change actually worked. The combination is what makes the guidance both quick and trustworthy.',
      },
    ],
  },
  {
    slug: 'ai-in-sports-performance',
    title: 'What Is AI in Sports Performance?',
    heading: 'AI Is Changing How Athletes Improve',
    description:
      'Learn how AI is changing sports performance by combining video, athlete profiles, session data, movement patterns, and retest results into practical improvement plans.',
    answerSummary:
      'AI in sports performance is software that analyzes patterns, context, and data to produce useful recommendations. Its real value is not “AI giving tips” — it is connecting fragmented data like video, profiles, session history, and retests into one personalized improvement system.',
    breadcrumbLabel: 'AI in Sports Performance',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is AI in sports performance?',
        answer:
          'It is software that analyzes patterns, context, and data — video, movement signals, athlete profiles, goals, session history, and results — to produce useful, personalized recommendations. The value is not “AI giving tips,” it is connecting fragmented data into one improvement system.',
      },
      {
        question: 'How does AI help with swing improvement?',
        answer:
          'AI can analyze your video, identify likely swing flaws, select drills suited to you, generate a practice plan, and compare retests over time — so you work on the right thing and can see whether it actually changed.',
      },
      {
        question: 'Does AI replace a coach?',
        answer:
          'No. SwingVantage is designed to give you data-backed guidance you can act on today and to make your coaching sessions more productive. It pairs with a coach for injury concerns and advanced technique work — it does not replace one.',
      },
      {
        question: 'What data does SwingVantage use?',
        answer:
          'SwingVantage is designed to organize and apply large-scale sport-specific performance signals — including your player profile, video-analysis observations, symptoms, goals, equipment context, session history, drill results, and retest outcomes — into one prioritized plan.',
      },
      {
        question: 'Why is retesting important?',
        answer:
          'Retesting is how you know a change worked. By comparing a fresh analysis to your baseline, SwingVantage can confirm real improvement instead of guessing — and raise the confidence of its guidance over time.',
      },
      {
        question: 'What is the future of sports technology?',
        answer:
          'Athletes now have access to more data than ever — video, launch monitors, wearables, session tracking. The winning platforms will not just collect data; they will translate the right data into the right action at the right time.',
      },
    ],
  },
  {
    slug: 'heuristic-vs-ai-swing-analysis',
    title: 'Heuristic vs AI Swing Analysis',
    heading: 'Heuristic vs AI Swing Analysis',
    description:
      'Heuristic vs AI swing analysis: how SwingVantage uses fast, rules-based estimates and deeper AI video analysis together — and when each one is the right tool.',
    answerSummary:
      'Heuristic swing analysis applies transparent, rules-based logic to your inputs for a fast, auditable first read. AI swing analysis studies your video and richer signals for more depth. SwingVantage leads with heuristics for speed and clarity, then adds AI where extra depth earns its keep.',
    breadcrumbLabel: 'Heuristic vs AI Swing Analysis',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is the difference between heuristic and AI swing analysis?',
        answer:
          'Heuristic analysis applies proven, transparent rules to your inputs (sport, skill level, miss pattern, ball flight, history) for a fast, auditable estimate. AI analysis studies your video and richer signals to surface nuanced patterns rules would miss. One is fast and explainable; the other is deeper.',
      },
      {
        question: 'Which is more accurate, heuristics or AI?',
        answer:
          'Neither is universally “more accurate.” Heuristics are highly reliable for common miss patterns and are easy to audit; AI adds depth for subtle or unusual movement. SwingVantage combines them and labels every finding with an honest confidence level so you know how much to trust each read.',
      },
      {
        question: 'When does SwingVantage use heuristics vs AI?',
        answer:
          'Free and instant estimates lead with heuristics for speed and cost-efficiency. Deeper tiers add AI video analysis where the extra depth genuinely helps. Core flows always work on heuristics alone, so you are never blocked waiting on AI.',
      },
      {
        question: 'Can heuristics and AI disagree?',
        answer:
          'They can weight signals differently, which is healthy. SwingVantage reconciles them into one prioritized recommendation and shows the basis (measured vs estimated) and confidence, so a low-confidence read is clearly flagged rather than presented as fact.',
      },
      {
        question: 'Do I need AI analysis to improve?',
        answer:
          'No. A structured heuristic estimate plus a clear practice plan and a retest is enough to make real progress on common faults. AI analysis sharpens confidence and depth over time, but the heuristic first pass is already actionable.',
      },
    ],
  },
  {
    slug: 'how-retesting-improves-swing-feedback',
    title: 'Why Retesting Improves Swing Feedback',
    heading: 'Why Retesting Improves Swing Feedback',
    description:
      'Retesting is how you prove a swing change worked. Learn how SwingVantage compares a fresh analysis to your baseline to confirm real improvement and raise confidence.',
    answerSummary:
      'Retesting is recording a fresh swing after you practice a change and comparing it to your baseline. It is how SwingVantage confirms a change actually worked instead of guessing — turning a one-time tip into measurable, trustworthy improvement.',
    breadcrumbLabel: 'How Retesting Improves Feedback',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is a retest in SwingVantage?',
        answer:
          'A retest is a fresh analysis you record after working on a fix, compared directly against your earlier baseline. It answers one question clearly: did the thing you practiced actually change your swing?',
      },
      {
        question: 'Why is retesting important for improvement?',
        answer:
          'Without a retest, you are guessing whether a change worked. Retesting closes the loop — it confirms real improvement, catches changes that did not stick, and tells you whether to keep going or adjust the plan.',
      },
      {
        question: 'How often should I retest my swing?',
        answer:
          'A good rhythm is to retest after a focused block of practice on one fix — often after a week or a few sessions — rather than every swing. Retesting one change at a time makes the result easy to read.',
      },
      {
        question: 'Does retesting make SwingVantage more accurate?',
        answer:
          'Yes. Each retest adds evidence, so repeated, consistent signals raise the confidence of your diagnosis and recommendations. A pattern confirmed across sessions is far more reliable than a single read.',
      },
      {
        question: 'What if my retest shows no improvement?',
        answer:
          'That is still useful information. SwingVantage uses a flat or negative retest to adjust the plan — a different drill, a clearer camera angle, or more reps — instead of leaving you to wonder why nothing changed.',
      },
    ],
  },
  {
    slug: 'how-swingvantage-uses-player-profiles',
    title: 'How SwingVantage Uses Player Profiles',
    heading: 'How SwingVantage Uses Player Profiles',
    description:
      'Your player profile — sport, skill level, goals, and equipment — personalizes every SwingVantage recommendation. Learn what it captures and how it shapes your plan.',
    answerSummary:
      'Your player profile is what SwingVantage knows about you as an athlete — sport, skill level, goals, equipment, and history. It is the context that personalizes every diagnosis, drill, and practice plan, so guidance fits you instead of a generic average.',
    breadcrumbLabel: 'How SwingVantage Uses Profiles',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is a player profile?',
        answer:
          'A player profile is the picture SwingVantage builds of you as an athlete: your sport, skill level, goals, equipment, physical context, and the history of what you have analyzed and practiced. It is the context behind every recommendation.',
      },
      {
        question: 'How does my profile change my recommendations?',
        answer:
          'Your profile decides which rules apply and how findings are framed. A beginner and an advanced player with the same swing miss get different drills, language, and pacing — because the right next step depends on where you are.',
      },
      {
        question: 'Do I have to fill out my whole profile to start?',
        answer:
          'No. You can get a useful analysis from a single swing, and SwingVantage gets more personalized as your profile fills in. Each detail you add sharpens the guidance rather than gating it.',
      },
      {
        question: 'Is my player-profile data private?',
        answer:
          'SwingVantage is built privacy-forward and labels the source of every data point. Profile details are used to personalize your guidance, not to fabricate metrics, and nothing here is medical or injury advice.',
      },
      {
        question: 'How does the profile connect across sports?',
        answer:
          'Athlete General Intelligence maps your profile onto sport-neutral capabilities, so a strength you build in one sport can inform another — and it can find the one capability limiting the most of your game at once.',
      },
    ],
  },
  {
    slug: 'future-of-ai-coaching-in-recreational-sports',
    title: 'The Future of AI Coaching in Recreational Sports',
    heading: 'The Future of AI Coaching in Recreational Sports',
    description:
      'How AI coaching is reaching everyday athletes — personalized feedback, retesting, and progress tracking that were once elite-only — and what comes next.',
    answerSummary:
      'AI coaching is bringing elite-only tools — personalized feedback, video analysis, retesting, and progress tracking — to everyday athletes. The future is not just more data; it is platforms that translate the right data into the right action at the right time.',
    breadcrumbLabel: 'Future of AI Coaching',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is AI coaching?',
        answer:
          'AI coaching is technology that analyzes your video, data, and history to give personalized feedback, drills, and practice plans — and to track whether they work. It supports coaches and athletes; it does not replace human judgment.',
      },
      {
        question: 'Will AI replace human coaches?',
        answer:
          'No. AI coaching scales feedback and handles the routine first pass, freeing human coaches for nuanced, relationship-driven, and injury-related work. The likely future is coaches using AI as leverage, not being replaced by it.',
      },
      {
        question: 'How does AI coaching help recreational athletes?',
        answer:
          'It gives everyday players access to the kind of personalized feedback, measurement, and retesting that used to require expensive private lessons or elite facilities — affordably, on a phone, whenever they practice.',
      },
      {
        question: 'What will sports technology look like next?',
        answer:
          'Expect personalized coaching systems athletes can trust, clearer development visibility for parents, better progress tracking for teams and facilities, and platforms judged not on how much data they collect but on how well they turn it into action.',
      },
      {
        question: 'How does SwingVantage fit into the future of AI coaching?',
        answer:
          'SwingVantage is a premium improvement layer that turns video, data, and history into clear next steps across seven sports — leading with fast heuristics, adding AI where it helps, and proving progress with retests.',
      },
    ],
  },
];

const BY_SLUG: Record<string, TechEducationArticle> = Object.fromEntries(
  TECH_EDUCATION_ARTICLES.map((a) => [a.slug, a]),
);

/** Look up an article by slug. */
export function getTechEducationArticle(slug: string): TechEducationArticle | undefined {
  return BY_SLUG[slug];
}

/** All article paths (for the sitemap + cross-linking). */
export function techEducationPaths(): string[] {
  return TECH_EDUCATION_ARTICLES.map((a) => techEducationPath(a.slug));
}

/** The standard breadcrumb trail for an article: Home › Learn › <label>. */
export function techEducationCrumbs(article: TechEducationArticle): Breadcrumb[] {
  return [
    { name: 'Home', path: '/' },
    { name: 'Learn', path: '/learn' },
    { name: article.breadcrumbLabel, path: techEducationPath(article.slug) },
  ];
}

/** Build the page <Metadata> for an article (canonical, OG, description, etc.). */
export function buildTechEducationMetadata(slug: string): Metadata {
  const article = getTechEducationArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.description,
    path: techEducationPath(slug),
    ogType: 'article',
  });
}

/**
 * Build the JSON-LD @graph for an article: Article (with dates + Speakable over
 * the H1 and the answer-summary lead) and FAQPage. BreadcrumbList is emitted by
 * the visible <Breadcrumbs> component, so it is intentionally NOT duplicated here.
 */
export function buildTechEducationGraph(slug: string) {
  const article = getTechEducationArticle(slug);
  if (!article) return buildGraph();
  return buildGraph(
    articleSchema({
      headline: article.heading,
      description: article.description,
      path: techEducationPath(slug),
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      speakableSelectors: ['h1', '[data-aeo-summary]'],
    }),
    faqPageSchema(article.faqs.map((f) => ({ question: f.question, answer: f.answer }))),
  );
}

/** Reusable FAQ section data + breadcrumb schema reference for tests/pages. */
export { breadcrumbListSchema };
