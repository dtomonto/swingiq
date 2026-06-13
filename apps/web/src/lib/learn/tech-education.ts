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
  {
    slug: 'is-ai-swing-analysis-accurate',
    title: 'Is AI Swing Analysis Accurate?',
    heading: 'Is AI Swing Analysis Accurate?',
    description:
      'How accurate is AI swing analysis? See what single-camera video can reliably read, what it estimates, and how SwingVantage’s confidence labels keep every finding honest.',
    answerSummary:
      'AI swing analysis is accurate as a structured estimate, not a lab measurement. SwingVantage reliably flags common faults and shot patterns from phone video, labels each finding measured or estimated with a confidence level, and grows more accurate as you add clearer video, more sessions, and retests.',
    breadcrumbLabel: 'Is AI Swing Analysis Accurate?',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'Is AI swing analysis accurate?',
        answer:
          'Yes, as a structured estimate. AI swing analysis reliably identifies common faults, shot patterns, and tendencies from video, but a single-camera read is an estimate, not a lab measurement. SwingVantage labels how confident each finding is so you always know how much to trust it.',
      },
      {
        question: 'How accurate is single-camera swing analysis?',
        answer:
          'Single-camera analysis is most accurate for things it can see clearly — setup, path tendencies, balance, and ball-flight consequences — and least accurate for precise 3D angles a sensor would measure. A true face-on or down-the-line camera angle is the single biggest factor in accuracy.',
      },
      {
        question: 'Can AI swing analysis be wrong?',
        answer:
          'It can be less certain — for example, from a poor camera angle or a single blurry clip. That is exactly why SwingVantage labels each finding measured or estimated with a confidence level, and why it asks for clearer video or more sessions before raising confidence.',
      },
      {
        question: 'How does SwingVantage show how accurate a finding is?',
        answer:
          'Every diagnosis, score, and recommendation carries an honest confidence label and lists the data points it was built from. You see whether a read is measured or estimated and how strong the evidence is — no fabricated precision.',
      },
      {
        question: 'How can I make my AI swing analysis more accurate?',
        answer:
          'Film from a true face-on or down-the-line angle at hip height in good light, capture the full swing, and add more sessions over time. Importing launch-monitor data and completing retests also raises the confidence of your results.',
      },
      {
        question: 'Is AI swing analysis as accurate as a launch monitor or a coach?',
        answer:
          'For precise numbers, a launch monitor measures what video can only estimate. For feel and hands-on correction, a coach adds what software cannot. SwingVantage is designed to complement both — fast, honest, everyday guidance that gets you more from a lesson or a monitor session.',
      },
    ],
  },
  {
    slug: 'what-is-athlete-general-intelligence',
    title: 'What Is Athlete General Intelligence?',
    heading: 'What Is Athlete General Intelligence?',
    description:
      'A plain-English guide to Athlete General Intelligence: the cross-sport engine that turns your sessions into one model of you and finds the skill that lifts the most sports.',
    answerSummary:
      'Athlete General Intelligence is SwingVantage’s engine that reasons across every sport you have analyzed at once. It maps sport-specific measurements onto shared capabilities — rotation, sequencing, balance, timing — to build one model of you, then finds the keystone skill that limits the most sports, so one fix can lift several.',
    breadcrumbLabel: 'What Is Athlete General Intelligence?',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is Athlete General Intelligence?',
        answer:
          'It is SwingVantage’s reasoning engine that looks across all the sports you have analyzed at once, builds a single model of you as an athlete, and finds the one capability that limits the most of your game — so you can train the thing that improves several sports together.',
      },
      {
        question: 'Is Athlete General Intelligence the same as artificial general intelligence?',
        answer:
          'No. Here “general” means breadth and transfer across domains — your sports — not science-fiction AI. Athlete General Intelligence is not self-aware and does not think like a person. We chose the honest reading of the letters.',
      },
      {
        question: 'How is it different from a single swing analysis?',
        answer:
          'A normal analysis studies one swing in one sport. Athlete General Intelligence reasons across all of them at once to answer a bigger question: of everything you could work on, which one thing improves the most sports? Train that, and you lift several at the same time.',
      },
      {
        question: 'What is a keystone skill?',
        answer:
          'A keystone skill is the single sport-neutral capability — like rotation, sequencing, or balance — that limits the most of your sports at once. Improving it transfers, so one focused fix raises several activities instead of just one.',
      },
      {
        question: 'Which sports does Athlete General Intelligence support?',
        answer:
          'It works across SwingVantage’s seven sports — golf, tennis, pickleball, padel, baseball, slow-pitch softball, and fast-pitch softball — by mapping each one onto the same shared set of athletic capabilities.',
      },
      {
        question: 'Do I need to analyze multiple sports to use it?',
        answer:
          'No. One swing builds your cross-sport model. Add a second sport and it starts finding what transfers between them — but you get value from the very first analysis.',
      },
    ],
  },
  {
    slug: 'how-ai-swing-analysis-works',
    title: 'How AI Swing Analysis Works',
    heading: 'How AI Swing Analysis Works',
    description:
      'A look under the hood of AI swing analysis: how SwingVantage reads your video, detects likely faults, ranks your top fix, and turns it into a plan you can act on.',
    answerSummary:
      'AI swing analysis works by turning your video and inputs into structured signals, applying sport-specific rules and AI to detect likely faults, then ranking the single fix most likely to help. SwingVantage labels each finding’s confidence, builds a short practice plan, and uses your retests to confirm what worked.',
    breadcrumbLabel: 'How AI Swing Analysis Works',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'How does AI swing analysis work?',
        answer:
          'It converts your swing video and inputs into structured signals, applies sport-specific rules and AI to spot likely faults, ranks the single highest-impact fix, and turns it into drills and a practice plan — then confirms the change with a retest.',
      },
      {
        question: 'What does AI look for in a swing video?',
        answer:
          'It reads things it can see reliably — setup, path tendencies, sequencing, balance, and the ball-flight or contact consequences of a fault — and maps them to the most likely cause, rather than guessing precise 3D angles a sensor would measure.',
      },
      {
        question: 'Does AI swing analysis use my launch monitor data too?',
        answer:
          'Yes. If you import launch-monitor or ball-flight data, SwingVantage combines those measured numbers with what it reads from video, which corroborates the diagnosis and raises confidence.',
      },
      {
        question: 'How does SwingVantage pick the one fix to work on?',
        answer:
          'It prioritizes the fault that is limiting your results the most and is realistic for your level — your single next-best action — instead of dumping a long list of everything that is imperfect.',
      },
      {
        question: 'How long does an AI swing analysis take?',
        answer:
          'A fast heuristic first pass is near-instant, so you get useful guidance right away. Deeper AI video analysis takes a little longer where the extra depth genuinely adds value.',
      },
      {
        question: 'Is my swing video kept private?',
        answer:
          'SwingVantage is built privacy-forward and labels the source of every data point. Your video is used to analyze your swing, not to fabricate metrics, and nothing here is medical or injury advice.',
      },
    ],
  },
  {
    slug: 'does-ai-replace-a-coach',
    title: 'Does AI Replace a Coach?',
    heading: 'Does AI Replace a Coach?',
    description:
      'Does AI replace a swing coach? No — and here’s why. Learn how SwingVantage’s AI analysis complements coaching, what it does well, and where a human coach is still essential.',
    answerSummary:
      'No, AI does not replace a coach. SwingVantage gives you fast, data-backed guidance you can act on today and makes your coaching sessions more productive, but a human coach is still essential for hands-on feel, injury concerns, and advanced technique. The two work best together.',
    breadcrumbLabel: 'Does AI Replace a Coach?',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'Does AI replace a swing coach?',
        answer:
          'No. AI handles the fast first pass — spotting your top fault and giving you a plan you can act on today — while a human coach brings hands-on feel, accountability, and advanced correction. SwingVantage is designed to make coaching more productive, not to replace it.',
      },
      {
        question: 'What can AI swing analysis do that a coach can’t?',
        answer:
          'It is instant, affordable, available every time you practice, consistent, and it remembers your full history — so you can get a structured read between lessons instead of waiting and guessing.',
      },
      {
        question: 'What can a coach do that AI can’t?',
        answer:
          'A coach can feel your motion in person, adjust grip and posture by hand, read your body language and motivation, manage injuries, and tailor advanced technique in ways single-camera software cannot.',
      },
      {
        question: 'Should I still take lessons if I use SwingVantage?',
        answer:
          'If you have access to a good coach, yes. SwingVantage helps you show up to lessons already knowing your top issue, ask sharper questions, and keep progress between sessions — so you get more from every lesson.',
      },
      {
        question: 'Can I share my AI analysis with my coach?',
        answer:
          'Yes. Sharing your findings, confidence labels, and progress gives a coach context fast, so your time together goes straight to the work that matters.',
      },
      {
        question: 'Is AI coaching safe for young athletes?',
        answer:
          'SwingVantage gives general, non-medical guidance and keeps language appropriate to a player’s level. Young athletes should be supervised during practice, and any pain or injury concern belongs with a qualified coach or medical professional.',
      },
    ],
  },
  {
    slug: 'how-to-film-your-swing',
    title: 'How to Film Your Swing for AI Analysis',
    heading: 'How to Film Your Swing for AI Analysis',
    description:
      'How to film your swing for AI analysis: the right camera angle, distance, framing, lighting, and speed — so your results are as accurate and useful as possible.',
    answerSummary:
      'To film your swing for AI analysis, set your phone on a stable surface at about hip height, frame your whole body and the club or bat with a little room to spare, and record in good, even light. A true face-on or down-the-line angle matters most — the cleaner the angle, the more accurate the read.',
    breadcrumbLabel: 'How to Film Your Swing',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'How should I film my swing for analysis?',
        answer:
          'Steady the phone on a tripod or solid surface at hip height, frame your whole body and the club or bat with a little margin, record in good even light, and capture the full swing including the finish. Hold the camera still — no panning.',
      },
      {
        question: 'What camera angle is best for swing analysis?',
        answer:
          'The two best angles are face-on (directly in front of you) and down-the-line (directly behind your hands, on the target line). Down-the-line is most important for path and plane; face-on is best for balance and sequencing.',
      },
      {
        question: 'How far away should the camera be?',
        answer:
          'Far enough to fit your whole body, the implement, and the start of ball flight in frame with a little room to spare. Too close clips the swing; too far makes detail hard to read.',
      },
      {
        question: 'Do I need slow-motion video?',
        answer:
          'No. Normal speed works well. If your phone offers a higher frame rate easily, it can help, but a clear angle and good lighting matter far more than slow motion.',
      },
      {
        question: 'Why does camera angle change my results?',
        answer:
          'Analysis is read from a 2D video, so an off-axis camera can fake a problem that is not really there — especially with swing plane and path. Filming truly face-on or down-the-line is the single biggest factor in an accurate read.',
      },
      {
        question: 'Can I upload a video I already have?',
        answer:
          'Yes, as long as it shows the full swing from a usable angle with reasonable lighting. If the angle is off, re-filming to a true face-on or down-the-line view will give you a more reliable result.',
      },
    ],
  },
  {
    slug: 'measured-vs-estimated',
    title: 'Measured vs Estimated Swing Data',
    heading: 'Measured vs Estimated Swing Data',
    description:
      'What’s the difference between measured and estimated swing data? Learn how SwingVantage labels each finding by evidence so you always know how much to trust it.',
    answerSummary:
      'Measured data comes from a sensor like a launch monitor; estimated data is inferred from video and known patterns. SwingVantage labels every finding by its evidence basis — measured, estimated, AI-inferred, or self-reported — and attaches a confidence level, so you always know how much weight to give a read.',
    breadcrumbLabel: 'Measured vs Estimated Data',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'What is the difference between measured and estimated swing data?',
        answer:
          'Measured data is captured directly by a sensor — for example, ball speed from a launch monitor. Estimated data is inferred from video and known patterns when no sensor reading exists. Both are useful; they just carry different certainty, which SwingVantage labels openly.',
      },
      {
        question: 'Is estimated swing data reliable?',
        answer:
          'Estimated data is reliable as a structured starting point, especially for common patterns, and it improves with clearer video and more sessions. It is labeled “estimated” precisely so you never mistake it for a precise sensor measurement.',
      },
      {
        question: 'What does “estimated from video” mean?',
        answer:
          'It means the finding was inferred from what the camera could see plus proven rules, not measured by a device. Camera angle and video quality affect it, which is why a clean face-on or down-the-line clip raises its confidence.',
      },
      {
        question: 'Why doesn’t SwingVantage just measure everything?',
        answer:
          'Some things genuinely require hardware most athletes do not have. Rather than fake precision, SwingVantage estimates honestly from video and clearly labels what is measured versus inferred — and uses your launch-monitor data when you import it.',
      },
      {
        question: 'What are confidence labels?',
        answer:
          'Confidence labels are SwingVantage’s honesty mechanism: every diagnosis, score, and recommendation shows a plain-English confidence level and the data points behind it, so you know how much weight to put on each finding.',
      },
      {
        question: 'How do I raise a finding from estimated to higher confidence?',
        answer:
          'Add clearer video from a true angle, log more sessions so a pattern repeats, import launch-monitor data where relevant, and complete retests. Consistent, corroborating evidence is what lifts confidence.',
      },
    ],
  },
  {
    slug: 'how-to-read-your-swing-report',
    title: 'How to Read Your AI Swing Report',
    heading: 'How to Read Your AI Swing Report',
    description:
      'A guide to reading your SwingVantage AI swing report: your top fix, confidence labels, drills, practice plan, and retest — so you know exactly what to work on next.',
    answerSummary:
      'Your AI swing report leads with one prioritized fix — the change most likely to help — followed by the evidence and confidence behind it, drills matched to you, a short practice plan, and a retest to confirm progress. Read it top-down: the headline fix is where to start, not the wall of metrics.',
    breadcrumbLabel: 'How to Read Your Report',
    datePublished: PUBLISHED,
    dateModified: MODIFIED,
    faqs: [
      {
        question: 'How do I read my AI swing report?',
        answer:
          'Start at the top. Your report leads with one prioritized fix, then shows the evidence and confidence behind it, the drills matched to you, a short practice plan, and a retest. Work the headline fix first instead of trying to read every metric at once.',
      },
      {
        question: 'What is the “top fix” in my report?',
        answer:
          'It is the single change SwingVantage believes will help your results the most right now, chosen for impact and for being realistic at your level — your next-best action, not a list of everything imperfect.',
      },
      {
        question: 'What do the confidence labels on my report mean?',
        answer:
          'They tell you how strong the evidence is for each finding — whether it was measured or estimated and how certain it is — plus the data points behind it, so you know how much to trust a given read.',
      },
      {
        question: 'Why does my report focus on one fix instead of everything?',
        answer:
          'Because chasing many changes at once stalls progress. One fix, one plan, and one retest keeps practice focused and makes it easy to tell whether the change actually worked.',
      },
      {
        question: 'What should I do after reading my report?',
        answer:
          'Run the short practice plan for your top fix, then record a retest under similar conditions. Comparing the retest to your baseline confirms whether the change worked and what to do next.',
      },
      {
        question: 'How do I know if my fix worked?',
        answer:
          'Retest. SwingVantage compares a fresh analysis to your baseline and shows what moved, what held, and what to work on next — so improvement is proven, not guessed.',
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
