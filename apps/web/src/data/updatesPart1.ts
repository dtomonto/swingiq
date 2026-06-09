// ============================================================
// SwingVantage — Product Updates registry (shard 1 of 3)
// ------------------------------------------------------------
// Size-shard of the UPDATES seed array, split out of updates.ts so no single
// data file exceeds ~600 lines (fewer merge conflicts — roadmap #20). Spread
// back into UPDATES in updates.ts IN ORDER, so behavior is unchanged. New
// entries may go in any shard (newest-first ordering is by releaseDate at read
// time, not array position).
// ============================================================

import type { Update } from './updates';

export const UPDATES_PART_1: Update[] = [
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
];
