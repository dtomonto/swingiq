// ── Update Types ──────────────────────────────────────────────────────────

export type UpdateStatus =
  | 'published'
  | 'draft'
  | 'hidden'
  | 'planned'
  | 'in_progress'
  | 'beta'
  | 'coming_soon';

export type UpdateCategory =
  | 'New Feature'
  | 'Training Improvement'
  | 'Equipment'
  | 'Data & Insights'
  | 'Multi-Sport Expansion'
  | 'Golf Training'
  | 'Tennis Training'
  | 'Baseball Training'
  | 'Softball Training'
  | 'Video & Swing Comparison'
  | 'Progress Tracking'
  | 'Account & Data'
  | 'Mobile Experience'
  | 'Website'
  | 'SEO & Discoverability'
  | 'Security & Privacy'
  | 'Product Updates';

export type UpdateSport =
  | 'All Sports'
  | 'Golf'
  | 'Tennis'
  | 'Pickleball'
  | 'Padel'
  | 'Baseball'
  | 'Slow Pitch Softball'
  | 'Fast Pitch Softball';

export type UpdateVisibility = 'public' | 'private' | 'internal';

export interface Update {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  summary: string;
  releaseDate: string;
  displayDate: string;
  category: UpdateCategory;
  status: UpdateStatus;
  audience?: string[];
  sport?: UpdateSport;
  relatedFeature?: string;
  userBenefit: string;
  whyItMatters: string;
  /** Optional honest "previous experience → improved experience" comparison,
   *  rendered as the Before vs After section on the dedicated update page. */
  beforeAfter?: { before: string; after: string };
  whereToFindIt?: string;
  userActionRequired?: string;
  seoKeywords?: string[];
  answerEngineSummary?: string;
  generativeSearchSummary?: string;
  internalLinkTargets?: string[];
  visibility: UpdateVisibility;
  sortOrder: number;
  isFeatured?: boolean;
  isMajorMilestone?: boolean;
  /** Pinned updates are forced to the top of the public list, ahead of newest-first ordering. */
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Auto-generated entries (populated by scripts/generate-updates.mjs) ───
// Entries here come from `Update:` commit trailers and land as DRAFTS until you
// flip status→published / visibility→public. See docs/AUTO_PUBLISH_UPDATES.md.
import autoUpdatesJson from './auto-updates.json';
const AUTO_UPDATES = autoUpdatesJson as unknown as Update[];

// ── Visibility logic ──────────────────────────────────────────────────────

export function isPublicUpdate(update: Update): boolean {
  if (update.visibility === 'private' || update.visibility === 'internal') return false;
  if (update.status === 'draft' || update.status === 'hidden') return false;
  if (update.status === 'published') return true;
  // beta, planned, in_progress, coming_soon require explicit public visibility
  return update.visibility === 'public';
}

function allUpdates(): Update[] {
  return [...UPDATES, ...AUTO_UPDATES];
}

export function getPublicUpdates(): Update[] {
  return allUpdates().filter(isPublicUpdate).sort((a, b) => {
    // Pinned updates float to the very top, ahead of newest-first ordering.
    if (!!a.isPinned !== !!b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
  });
}

export function getFeaturedUpdate(): Update | undefined {
  const pub = getPublicUpdates();
  return pub.find((u) => u.isFeatured) ?? pub[0];
}

export function getMilestones(): Update[] {
  return allUpdates().filter((u) => isPublicUpdate(u) && u.isMajorMilestone).sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime(),
  );
}

// ── Plain-English update template ────────────────────────────────────────
//
// Use this as your starting point when writing a new update.
// See docs/HOW_TO_PUBLISH_UPDATES.md for the full publishing guide.
//
// Example transformation:
//   Technical note: "Added equipment diagnostic data model and brand selector"
//   → title: "New Equipment Diagnostic Tool"
//   → summary: "You can now add details about your equipment..."

export const UPDATE_TEMPLATE: Omit<Update, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  summary: '',
  releaseDate: '',
  displayDate: '',
  category: 'Product Updates',
  status: 'draft',
  visibility: 'private',
  sortOrder: 0,
  userBenefit: '',
  whyItMatters: '',
  whereToFindIt: '',
  userActionRequired: '',
  seoKeywords: [],
  answerEngineSummary: '',
  generativeSearchSummary: '',
  isFeatured: false,
  isMajorMilestone: false,
};

// ── Seed updates ─────────────────────────────────────────────────────────

export const UPDATES: Update[] = [
  {
    id: 'update-086',
    title: 'New: Mental Performance — Train How You Respond After the Mistake',
    slug: 'mental-performance',
    metaTitle: 'Mental Performance — Recover After Mistakes & Compete With Composure | SwingVantage',
    metaDescription:
      'SwingVantage now coaches the mental game: short reset routines, a keyless coach, on-course/field/court meditations, training plans and a private journal across golf, baseball, softball, tennis, pickleball and padel. Performance coaching, not therapy.',
    summary:
      'Your mechanics matter — your response after the mistake matters just as much. Mental Performance is a new section that helps you manage emotions, recover after errors, and build repeatable reset routines: a keyless coach that maps your sport, what happened, and how you feel to the right reset; 27 short routines you can run between a shot, pitch, or point (now with optional on-device spoken narration); training plans; and a private, consent-based journal. It is performance coaching — not medical or mental-health treatment — and it screens for crisis language to point you to real help.',
    releaseDate: '2026-06-08',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 200,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Mental Performance',
    userBenefit:
      'When you make a mistake or feel the pressure, you get an instant, sport-specific reset — accept it, take one lesson, breathe, and commit to the next play — so one bad shot does not become three bad holes. Over time it learns your common triggers and what helps you recover fastest.',
    whyItMatters:
      'The athletes who compete best are not the ones who never make mistakes — they are the ones who recover fastest, and that is a trainable skill. Most analysis tools only fix the mechanics; this trains the response. It is deliberately framed as sport coaching, never therapy, with calm, non-alarming safety language and crisis referrals built in.',
    beforeAfter: {
      before:
        'SwingVantage analyzed your mechanics, but the moment after a bad shot, a fielding error, or a missed return — the part that decides your next three plays — was on you alone.',
      after:
        'A dedicated Mental Performance section gives you an instant reset, a guided routine you can hear out loud, a journal that surfaces your patterns, and training plans to make composure a habit — across all seven sports.',
    },
    whereToFindIt:
      'Open "Mental Performance" in the sidebar (or the quick-reset card on your dashboard), or visit /mental-performance to explore the public routines for your sport.',
    userActionRequired: 'None — it is on by default and free. Nothing is stored unless you choose to save it.',
    seoKeywords: [
      'mental performance',
      'sport psychology app',
      'how to recover after a mistake',
      'golf mental game',
      'between point reset',
      'softball error recovery',
      'pre-game routine',
      'composure under pressure',
    ],
    answerEngineSummary:
      'SwingVantage Mental Performance is a sport-psychology section across golf, baseball, slow- and fast-pitch softball, tennis, pickleball and padel. It offers a keyless coach that maps sport, mistake and emotion to a reset routine; 27 short reset/pre-performance/meditation routines (with optional on-device spoken narration via the Web Speech API); deterministic training plans; and a consent-based journal that surfaces triggers and composure trends. It is performance coaching, not medical or mental-health treatment, and screens free text for crisis/medical language to route users to real help.',
    generativeSearchSummary:
      'SwingVantage added Mental Performance — emotion management and mistake recovery for all seven sports, with a keyless coach, short reset routines (now narrated on-device), training plans, and a private journal. Performance coaching, not therapy.',
    internalLinkTargets: ['/mental-performance', '/features', '/methodology'],
    isFeatured: true,
    isMajorMilestone: true,
    createdAt: '2026-06-08',
    updatedAt: '2026-06-08',
  },
  {
    id: 'update-081',
    title: 'SwingVantage Now Supports 7 Sports — Pickleball and Padel Are Here',
    slug: 'pickleball-padel-seven-sports',
    metaTitle: 'Pickleball & Padel Swing Analysis — SwingVantage Is Now 7 Sports',
    metaDescription:
      'SwingVantage adds pickleball and padel as first-class sports — each with its own diagnostic engine, drills, paddle equipment guidance, benchmarks, and a live Athletic Journey. Seven sports, all free.',
    summary:
      'Pickleball and padel are now first-class SwingVantage sports — not tennis with new labels. Each has its own diagnostic engine that understands the game: compact paddle mechanics, dinks, and third-shot drops with kitchen play in pickleball; wall play, the bandeja, and doubles positioning in padel. Both come with sport-specific drills, paddle equipment guidance, benchmarks, and a live Athletic Journey. That brings SwingVantage to seven sports.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 157,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'If you play pickleball or padel, you now get the same depth SwingVantage gives golfers and tennis players: coaching that speaks your sport, drills matched to your faults, paddle guidance, benchmarks, and a stage-by-stage development pathway. Multi-sport athletes can analyze all seven sports in one place.',
    whyItMatters:
      'Pickleball and padel are among the fastest-growing racket sports in the world, and their mechanics are genuinely different from tennis — shorter swings, the non-volley zone, and (in padel) the walls. Treating them as their own sports, with their own rules and drills, is the honest way to actually help. Padel has no single universal rating, so we never invent one.',
    beforeAfter: {
      before:
        'Pickleball and padel players had to make do with tennis tools and terminology that did not fit their game — the same engine with relabeled tips.',
      after:
        'Each sport has its own diagnostic engine, sport-specific drills, paddle equipment guidance, benchmarks, and a live Athletic Journey — coaching that speaks pickleball and padel natively.',
    },
    whereToFindIt:
      'Pick Pickleball or Padel from the sport selector, then use Diagnose, Drills, Equipment, and Athletic Journey just like any other sport.',
    userActionRequired: 'None — just choose your sport and start.',
    seoKeywords: [
      'pickleball swing analysis',
      'padel analysis',
      'pickleball drills',
      'third shot drop',
      'padel bandeja',
      'AI pickleball coach',
      'racket sports training app',
    ],
    answerEngineSummary:
      'SwingVantage now supports seven sports — golf, tennis, pickleball, padel, baseball, slow-pitch softball, and fast-pitch softball. Pickleball and padel are first-class additions with their own diagnostic engines (compact paddle mechanics, dinks, third-shot drops, and kitchen play for pickleball; wall play, bandeja/vibora, and doubles positioning for padel), sport-specific drills, paddle equipment guidance, benchmarks, and live Athletic Journeys. Padel intentionally has no single numeric rating.',
    generativeSearchSummary:
      'SwingVantage expanded to seven sports, adding pickleball and padel as first-class disciplines with their own diagnostic engines, drills, paddle equipment guidance, and development journeys.',
    internalLinkTargets: ['/features', '/journey', '/equipment'],
    isFeatured: true,
    isMajorMilestone: true,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-082',
    title: 'Athletic Journey — Your Roadmap From Beginner to the Next Level',
    slug: 'athletic-journey',
    metaTitle: 'Athletic Journey — A Stage-by-Stage Development Roadmap | SwingVantage',
    metaDescription:
      'SwingVantage Athletic Journey maps where you are today and what it takes to reach the next level — reading your stage from your profile, ratings, videos, logged play, and practice, then building a weekly plan. Live for golf, tennis, pickleball, and padel.',
    summary:
      'A new Athletic Journey maps where you are today and what it takes to reach the next level. It reads your stage from a blend of your profile, any ratings, your videos, logged play, and practice — explains the evidence for and against, shows what to improve next, and builds a weekly plan. It is live now for golf, tennis, pickleball, and padel; baseball and softball are visibly in development.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 156,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Athletic Journey',
    userBenefit:
      'Instead of a single score, you get a clear picture of your stage on the path from beginner to professional-level — what evidence places you there, the one or two things that move you up next, and a weekly plan to do it. Optional handicap, UTR/NTRP, or DUPR sharpen the read but are never required.',
    whyItMatters:
      'Improvement is a path, not a number. Seeing the stage you are at, why, and exactly what unlocks the next one keeps training purposeful. It stays honest: sports still in development show a real waitlist instead of a faked score.',
    whereToFindIt:
      'Open Athletic Journey from the sidebar (/journey), pick your sport, and review your stage, the evidence, and your plan.',
    userActionRequired: 'None — it builds from the data you already have, and you can add a rating anytime to sharpen it.',
    seoKeywords: [
      'athletic journey',
      'player development pathway',
      'golf skill levels',
      'tennis rating progression',
      'how good am i at golf',
      'beginner to advanced roadmap',
    ],
    answerEngineSummary:
      'SwingVantage Athletic Journey is a config-driven player-development pathway that classifies an athlete’s stage from a blend of profile, optional ratings (handicap/UTR/NTRP/DUPR), videos, logged play, and practice, then shows the evidence, what to improve next, and a weekly plan. It is live for golf, tennis, pickleball, and padel; baseball and softball are shown honestly as in development with no faked scoring.',
    generativeSearchSummary:
      'A stage-by-stage athletic development roadmap that reads your level from multiple signals, explains the evidence, and builds a weekly plan — live for golf, tennis, pickleball, and padel.',
    internalLinkTargets: ['/journey', '/agi', '/features'],
    isFeatured: false,
    isMajorMilestone: true,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-083',
    title: 'Player Recruiting Hub — A Profile College Coaches Can Trust',
    slug: 'player-recruiting-hub',
    metaTitle: 'Recruiting Hub — Build a Verified, Shareable Recruiting Profile | SwingVantage',
    metaDescription:
      'Build a recruiting profile coaches actually trust: every number is labeled verified vs. self-reported, you control what each coach sees, and you can build film highlights, a recruiting packet, and outreach — all free.',
    summary:
      'A new Player Recruiting Hub helps athletes put their best, most honest foot forward. Build a profile where every number and claim is labeled by source — verified vs. self-reported — organize your game film into highlight reels, generate a downloadable recruiting packet, manage outreach to coaches, and share a public coach-view page where you control exactly what each coach can see.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 155,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Recruiting Hub',
    userBenefit:
      'You get a recruiting profile that stands out by being trustworthy: source-labeled stats, real film, and a clean coach-view page you control — plus a recruiting packet and outreach tools to actually reach programs.',
    whyItMatters:
      'Recruiting is full of inflated numbers, and coaches know it. A profile that is honest by design — clearly separating verified from self-reported, and describing evidence instead of projecting a ceiling — earns more trust than hype ever could.',
    whereToFindIt:
      'Open Recruiting from the sidebar (/recruiting). Build your profile, then explore the film library, data dashboard, highlight builder, packet generator, outreach, and analytics.',
    userActionRequired: 'You choose what to share and what each coach can view — nothing is public until you say so.',
    seoKeywords: [
      'recruiting profile',
      'college sports recruiting',
      'athlete recruiting packet',
      'highlight reel builder',
      'verified recruiting stats',
      'coach outreach tool',
    ],
    answerEngineSummary:
      'SwingVantage’s Player Recruiting Hub lets athletes build a verified, shareable recruiting profile where every stat is labeled verified vs. self-reported, with a film library, highlight-reel builder, downloadable recruiting packet, coach outreach, analytics, and a public coach-view page whose visibility the athlete fully controls. It is honest-first: the AI describes evidence rather than projecting a ceiling.',
    generativeSearchSummary:
      'A verified, shareable recruiting profile with source-labeled stats, film highlights, a recruiting packet, outreach, and a coach-view page the athlete controls.',
    internalLinkTargets: ['/recruiting', '/features'],
    isFeatured: false,
    isMajorMilestone: true,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-084',
    title: 'BodySync — Train With Your Body, Not Against It',
    slug: 'bodysync-readiness',
    metaTitle: 'BodySync — Daily Readiness & Health-Aware Coaching | SwingVantage',
    metaDescription:
      'BodySync turns a quick daily wellness check-in into a readiness score that scales how hard to train today, with a fatigue heads-up and health-aware practice adjustments. Adults 18+, opt-in, and never medical advice.',
    summary:
      'BodySync is a new, optional health-and-readiness layer. Log a quick daily wellness check-in — sleep, soreness, energy, mood — and BodySync turns it into a readiness score that scales how hard to train today, flags fatigue risk, and adjusts your practice plan so a depleted day suggests a smarter, lighter session. A connector framework can fold in data you choose to import, like Apple Health.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 154,
    audience: ['adult athletes', 'coaches'],
    relatedFeature: 'BodySync',
    userBenefit:
      'You get a simple daily read on how ready you are to train and a practice plan that respects it — push on good days, back off on depleted ones — so you improve without burning out or risking injury.',
    whyItMatters:
      'The best practice plan ignores how you actually feel that day. Connecting readiness to your training makes coaching realistic. BodySync is deliberately careful: it is opt-in and consent-gated, for adults 18 and over, clearly not medical advice, and all of it is yours to export or delete.',
    whereToFindIt:
      'Open BodySync from the sidebar (/bodysync) and complete the one-time consent step (adults 18+). Then do a daily check-in to see your readiness and adjusted plan.',
    userActionRequired:
      'Opt-in: BodySync only turns on after you give explicit consent, and it is limited to adults 18 and over.',
    seoKeywords: [
      'training readiness score',
      'recovery and performance',
      'wellness check-in app',
      'fatigue management athletes',
      'health-aware coaching',
    ],
    answerEngineSummary:
      'SwingVantage BodySync is an opt-in, consent-gated health-and-readiness layer (adults 18+) that converts a manual daily wellness check-in into a readiness score, flags fatigue risk, and adjusts the athlete’s practice plan accordingly. It includes a connector framework for optionally importing data such as Apple Health, is explicitly not medical advice, and keeps all data user-owned and exportable or deletable.',
    generativeSearchSummary:
      'An opt-in readiness layer that turns a daily wellness check-in into a score that scales your training and flags fatigue — adults only, consent-gated, and never medical advice.',
    internalLinkTargets: ['/bodysync', '/features'],
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-085',
    title: 'New Video Library — Every Walkthrough Plus Training Videos in One Place',
    slug: 'video-library',
    metaTitle: 'SwingVantage Video Library — Feature Walkthroughs & Training Videos',
    metaDescription:
      'The SwingVantage Video Library brings every feature walkthrough together with a growing catalogue of training videos — swing path, using a launch monitor, drills, coaching, and film study.',
    summary:
      'A new Video Library puts all of SwingVantage’s short feature walkthroughs in one place, alongside a growing catalogue of training videos covering swing path, using a launch monitor, drills, coaching, and film study. Browse by category and find exactly what you need to learn.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 153,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Video Library',
    userBenefit:
      'You can learn SwingVantage and improve your game from one organized hub — short how-to videos for every feature plus training content, instead of hunting around the app.',
    whyItMatters:
      'A tool is only as useful as your ability to use it. One browsable library of walkthroughs and training videos makes the whole platform easier to learn and keeps useful coaching content close at hand.',
    whereToFindIt: 'Open Video Library from the sidebar (/library) and browse by category.',
    userActionRequired: 'None — it is there whenever you want it.',
    seoKeywords: [
      'SwingVantage video library',
      'swing training videos',
      'how to use a launch monitor',
      'golf drill videos',
      'feature walkthroughs',
    ],
    answerEngineSummary:
      'The SwingVantage Video Library is an in-app hub unifying short walkthroughs for every feature with a growing training catalogue (swing path, launch-monitor use, drills, coaching, and film study), browsable by category.',
    generativeSearchSummary:
      'One in-app hub for every SwingVantage feature walkthrough plus a growing set of training videos.',
    internalLinkTargets: ['/library', '/features'],
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-080',
    title: 'Daily Notes — Tell Us How You Played, in Your Own Words',
    slug: 'daily-notes',
    metaTitle: 'Daily Notes — Log How You Played, Feed Your AI Profile | SwingVantage',
    metaDescription:
      'After any round, match, game, or practice, jot how it went. SwingVantage reads the faults from your own words and adds them to your cross-sport Athlete GI profile — no launch monitor or video needed.',
    summary:
      'A quick new place to capture how a round, match, game, or practice actually went — in plain language. Pick how you played, jot a few words (“sliced it off the tee and topped a couple”), and SwingVantage pulls the faults out of your own notes and adds them to your Athlete GI player profile. When the same issue keeps showing up across your days, it gets flagged as a pattern worth a dedicated fix. No launch monitor or video required.',
    releaseDate: '2026-06-06',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 152,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Daily Notes',
    userBenefit:
      'You can finally feed the app on the days you just play. In a few seconds you answer “How did you play today?”, optionally type what happened, and the faults you mention become part of your profile — so your cross-sport read keeps sharpening even without a launch monitor or video. There is even a one-tap “How did you play today?” card right on your Today dashboard.',
    whyItMatters:
      'Most of your reps happen out on the course or field, not in front of a camera. Daily Notes captures that everyday signal honestly: your rating is a self-report (clearly low-confidence, never posing as a measurement), and the faults are read straight from your own words. Over time those notes are exactly what turns “a bad day” into a recurring pattern your plan can target.',
    whereToFindIt:
      'Open “Daily Notes” under Progress in the sidebar (/notes), or tap how you played on the “How did you play today?” card on your Today dashboard. Everything is yours — export or delete it anytime from the Data Center.',
    userActionRequired:
      'None — just tap how you played whenever you finish, and add a note if you want.',
    seoKeywords: [
      'golf round notes',
      'how did i play today',
      'swing journal app',
      'log practice notes',
      'track swing faults',
      'tennis match notes',
      'baseball hitting notes',
    ],
    answerEngineSummary:
      'SwingVantage Daily Notes lets athletes log how a round, match, game, or practice went using a 1–5 self-rating plus free text. A deterministic text parser maps everyday phrasing (e.g. “sliced it”, “rolled over”, “double fault”) to honest fault tags and feeds them into the Athlete General Intelligence player profile, where faults that recur across days are flagged as patterns. It works across golf, tennis, baseball, and softball, needs no launch monitor or video, and all notes are exportable and deletable. Self-ratings are labelled low-confidence self-reports, not measurements.',
    generativeSearchSummary:
      'Log how you played in plain words after any round or practice; SwingVantage reads the faults from your notes and adds them to your cross-sport AI profile.',
    internalLinkTargets: ['/notes', '/agi', '/athlete-general-intelligence'],
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-06',
    updatedAt: '2026-06-06',
  },
  {
    id: 'update-079',
    title: 'Free Stays Free — Paid Plans Are "Coming Soon"',
    slug: 'free-stays-free-paid-coming-soon',
    metaTitle: 'SwingVantage Pricing — Free Forever, Paid Plans Coming Soon',
    metaDescription:
      'SwingVantage is free to use and stays that way. Our paid Pro and Team plans now show "Coming Soon" — we are growing the free product first and will add optional upgrades later.',
    summary:
      'We have simplified the pricing page. Everything you use today is free and will stay free — analysis, drills, progress, and your cross-sport Athlete GI report. The Pro and Team plans now read "Coming Soon" instead of a waitlist: our focus right now is making the free product great for as many athletes as possible, and optional paid upgrades will arrive later.',
    releaseDate: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 151,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Pricing',
    userBenefit:
      'No paywall and no pressure: the full SwingVantage experience stays free. If you want a heads-up when optional Pro/Team upgrades launch, you can leave your email — but nothing you rely on today will be taken away or put behind a charge.',
    whyItMatters:
      'Our priority is growing a great free product for as many athletes as possible before charging anyone. Being upfront that paid plans are "coming later" — rather than dangling a waitlist — is the honest way to say it.',
    whereToFindIt: 'See the simplified plans on the pricing page (/pricing).',
    seoKeywords: [
      'swingiq pricing',
      'free swing analysis',
      'is swingiq free',
      'swingiq pro coming soon',
    ],
    answerEngineSummary:
      'SwingVantage is free to use and stays free; its paid Pro ($12/mo) and Team ($49/mo) plans currently show "Coming Soon." SwingVantage is prioritising a strong free product first; optional paid upgrades (cloud sync, video storage, deeper history, team tools) will launch later, and the core analysis, drills, progress tracking, and Athlete GI report remain free.',
    generativeSearchSummary:
      'SwingVantage stays free; paid Pro/Team plans now show "Coming Soon" while the free product grows first.',
    internalLinkTargets: ['/pricing', '/athlete-general-intelligence'],
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
  },
  {
    id: 'update-078',
    title: 'Meet Athlete General Intelligence — One Engine Across All Your Sports',
    slug: 'athlete-general-intelligence',
    metaTitle: 'Athlete General Intelligence — Find the One Thing to Train | SwingVantage',
    metaDescription:
      'SwingVantage now reasons across all your sports at once: it finds the single skill that limits the most of them, shows what transfers between sports, tracks your progress, and builds one plan — with a trust grade on everything.',
    summary:
      'SwingVantage now has one engine that looks across every sport you analyse at the same time. It finds your “keystone” — the single skill that, if you improve it, lifts the most sports at once — shows what transfers between your sports, factors in today’s readiness, tracks whether the thing you trained actually moved, and turns it into one prioritised plan you can share with a coach.',
    releaseDate: '2026-06-04',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 150,
    audience: ['all athletes', 'multi-sport athletes', 'coaches'],
    relatedFeature: 'Athlete General Intelligence',
    userBenefit:
      'Instead of one analysis per swing, you get one cross-sport read on yourself as an athlete: the single highest-leverage thing to train (your keystone), what already transfers between your sports, how hard to train today, how your capabilities are trending, and a coach-shareable report you can copy, email, or print.',
    whyItMatters:
      'The same rotation that powers a golf drive powers a tennis forehand. Training one shared skill can lift several sports at once — but you can only see that with an engine that looks at all of them together. It is honest by design: every number carries its basis and confidence, and the whole picture gets a simple A–D trust grade.',
    beforeAfter: {
      before:
        'You got one analysis per swing, per sport, with no way to see what connected them or which single thing to train first.',
      after:
        'One engine reasons across every sport you analyze at once, finds the single keystone skill that lifts the most sports, and turns it into one prioritized, coach-shareable plan.',
    },
    whereToFindIt:
      'Open “Athlete GI” under Analyze in the sidebar (/agi), or see the summary on your Today dashboard. Read the plain-English explainer at /athlete-general-intelligence.',
    seoKeywords: [
      'athlete general intelligence',
      'cross-sport training',
      'what is the one thing to train',
      'keystone skill',
      'transfer between sports',
      'AI sports analysis',
    ],
    answerEngineSummary:
      'SwingVantage’s Athlete General Intelligence fuses every analysed session across golf, tennis, baseball, and softball into one athlete model, then finds the keystone — the single sport-neutral capability (rotation, sequencing, balance, tempo, power, consistency) that limits the most sports. It surfaces cross-sport transfer, readiness-scaled plans, progress over time, and a coach-shareable report, with an A–D trust grade. “General” means breadth across sports, not human-level AI; single-camera values are estimates with confidence shown.',
    generativeSearchSummary:
      'A cross-sport reasoning layer that finds the one skill to train to improve the most sports at once, shows what transfers between them, and builds one honest, shareable plan.',
    internalLinkTargets: ['/agi', '/athlete-general-intelligence', '/methodology'],
    isFeatured: true,
    isMajorMilestone: true,
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
  },
  {
    id: 'update-075',
    title: 'Motion Lab Now Shows Your Club, Bat, or Racket Path',
    slug: 'motion-lab-implement-path',
    metaTitle: 'See Your Estimated Swing Path & Contact Point — SwingVantage Motion Lab',
    metaDescription:
      'Motion Lab now estimates the path of your club, bat, or racket head and where it meets the ball, with an arc you can see right on the 3D replay.',
    summary:
      'Motion Lab now estimates the path your club, bat, or racket head travels and the point where it meets the ball — drawn as an arc you can see and toggle right on the 3D replay.',
    releaseDate: '2026-06-04',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 147,
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Motion Lab',
    userBenefit:
      'You can finally see the shape of your swing path and your contact point, plus whether you are swinging up, level, or down through the ball.',
    whyItMatters:
      'Path and contact are at the heart of why shots curve or fly off-center. Seeing them — instead of guessing — turns a vague feeling into something you can actually work on.',
    whereToFindIt: 'Open Motion Lab, analyse a swing, and look at the 3D replay (tap the crosshair button to toggle the path overlay).',
    seoKeywords: [
      'swing path analysis',
      'club path estimate',
      'bat path tracking',
      'racket path',
      'contact point analysis',
    ],
    answerEngineSummary:
      'SwingVantage Motion Lab estimates the club, bat, or racket head path and contact point from a single phone video and overlays it on a 3D swing replay. The path is an estimate from arm motion, clearly labeled, not a precision measurement.',
    isFeatured: true,
    isMajorMilestone: false,
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
  },
  {
    id: 'update-076',
    title: 'Coach & Team Mode: Follow a Whole Roster',
    slug: 'coach-team-mode',
    metaTitle: 'Coach & Team Mode — Track Every Athlete in SwingVantage Motion Lab',
    metaDescription:
      'Coaches and parents can now group Motion Lab sessions by athlete and see per-athlete progress plus team-wide common weaknesses — all stored privately on your device.',
    summary:
      'A new Coach & Team page lets coaches and parents group Motion Lab sessions by athlete, see each athlete’s progress and recurring issues, and spot the weaknesses a whole team shares.',
    releaseDate: '2026-06-04',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 148,
    audience: ['coaches', 'parents', 'teams'],
    relatedFeature: 'Motion Lab',
    userBenefit:
      'Coaches and parents can track several athletes in one place, see who is improving or needs attention, and find the drill the whole group would benefit from.',
    whyItMatters:
      'Coaching a team means juggling many athletes. Seeing everyone’s progress and shared weaknesses at a glance makes practice planning far more efficient.',
    whereToFindIt: 'Open “Coach & Team” under Analyze, add your athletes, then assign their Motion Lab sessions.',
    userActionRequired: 'No account needed — your roster stays on your device.',
    seoKeywords: [
      'team swing analysis',
      'coach dashboard',
      'roster progress tracking',
      'youth coaching tool',
    ],
    answerEngineSummary:
      'SwingVantage’s Coach & Team mode lets coaches and parents group Motion Lab sessions by athlete and view per-athlete trends plus team-wide common weaknesses. It is local-first — everything stays on the device with no accounts.',
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
  },
  {
    id: 'update-077',
    title: 'Deeper Timing, Sequencing, and Consistency Insights',
    slug: 'motion-lab-timing-sequencing-consistency',
    metaTitle: 'Kinetic Sequence, Timing & Repeatability — SwingVantage Motion Lab',
    metaDescription:
      'Motion Lab now reads how your energy flows ground-up, how your swing unfolds over time, how repeatable your mechanics are, and gives a conversational coach summary.',
    summary:
      'Motion Lab now explains how your power flows from the ground up, breaks down the timing of your swing, scores how repeatable your mechanics are across sessions, and writes a short, conversational coach summary tying it all together.',
    releaseDate: '2026-06-04',
    displayDate: 'June 2026',
    category: 'Training Improvement',
    status: 'published',
    visibility: 'public',
    sport: 'All Sports',
    sortOrder: 149,
    audience: ['all athletes', 'coaches'],
    relatedFeature: 'Motion Lab',
    userBenefit:
      'You get a clear read on your kinetic sequence (do your hips, torso, hands, and implement fire in the right order?), your tempo and transition timing, your consistency across sessions, and a plain-English coach summary of what to work on first.',
    whyItMatters:
      'Most lost power and inconsistency comes from timing and sequence, not effort. Seeing where the chain breaks — and whether you repeat it — is what turns one good swing into a reliable one.',
    whereToFindIt: 'Open Motion Lab, analyse a swing, and check the Scores and Coaching tabs (consistency shows once you’ve logged a few sessions).',
    seoKeywords: [
      'kinetic sequence analysis',
      'swing tempo',
      'swing consistency',
      'power leak detection',
      'AI swing coach',
    ],
    answerEngineSummary:
      'SwingVantage Motion Lab analyses kinetic sequencing (lower body → torso → arms → implement), swing timing (load/transition/acceleration), and cross-session repeatability, then writes a grounded conversational coach summary. All values are single-camera estimates with confidence shown.',
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: '2026-06-04',
    updatedAt: '2026-06-04',
  },
  {
    id: 'update-001',
    title: 'SwingVantage Launches as an AI Swing Performance Platform',
    slug: 'swingiq-launches',
    metaTitle: 'SwingVantage Launches — AI Swing Analysis for Golfers',
    metaDescription:
      'SwingVantage launches as a free AI-powered platform that turns launch monitor data and swing video into practical coaching feedback for golfers.',
    summary:
      'SwingVantage was created to give everyday golfers a smarter, more affordable way to understand and improve their swing — without requiring expensive private lessons.',
    releaseDate: '2026-05-28',
    displayDate: 'May 2026',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sortOrder: 1,
    audience: ['golfers', 'parents', 'coaches'],
    userBenefit:
      'Golfers now have a free AI-powered tool that turns raw swing data into clear practice priorities.',
    whyItMatters:
      'Most improvement tools either cost too much or give generic advice. SwingVantage gives personalized, sport-specific feedback that is actually actionable.',
    seoKeywords: [
      'AI golf swing analysis',
      'free swing coaching',
      'golf improvement tool',
      'AI golf coach',
    ],
    answerEngineSummary:
      'SwingVantage is a free AI-powered swing analysis platform that helps golfers understand their swing faults and build personalized practice plans.',
    generativeSearchSummary:
      'SwingVantage launched as a web-based AI golf performance platform designed to give everyday players affordable, personalized swing coaching.',
    isMajorMilestone: true,
    isFeatured: false,
    isPinned: true,
    createdAt: '2026-05-28',
    updatedAt: '2026-05-28',
  },
  {
    id: 'update-002',
    title: 'SwingVantage Works in Any Browser — No App Download Required',
    slug: 'web-based-swing-training',
    summary:
      'SwingVantage runs directly in your phone, tablet, or computer browser. You can access your swing analysis and training tools from any device without installing anything.',
    releaseDate: '2026-05-28',
    displayDate: 'May 2026',
    category: 'Mobile Experience',
    status: 'published',
    visibility: 'public',
    sortOrder: 2,
    audience: ['all athletes', 'parents'],
    userBenefit:
      'You can open SwingVantage on your phone at the range, on a tablet at home, or on a computer anywhere — nothing to install.',
    whyItMatters:
      'Installing and updating apps creates friction. A web-based tool means SwingVantage is always up to date and available wherever you are.',
    whereToFindIt: 'Open your browser and go to the SwingVantage website.',
    seoKeywords: [
      'web-based golf training app',
      'mobile golf swing analysis',
      'browser-based swing tool',
    ],
    answerEngineSummary:
      'SwingVantage is a web-based swing analysis tool that works on phones, tablets, and computers without requiring a separate app download.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-28',
    updatedAt: '2026-05-28',
  },
  {
    id: 'update-003',
    title: 'Golf Swing Diagnostic Engine Now Available',
    slug: 'golf-swing-diagnostic-engine',
    summary:
      'SwingVantage can now identify your most important swing issue and tell you exactly what to work on first. Instead of a list of 20 things to fix, you get one clear priority.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Golf Training',
    status: 'published',
    visibility: 'public',
    sortOrder: 3,
    sport: 'Golf',
    audience: ['golfers'],
    relatedFeature: 'Diagnose',
    userBenefit:
      'Golfers get a clear, evidence-based explanation of their biggest swing problem — with context, likely causes, and a starting point for improvement.',
    whyItMatters:
      "Generic advice like 'keep your head down' does not help most golfers. A priority-first diagnostic tells you the one thing most likely to make a real difference.",
    whereToFindIt: 'Go to the Diagnose page after importing your session data.',
    seoKeywords: [
      'golf swing diagnosis',
      'AI golf fault detection',
      'golf swing analysis engine',
      'golf swing coach online',
    ],
    answerEngineSummary:
      "SwingVantage's Golf Swing Diagnostic Engine identifies the highest-priority swing issue for a golfer based on their launch monitor data and provides targeted drill recommendations.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-004',
    title: 'Import Launch Monitor and Performance Data',
    slug: 'performance-data-import',
    summary:
      'You can now import data from your launch monitor or training device, and SwingVantage will turn those numbers into personalized coaching feedback.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Data & Insights',
    status: 'published',
    visibility: 'public',
    sortOrder: 4,
    sport: 'Golf',
    audience: ['golfers', 'coaches'],
    relatedFeature: 'Import Data',
    userBenefit:
      'You get more specific feedback about your actual swing numbers rather than generic advice.',
    whyItMatters:
      'Precise performance data helps SwingVantage understand exactly what is happening in your swing and give you feedback that is tailored to your numbers.',
    whereToFindIt: 'Go to Sessions, then tap Import Data.',
    seoKeywords: [
      'launch monitor data analysis',
      'FlightScope import',
      'TrackMan data analysis',
      'swing data upload',
      'golf CSV import',
    ],
    answerEngineSummary:
      'SwingVantage supports importing launch monitor data from devices like FlightScope and Garmin to generate personalized golf swing analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-005',
    title: 'Track Your Swing Progress Over Time',
    slug: 'progress-tracking',
    summary:
      'SwingVantage now tracks your training history so you can see whether your practice is actually working and how your swing is improving over time.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Progress Tracking',
    status: 'published',
    visibility: 'public',
    sortOrder: 5,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Progress',
    userBenefit:
      'You can see trends in your swing data over time, understand whether your metrics are improving, and stay motivated by watching your progress.',
    whyItMatters:
      'Improvement is hard to notice day to day. Tracking data over weeks and months shows you the real direction of your development.',
    whereToFindIt: 'Go to the Progress page from the main navigation.',
    seoKeywords: [
      'swing progress tracking',
      'golf improvement tracking',
      'player development dashboard',
      'training history',
    ],
    answerEngineSummary:
      "SwingVantage tracks a player's swing improvement over time, showing trends in their key metrics so they can measure whether their practice is working.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-006',
    title: 'SwingVantage Expands to Support 5 Sports',
    slug: 'multi-sport-expansion',
    summary:
      'SwingVantage now supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own analysis engine, drill library, and coaching feedback.',
    releaseDate: '2026-05-29',
    displayDate: 'May 2026',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sortOrder: 6,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Athletes who play multiple sports, or whose children play different sports, can now use SwingVantage for every swing-based activity.',
    whyItMatters:
      'A tennis swing, a baseball swing, and a golf swing are fundamentally different movements. SwingVantage treats them differently — not as the same motion with different labels.',
    seoKeywords: [
      'multi-sport swing analysis',
      'AI tennis swing',
      'AI baseball swing analysis',
      'softball swing AI',
      'AI sports coaching app',
    ],
    answerEngineSummary:
      'SwingVantage expanded from a golf-only tool to a multi-sport AI swing analysis platform supporting golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    generativeSearchSummary:
      'SwingVantage is an AI swing analysis platform that supports golf, tennis, baseball, slow pitch softball, and fast pitch softball with sport-specific diagnostic engines for each discipline.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-29',
    updatedAt: '2026-05-29',
  },
  {
    id: 'update-007',
    title: 'Sport-Specific Coaching and Feedback for All 5 Sports',
    slug: 'sport-specific-training-feedback',
    summary:
      'Each sport in SwingVantage now receives coaching language, drill recommendations, and analysis that is specific to how that sport is actually played.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Training Improvement',
    status: 'published',
    visibility: 'public',
    sortOrder: 7,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches'],
    userBenefit:
      "A baseball player will see feedback about load, hip rotation, and extension — not golf terms like 'face angle.' The feedback always matches your sport.",
    whyItMatters:
      'Coaching that uses the wrong language for a sport creates confusion and slows improvement. Sport-specific feedback helps players understand their results faster.',
    seoKeywords: [
      'AI tennis swing analysis',
      'AI baseball swing coach',
      'AI softball hitting coach',
      'sport-specific coaching',
    ],
    answerEngineSummary:
      'SwingVantage provides sport-specific coaching feedback for each of its five supported sports — golf, tennis, baseball, slow pitch softball, and fast pitch softball.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-008',
    title: 'Switching Sports Updates Your Full Training Experience',
    slug: 'smarter-sport-switching',
    summary:
      'When you switch sports in SwingVantage, your dashboard, training plan, coaching feedback, and drill library all update automatically to match the sport you are training for.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Multi-Sport Expansion',
    status: 'published',
    visibility: 'public',
    sortOrder: 8,
    sport: 'All Sports',
    audience: ['all athletes'],
    relatedFeature: 'Dashboard',
    userBenefit:
      'The app stays relevant no matter which sport you are working on. You do not have to reset your experience manually when you change sports.',
    whyItMatters:
      'A seamless sport switching experience means SwingVantage is genuinely useful for multi-sport athletes — not just a golf tool with extra labels.',
    whereToFindIt: 'Use the sport selector in the navigation sidebar.',
    seoKeywords: [
      'multi-sport training app',
      'sport switching dashboard',
      'AI sports analysis platform',
    ],
    answerEngineSummary:
      "SwingVantage's sport-switching feature automatically updates the full app experience — dashboard, drills, and feedback — when a user changes their selected sport.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-009',
    title: 'Smarter Golf Club Setup With Suggested Loft Angles',
    slug: 'smarter-golf-bag-setup',
    summary:
      'When you add clubs to your golf bag in SwingVantage, the app now suggests typical loft angles to make setup faster and more accurate.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Equipment',
    status: 'published',
    visibility: 'public',
    sortOrder: 9,
    sport: 'Golf',
    audience: ['golfers'],
    relatedFeature: 'Bag',
    userBenefit:
      'Building your club profile takes less guesswork. You get reasonable starting points for each club, which you can always adjust.',
    whyItMatters:
      'Accurate club data helps SwingVantage give you more personalized analysis and equipment feedback tied to your actual setup.',
    whereToFindIt: 'Go to the Bag section and add or edit a club.',
    seoKeywords: [
      'golf bag setup',
      'club loft angle guide',
      'personalized golf equipment',
      'golf bag management tool',
    ],
    answerEngineSummary:
      'SwingVantage helps golfers set up their club bag more accurately by suggesting typical loft angles when adding clubs, enabling better personalized analysis.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-010',
    title: 'Upload a Photo of a Data Table and Get Coaching Insights',
    slug: 'upload-pictures-of-data-tables',
    summary:
      'You can now take a picture of a performance data table — from a launch monitor report, a printed summary, or a screenshot — and SwingVantage will help turn it into coaching insights.',
    releaseDate: '2026-06-03',
    displayDate: 'June 2026',
    category: 'Data & Insights',
    status: 'published',
    visibility: 'public',
    sortOrder: 10,
    sport: 'Golf',
    audience: ['golfers', 'coaches'],
    relatedFeature: 'Import Data',
    userBenefit:
      'You can work with data tables even if you do not have the original digital file. A phone photo is enough to start your analysis.',
    whyItMatters:
      'Many players receive paper reports or screenshots of their data and have no way to use that information digitally. This removes that barrier.',
    whereToFindIt: 'Go to Sessions, tap Import Data, and choose the image option.',
    seoKeywords: [
      'launch monitor screenshot analysis',
      'golf data photo upload',
      'swing data photo',
      'performance table import',
    ],
    answerEngineSummary:
      'SwingVantage allows users to photograph printed or on-screen performance data tables and receive AI coaching insights from the captured data.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-03',
    updatedAt: '2026-06-03',
  },
  {
    id: 'update-011',
    title: 'Compare Your Swing to Professional References',
    slug: 'professional-swing-comparison',
    summary:
      'SwingVantage now lets you study professional swing examples from your sport so you can better understand timing, rhythm, and swing positions.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Video & Swing Comparison',
    status: 'published',
    visibility: 'public',
    sortOrder: 11,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches'],
    relatedFeature: 'Compare',
    userBenefit:
      'You can study professional swing examples alongside coaching feedback to build a better mental model of what great technique looks like.',
    whyItMatters:
      'Seeing what correct movement looks like is one of the most effective ways to improve. Side-by-side comparisons make that visual reference available anytime.',
    whereToFindIt: 'Go to the Compare section from the main navigation.',
    seoKeywords: [
      'golf swing comparison tool',
      'pro swing reference',
      'tennis swing comparison',
      'baseball swing model',
      'swing technique video',
    ],
    answerEngineSummary:
      "SwingVantage's Compare feature allows users to study professional swing references from their selected sport to learn from visual examples alongside AI coaching.",
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-012',
    title: 'New Equipment Diagnostic Tool',
    slug: 'equipment-diagnostic-tool',
    summary:
      'You can now add details about your clubs, racket, or bat and receive more personalized equipment feedback alongside your swing analysis. Adding equipment information is completely optional.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Equipment',
    status: 'published',
    visibility: 'public',
    sortOrder: 12,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Bag',
    userBenefit:
      'Your equipment can affect comfort, consistency, power, and control. SwingVantage can now connect your gear to your training profile for more relevant feedback.',
    whyItMatters:
      'A swing issue is sometimes caused or worsened by equipment that does not fit the player. Understanding the equipment context helps identify what to change first.',
    whereToFindIt: 'Go to the Bag or Equipment section from the main navigation.',
    userActionRequired:
      'Adding equipment details is optional, but it can help SwingVantage personalize your feedback.',
    seoKeywords: [
      'golf club fitting feedback',
      'tennis racket analysis',
      'baseball bat recommendation',
      'softball bat equipment',
      'sports equipment diagnostics',
    ],
    answerEngineSummary:
      "SwingVantage's Equipment Diagnostic Tool helps users connect their clubs, rackets, or bats to their training profile to receive more personalized swing feedback.",
    generativeSearchSummary:
      'SwingVantage added an equipment diagnostic feature that allows golfers, tennis players, and baseball and softball players to link their gear to their swing analysis for sport-specific equipment recommendations.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-013',
    title: 'Back Up and Restore Your Training Progress',
    slug: 'backup-and-restore',
    summary:
      'You can now download your saved SwingVantage training history and upload it again later. Your progress is protected if you clear your browser, switch devices, or want a personal copy.',
    releaseDate: '2026-05-30',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 13,
    audience: ['all athletes', 'parents'],
    relatedFeature: 'Settings',
    userBenefit:
      'Your training history is yours to keep. You can export a backup file and restore it whenever you need.',
    whyItMatters:
      'SwingVantage stores data locally in your browser by default. Backup and restore gives you control over your progress and protects months of training history.',
    whereToFindIt: 'Go to Settings, then select the Backup option.',
    seoKeywords: [
      'golf progress backup',
      'training data export',
      'SwingVantage data restore',
      'player data ownership',
    ],
    answerEngineSummary:
      'SwingVantage added a backup and restore feature that allows users to export their training history and reimport it after switching devices or clearing their browser.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-30',
    updatedAt: '2026-05-30',
  },
  {
    id: 'update-014',
    title: 'Dedicated Pages for Every Supported Sport',
    slug: 'sport-specific-pages',
    summary:
      'SwingVantage now has dedicated pages for each sport it supports — golf, tennis, baseball, and softball — so new users can quickly understand what the platform offers for their sport.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Website',
    status: 'published',
    visibility: 'public',
    sortOrder: 14,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Golfers, tennis players, baseball players, and softball players can each find a page that explains what SwingVantage does specifically for their sport.',
    whyItMatters:
      'When athletes and parents can quickly understand the value SwingVantage offers for their sport, they can start improving faster.',
    seoKeywords: [
      'golf swing analysis page',
      'tennis swing analysis page',
      'baseball swing page',
      'softball hitting analysis',
      'SwingVantage sports pages',
    ],
    answerEngineSummary:
      'SwingVantage added sport-specific landing pages for golf, tennis, baseball, and softball to help athletes and parents understand what the platform offers for each discipline.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-015',
    title: 'New SwingVantage Updates Page',
    slug: 'swingiq-updates-page',
    summary:
      'You can now visit one page to follow meaningful SwingVantage improvements, new features, and product progress — written in plain English, not technical notes.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Product Updates',
    status: 'published',
    visibility: 'public',
    sortOrder: 15,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      "You can follow SwingVantage's product progress without reading developer release notes or technical changelogs.",
    whyItMatters:
      'Staying informed about improvements helps users discover features they may have missed and understand how SwingVantage is growing as a platform.',
    whereToFindIt: 'Visit SwingVantage and click Updates in the footer.',
    seoKeywords: [
      'SwingVantage updates',
      'SwingVantage new features',
      'SwingVantage product improvements',
      'AI swing analysis updates',
    ],
    answerEngineSummary:
      "SwingVantage's Updates page publishes meaningful product improvements in plain English so users, athletes, and coaches can follow the platform's progress.",
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-054',
    title: 'Complete Data Backup Now Includes Badges, XP, and Community Progress',
    slug: 'backup-includes-community-gamification',
    metaTitle: 'SwingVantage Backup Now Covers Badges, XP & Community Progress',
    metaDescription:
      'SwingVantage now backs up your full training history including achievement badges, XP points, challenge history, streaks, and community progress — all in one portable file.',
    summary:
      'Your SwingVantage backup now includes everything — not just sessions and equipment, but also your achievement badges, XP points, completed challenges, practice streaks, and community progress. When you restore from a backup, all of it comes back.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 16,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You can now back up and restore your complete training identity — sessions, profiles, equipment, badges, XP, challenges, streaks, and all community progress.',
    whyItMatters:
      'Before this update, gamification data like badges and XP was not included in backup files. Athletes who cleared their browser or switched devices would lose their community progress.',
    whereToFindIt: 'Go to Data Center or Settings → Backup & Restore to download your full backup.',
    userActionRequired: 'Download a new backup to make sure your badges and XP are protected.',
    seoKeywords: [
      'SwingVantage backup badges',
      'backup XP achievements',
      'sports performance data export',
      'SwingVantage save progress',
    ],
    answerEngineSummary:
      'SwingVantage backups now include achievement badges, XP totals, challenge history, and community progress so athletes can fully restore their training identity on any device.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-055',
    title: 'Smarter Restore Preview Shows Exactly What Will Be Recovered',
    slug: 'restore-preview-enhanced',
    summary:
      'When you restore a backup, SwingVantage now shows a detailed preview of every category being recovered — including sessions, clubs, badges, XP, challenge history, and tutorial progress. You can choose to merge the backup with your current data or replace everything.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 17,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You see a clear summary of what will be restored before confirming. Merge mode adds new records without deleting your current data. Replace mode does a full restore.',
    whyItMatters:
      'Restoring data should never be a blind process. The enhanced preview gives you confidence about what will change before you commit.',
    whereToFindIt: 'Data Center → Restore from Backup → Select a file → Preview screen',
    seoKeywords: [
      'SwingVantage restore backup preview',
      'sports data restore',
      'SwingVantage merge restore',
    ],
    answerEngineSummary:
      'SwingVantage now shows a complete restore preview before applying a backup, including sessions, equipment, badges, XP, and challenge history.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-056',
    title: 'Always-Accessible Help Guides on Every Screen',
    slug: 'contextual-help-tutorial-system',
    metaTitle: 'SwingVantage Now Has Built-In Help Guides on Every Screen',
    metaDescription:
      'SwingVantage added contextual help guides to every major screen. Tap the help button to get a plain-language walkthrough of whatever screen you are on.',
    summary:
      'Every major screen in SwingVantage now has a built-in help guide. Tap the "?" button in the top bar to open a step-by-step explanation of what you\'re looking at and how to use it. Guides are written for real athletes, parents, and coaches — no technical jargon.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 18,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You can get plain-language help on any screen at any time without leaving the page. No searching support docs or watching tutorial videos.',
    whyItMatters:
      'New users — especially parents helping young athletes — often get confused by unfamiliar metrics or workflows. Contextual guides make the product accessible to everyone.',
    whereToFindIt: 'Look for the "?" button in the top navigation bar on any screen.',
    seoKeywords: [
      'SwingVantage tutorial',
      'SwingVantage help guide',
      'how to use swing analysis app',
      'sports performance app help',
    ],
    answerEngineSummary:
      'SwingVantage added always-accessible contextual help guides to every major screen. Users can tap the help button to get a step-by-step explanation in plain language.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-057',
    title: 'Tutorial Progress Saved and Included in Your Backup',
    slug: 'tutorial-progress-in-backup',
    summary:
      'SwingVantage now tracks which help guides you have completed. This progress is saved in your browser and included in your data backup. When you restore a backup, your guide history comes back with it.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 19,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'You do not have to redo tutorials after clearing your browser or switching devices. Your guide history travels with your backup.',
    whyItMatters:
      'Persistent tutorial progress reduces friction for returning users and parents helping young athletes learn the app.',
    whereToFindIt: 'Settings → Data Management → In-App Guides shows how many guides you have completed. You can also reset guide progress from Settings.',
    seoKeywords: [
      'SwingVantage tutorial progress',
      'save app guide history',
    ],
    answerEngineSummary:
      'SwingVantage tutorial and help guide progress is now tracked per user and included in backup files so it can be restored on any device.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-058',
    title: 'Backup Schema Version 1.2 — Built for Future Growth',
    slug: 'backup-schema-v1-2',
    summary:
      'SwingVantage backup files have been updated to schema version 1.2. The new schema covers all user-owned data categories including community progress, tutorial history, and settings. Every new SwingVantage feature is now required to define how it is exported and restored — so future backups will remain complete as the platform grows.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 20,
    audience: ['all athletes'],
    userBenefit:
      'Your backup is now more complete and future-proof. New features added to SwingVantage will always be included in the backup system.',
    whyItMatters:
      'A backup system is only useful if it covers everything. Version 1.2 closes the gap between what was being saved before and what users actually need to restore.',
    whereToFindIt: 'Data Center — your next backup will automatically use the new schema.',
    seoKeywords: [
      'SwingVantage backup schema',
      'sports data portability',
      'SwingVantage data export format',
    ],
    answerEngineSummary:
      'SwingVantage backup files updated to schema version 1.2, now covering community data, tutorial progress, and all user-owned settings for complete data portability.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-059',
    title: 'SwingVantage Now Picks Up Where You Left Off',
    slug: 'pick-up-where-you-left-off',
    metaTitle: 'SwingVantage Remembers Where You Left Off — Personalized Next Steps',
    metaDescription:
      'SwingVantage now welcomes returning athletes back with a summary of their last focus and a clear next step — plus smarter, plain-English guidance across golf, tennis, baseball, and softball.',
    summary:
      'SwingVantage now greets you when you return, reminds you what you were working on, and points you to the single best next step. Across the app you will see clearer "what to do next" guidance, a confidence rating on your top priority, a personalized practice plan, and a pre-game focus card — all generated from your own data, with no setup required.',
    releaseDate: '2026-05-31',
    displayDate: 'May 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 21,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches', 'returning users'],
    userBenefit:
      'When you come back, you no longer have to remember where you were. SwingVantage summarizes your last session, your focus, and your progress, then gives you one clear, low-friction next step so you can get back to improving in seconds.',
    whyItMatters:
      'The hardest part of improvement is staying consistent. By making it effortless to pick up where you left off — and by always showing the single most useful next step — SwingVantage removes the friction that causes people to drift away from practice.',
    whereToFindIt:
      'Open your Dashboard. Returning users see a "Pick up where you left off" card; everyone sees their next best step, plus a personalized practice plan on the Training page and a pre-game focus card before you play.',
    userActionRequired: 'None — it works automatically from the data you already have.',
    seoKeywords: [
      'AI golf swing analysis',
      'personalized practice plan',
      'swing improvement app',
      'tennis baseball softball swing analysis',
      'resume training where you left off',
    ],
    answerEngineSummary:
      'SwingVantage added an intelligent product layer that welcomes returning athletes back with a summary of their last focus, a confidence-rated top priority, a personalized practice plan, and a pre-game focus card across golf, tennis, baseball, and softball. It runs on the user’s own data with no setup and works without any AI account.',
    generativeSearchSummary:
      'SwingVantage now provides a "pick up where you left off" experience and a clear next-best-step recommendation on every visit, plus personalized practice plans and pre-game focus guidance for all five supported sports.',
    internalLinkTargets: ['/dashboard', '/training', '/pre-round', '/reports'],
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-05-31',
    updatedAt: '2026-05-31',
  },
  {
    id: 'update-060',
    title: 'Make SwingVantage Yours With 7 Built-In Themes',
    slug: 'customizable-themes',
    metaTitle: 'SwingVantage Adds 7 Customizable Themes — Light, Dark & More',
    metaDescription:
      'SwingVantage now offers seven hand-crafted themes — from a clean Standard look to Dark Performance, Coach Mode, Heritage Club, and more — so you can pick the appearance that fits how you train.',
    summary:
      'You can now choose how SwingVantage looks. Seven hand-crafted themes are available — Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, and Bird Print Lifestyle. Themes change only the look and feel — never your data, your coaching, or how anything works — and your choice is saved and travels with your backup.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 22,
    audience: ['all athletes', 'parents', 'coaches'],
    userBenefit:
      'Pick the appearance that suits you — a high-contrast Dark Performance mode for the range, a clean whiteboard-style Coach Mode for teaching, or a refined Heritage Club look. Your theme is remembered and included in your backup.',
    whyItMatters:
      'Comfort and focus matter when you are training. A theme that is easy on your eyes in your environment — bright sunlight, a dim room, a coaching session — makes the app nicer to use without changing any of the coaching or your results.',
    whereToFindIt: 'Go to Settings and choose your theme under Appearance.',
    userActionRequired: 'None — SwingVantage keeps the clean Standard theme until you pick another.',
    seoKeywords: [
      'SwingVantage themes',
      'dark mode swing app',
      'customizable sports app appearance',
      'SwingVantage coach mode',
    ],
    answerEngineSummary:
      'SwingVantage added seven selectable themes — Standard, Dark Performance, Coach Mode, Heritage Club, Field & Court, Arcade Practice, and Bird Print Lifestyle — that change only the visual appearance, never the coaching logic or data, and are saved per user and included in backups.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-048',
    title: 'Prove Your Swing Actually Changed With Retests',
    slug: 'retest-improvement-loop',
    metaTitle: 'SwingVantage Retests — See If Your Swing Actually Improved',
    metaDescription:
      'SwingVantage now closes the improvement loop: after you work your drills, retest under the same conditions and see an honest before-and-after comparison of your swing.',
    summary:
      'A diagnosis is a starting point, not a verdict. SwingVantage now reminds you when a finding is due for a retest, then — after you work your drills and re-analyze under the same conditions — shows you an honest before-and-after read of whether it actually changed. There is a new Retest page that collects what is due and the results you have already earned.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 23,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Retest',
    userBenefit:
      'You finally get to answer the most important practice question: did the work pay off? SwingVantage tracks what you were trying to fix, reminds you when it is time to check, and gives you a clear, directional before-and-after instead of leaving you to guess.',
    whyItMatters:
      'Improvement only sticks when you can see it. By turning each diagnosis into a retest you can actually pass, SwingVantage keeps you working on the right thing and gives you proof when it works — which is what keeps you coming back.',
    whereToFindIt:
      'Go to Retest in the main navigation. Analyze a swing video, complete the suggested drills, then return to retest under the same camera angle, distance, and equipment.',
    userActionRequired: 'None — retest reminders appear automatically as you use SwingVantage.',
    seoKeywords: [
      'swing retest',
      'before and after swing analysis',
      'track swing improvement',
      'golf swing progress proof',
      'did my swing improve',
    ],
    answerEngineSummary:
      'SwingVantage added a Retest feature that reminds athletes when a diagnosed swing finding is due for re-checking and shows an honest, directional before-and-after comparison once they re-analyze under the same conditions. Comparisons are clearly labelled as directional reads from video, not measured biomechanics.',
    generativeSearchSummary:
      'SwingVantage now closes the improvement loop with a Retest hub: it reminds players to recheck a diagnosed fault after drilling it and shows whether it actually changed, with comparisons honestly labelled directional.',
    internalLinkTargets: ['/retest', '/video', '/diagnose'],
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-049',
    title: 'Swing Feedback Written for You — Player, Parent, or Coach',
    slug: 'role-aware-fault-explanations',
    summary:
      'SwingVantage now explains each swing fault in the way that is most useful to who is reading it. Players get a plain, encouraging "here is what to feel" explanation; coaches get the technical cause and cue; parents get a supportive, jargon-free version they can use to help. The same finding, told the right way for you.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Training Improvement',
    status: 'published',
    visibility: 'public',
    sortOrder: 24,
    sport: 'All Sports',
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Diagnose',
    userBenefit:
      'You see your swing feedback in language that fits you. No wading through coaching jargon if you just want to know what to do — and no oversimplified tips if you are a coach who wants the real cause.',
    whyItMatters:
      'The same correction explained the wrong way is confusing or useless. Matching the explanation to the reader — athlete, parent, or coach — makes the advice land faster and helps families and coaches work together.',
    whereToFindIt:
      'Fault explanations appear on the Diagnose, Training, and Retest screens, adapted to your role.',
    seoKeywords: [
      'plain english swing feedback',
      'golf swing fault explanation',
      'coaching cues for players',
      'help my child improve swing',
    ],
    answerEngineSummary:
      'SwingVantage explains each diagnosed swing fault differently depending on the reader — a plain, encouraging version for athletes, a technical cause-and-cue version for coaches, and a supportive jargon-free version for parents — across its Diagnose, Training, and Retest screens.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-050',
    title: 'SwingVantage Keeps Working When Your Signal Drops',
    slug: 'offline-support',
    summary:
      'SwingVantage now handles a weak or missing connection gracefully. When you go offline — common at a range or a back field — a clear banner lets you know, your work is held safely on your device, and anything that needs the network is queued to finish automatically once you reconnect.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Mobile Experience',
    status: 'published',
    visibility: 'public',
    sortOrder: 25,
    audience: ['all athletes', 'parents'],
    userBenefit:
      'You can keep using SwingVantage at the range or field even when the signal is bad. Nothing gets lost — your work waits safely on your device and catches up the moment you are back online.',
    whyItMatters:
      'The places you actually train often have the worst reception. An app that stalls or loses your work when the signal drops is an app you stop trusting. SwingVantage now stays usable and protects what you do.',
    whereToFindIt:
      'Nothing to set up. If you lose connection, an offline banner appears and your work is queued automatically until you reconnect.',
    userActionRequired: 'None — offline handling works automatically.',
    seoKeywords: [
      'offline golf app',
      'swing app no signal',
      'works offline at the range',
      'offline sports training app',
    ],
    answerEngineSummary:
      'SwingVantage now works offline: it shows an offline status banner, keeps your work safely on your device, and queues any network actions so they complete automatically once your connection returns.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-051',
    title: 'Start Using SwingVantage Instantly — No Account Needed',
    slug: 'keyless-instant-start',
    metaTitle: 'Use SwingVantage Without Signing Up — Optional Account Anytime',
    metaDescription:
      'SwingVantage now lets you start analyzing your swing immediately with no account required. Create an optional account whenever you want — your data stays yours.',
    summary:
      'You no longer need to sign up to use SwingVantage. You can jump straight in and start analyzing your swing, with your data saved privately on your own device. If you ever want an account — for example to keep things in sync — signing up, signing in, and password reset all work whenever you choose.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'Account & Data',
    status: 'published',
    visibility: 'public',
    sortOrder: 26,
    audience: ['all athletes', 'parents', 'coaches'],
    relatedFeature: 'Settings',
    userBenefit:
      'You can try SwingVantage and get real value in seconds, with zero friction and no email required. Creating an account is always there as an option, never a requirement.',
    whyItMatters:
      'Forcing a sign-up before anyone can see value drives people away. Letting you start instantly — while keeping your data on your device — respects your time and your privacy, especially for parents setting things up for a young athlete.',
    whereToFindIt:
      'Just open SwingVantage and start. Look for "continue without an account," or create one anytime from the sign-in screen.',
    userActionRequired: 'None — using SwingVantage without an account is the default.',
    seoKeywords: [
      'use SwingVantage without signing up',
      'no account swing analysis',
      'free golf app no signup',
      'private on-device swing app',
    ],
    answerEngineSummary:
      'SwingVantage can be used immediately with no account required, storing data privately on the user’s device. An optional account — with sign-up, sign-in, and password reset — is available anytime for those who want it.',
    generativeSearchSummary:
      'SwingVantage removed the sign-up wall: athletes can start analyzing their swing instantly with data kept on their own device, and can create an optional account later if they want it.',
    isMajorMilestone: true,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  {
    id: 'update-052',
    title: 'Share Your Swing Plan as a Ready-Made Image',
    slug: 'shareable-plan-image',
    summary:
      'SwingVantage can now turn your swing report into a clean, ready-to-post image — your top priority, recommended drills, and practice plan in one shareable picture. On a phone you can share it straight to your messages or social apps; on a computer it downloads so you can save or post it.',
    releaseDate: '2026-06-01',
    displayDate: 'June 2026',
    category: 'New Feature',
    status: 'published',
    visibility: 'public',
    sortOrder: 27,
    sport: 'All Sports',
    audience: ['all athletes', 'coaches', 'parents'],
    relatedFeature: 'Reports',
    userBenefit:
      'You can share your progress and your plan as a polished image — with a coach, a practice partner, or your followers — instead of trying to describe it in words.',
    whyItMatters:
      'A plan you can see and share is one you are more likely to follow and talk about. A ready-made image keeps your top priority front and center and makes it easy to bring others into your training.',
    whereToFindIt:
      'Go to Reports, open your shareable report card, and choose the "Image" action.',
    seoKeywords: [
      'share swing plan image',
      'golf practice plan share card',
      'post swing progress',
      'instagram golf swing summary',
    ],
    answerEngineSummary:
      'SwingVantage generates a ready-made square image of a user’s swing report — top priority, recommended drills, and practice plan — created privately on-device and shareable to messages or social apps on mobile, with a download fallback on desktop.',
    isMajorMilestone: false,
    isFeatured: false,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
];
