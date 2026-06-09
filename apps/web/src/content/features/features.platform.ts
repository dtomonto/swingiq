// ============================================================
// SwingVantage — Feature Registry: Recruiting · Health · Learn · Data Safety
// ============================================================

import type { Feature } from './types';

export const PLATFORM_FEATURES: Feature[] = [
  // ── Recruiting ───────────────────────────────────────────
  {
    slug: 'verified-recruiting-profile',
    name: 'Verified Recruiting Profile',
    group: 'Recruiting',
    sports: 'All 7 sports',
    summary:
      'Build a recruiting profile coaches actually trust: every number and claim is labeled by source — verified vs. self-reported — and you control exactly what each coach can see. Share it as a public coach-view page.',
    note: 'Honest-first by design: the AI describes the evidence instead of projecting a ceiling. A profile-strength meter shows what to add next.',
    overview: [
      'The Verified Recruiting Profile is built around the one thing recruiters care about most: trust. Every number and claim is labelled by source — verified versus self-reported — so a coach can see at a glance what’s backed by data and what’s a player’s own report. You control exactly what each coach can see and share it as a clean, public coach-view page.',
      'It’s honest-first by design. Rather than projecting a ceiling or inflating potential, the AI describes the evidence, which is far more credible to a coach who has seen a thousand padded profiles. A profile-strength meter shows what to add next, turning "make my profile better" into a concrete checklist.',
    ],
    bestFor: [
      'Athletes pursuing college or competitive recruiting',
      'Players who want a credible, source-labelled profile coaches will trust',
    ],
    guide: [
      {
        title: 'Build out your profile',
        body: 'Add your metrics, video, and background. Verified data (from your sessions) is labelled distinctly from self-reported entries.',
      },
      {
        title: 'Raise your profile-strength score',
        body: 'Follow the strength meter’s prompts — it tells you exactly what to add next for a more complete, credible profile.',
      },
      {
        title: 'Control coach visibility',
        body: 'Set what each coach can see before you share. You decide exactly which sections are visible per share.',
      },
      {
        title: 'Share the coach-view link',
        body: 'Send the public coach-view page to recruiters — a clean, honest snapshot they can evaluate in minutes.',
      },
    ],
    limitations: [
      'Honest-first: it describes evidence rather than projecting a ceiling — by design, not omission.',
    ],
    faqs: [
      {
        question: 'What does "verified vs self-reported" mean?',
        answer:
          'Verified numbers come from your actual SwingVantage sessions and data; self-reported ones are values you entered yourself. Both are shown, clearly labelled, so coaches know exactly what they’re looking at.',
      },
    ],
    relatedSlugs: ['film-library-highlight-reels', 'coach-outreach-analytics', 'athletic-journey'],
    relatedLinks: [{ label: 'Recruiting hub', href: '/recruiting' }],
  },
  {
    slug: 'film-library-highlight-reels',
    name: 'Film Library & Highlight Reels',
    group: 'Recruiting',
    sports: 'All 7 sports',
    summary:
      'Organize your game film, then build highlight reels and a downloadable recruiting packet from it. A data dashboard keeps your key metrics in one place for coaches to scan.',
    overview: [
      'The Film Library is where your game footage gets organised and put to work. Store your clips, then assemble highlight reels and a downloadable recruiting packet from them — the materials coaches expect, built without separate editing tools.',
      'Alongside the film, a data dashboard keeps your key metrics in one place so a coach can scan your numbers and your video together. It turns a folder of raw clips into a recruiting-ready presentation.',
    ],
    bestFor: [
      'Athletes assembling highlight reels and recruiting packets',
      'Players who want film and metrics presented together for coaches',
    ],
    guide: [
      {
        title: 'Organise your film',
        body: 'Add and label your clips so the best material is easy to find when you build a reel.',
      },
      {
        title: 'Build a focused highlight reel',
        body: 'Assemble a reel that leads with your strongest, most relevant clips — coaches decide in the first few seconds.',
      },
      {
        title: 'Export the recruiting packet',
        body: 'Generate a downloadable packet pairing your reel with your metrics dashboard for a complete coach-ready submission.',
      },
    ],
    relatedSlugs: ['verified-recruiting-profile', 'coach-outreach-analytics'],
  },
  {
    slug: 'coach-outreach-analytics',
    name: 'Coach Outreach & Analytics',
    group: 'Recruiting',
    sports: 'All 7 sports',
    summary:
      'Manage your outreach to coaches and see analytics on your recruiting profile — what is complete, what coaches can view, and where to focus next.',
    overview: [
      'Coach Outreach & Analytics keeps the recruiting process organised: track your outreach to coaches in one place, and see analytics on your profile — what’s complete, what each coach can view, and where to focus next.',
      'Recruiting is a numbers-and-follow-up game, and this turns it from a scattered set of emails and spreadsheets into a managed pipeline. Knowing what’s incomplete and what coaches can actually see removes the guesswork from a stressful process.',
    ],
    bestFor: [
      'Athletes actively reaching out to multiple programs',
      'Players who want to know what to fix before sending their profile',
    ],
    guide: [
      {
        title: 'Track every outreach',
        body: 'Log your contacts with coaches so nothing falls through the cracks during a long recruiting cycle.',
      },
      {
        title: 'Act on the completeness analytics',
        body: 'Use the "what’s missing" view to finish your profile before sending it to more coaches.',
      },
      {
        title: 'Verify coach visibility',
        body: 'Check exactly what each coach can see so you’re never surprised by what you’ve shared.',
      },
    ],
    relatedSlugs: ['verified-recruiting-profile', 'film-library-highlight-reels'],
  },

  // ── Health & Readiness — BodySync ────────────────────────
  {
    slug: 'readiness-recovery',
    name: 'Readiness & Recovery',
    group: 'Health & Readiness — BodySync',
    sports: 'All 7 sports',
    summary:
      'Log a quick daily wellness check-in — sleep, soreness, energy, mood — and BodySync turns it into a readiness score that scales how hard to train today, with a fatigue-risk heads-up when you are running low.',
    note: 'Adults 18+ only, opt-in and consent-gated. Not medical advice. Everything is yours — export or delete it anytime.',
    overview: [
      'Readiness & Recovery (BodySync) turns a 20-second daily check-in — sleep, soreness, energy, mood — into a readiness score that tells you how hard to train today. When you’re running low, it gives you a fatigue-risk heads-up so you can adjust before you dig a hole.',
      'Training hard on an empty tank produces poor reps and raises injury risk; training smart with the tank in mind compounds. BodySync makes that call objective. It’s adults-only (18+), fully opt-in and consent-gated, explicitly not medical advice, and everything you log is yours to export or delete at any time.',
    ],
    bestFor: [
      'Adult athletes who train often and want to manage load intelligently',
      'Players prone to pushing through fatigue to their own detriment',
    ],
    guide: [
      {
        title: 'Opt in and check in daily',
        body: 'Enable BodySync (18+, consent-gated) and log the quick wellness check-in each morning.',
      },
      {
        title: 'Let readiness scale your session',
        body: 'On a low-readiness day, take the suggested lighter session instead of forcing a hard one.',
      },
      {
        title: 'Heed the fatigue-risk heads-up',
        body: 'When the fatigue warning appears, prioritise recovery — the long game beats one more hard day.',
      },
    ],
    limitations: [
      'Adults 18+ only, opt-in and consent-gated. Not medical advice.',
    ],
    faqs: [
      {
        question: 'Is BodySync medical advice?',
        answer:
          'No. It’s a training-readiness aid built from your own self-reported wellness inputs. It’s not medical advice, it’s adults-only and consent-gated, and your data is yours to export or delete anytime.',
      },
    ],
    relatedSlugs: ['health-aware-coaching', 'pre-round-pre-game-warm-up', 'swingvantage-labs'],
  },
  {
    slug: 'health-aware-coaching',
    name: 'Health-Aware Coaching',
    group: 'Health & Readiness — BodySync',
    sports: 'All 7 sports',
    summary:
      'Your readiness feeds back into your practice plan, so a heavy-fatigue day suggests a lighter, smarter session instead of pushing through.',
    note: 'A connector framework can fold in data you choose to import (e.g. Apple Health). You decide what to share.',
    overview: [
      'Health-Aware Coaching connects your readiness to your practice plan. On a heavy-fatigue day, your routine adapts to a lighter, smarter session rather than blindly prescribing a hard block — so your training respects your body’s actual state.',
      'A connector framework can fold in data you choose to import, such as Apple Health, to enrich the readiness picture. You decide exactly what to share; nothing is imported or used without your say-so. It’s the bridge that makes your readiness score actually change what you do.',
    ],
    bestFor: [
      'Players who want their plan to flex with their recovery',
      'Athletes who track wellness data elsewhere and want it to inform training',
    ],
    guide: [
      {
        title: 'Keep readiness current',
        body: 'Health-aware adjustments depend on your daily check-in — keep BodySync up to date.',
      },
      {
        title: 'Accept the adapted session',
        body: 'When your plan suggests a lighter day, take it; that’s the system working as intended.',
      },
      {
        title: 'Optionally connect a data source',
        body: 'If you want, import data like Apple Health via the connector framework — entirely under your control.',
      },
    ],
    limitations: [
      'Optional data import is consent-based; you choose what (if anything) to share.',
    ],
    relatedSlugs: ['readiness-recovery', 'training-routine-generator'],
  },

  // ── Learn & Reference ────────────────────────────────────
  {
    slug: 'video-library',
    name: 'Video Library',
    group: 'Learn & Reference',
    sports: 'All 7 sports',
    summary:
      'One hub for short walkthroughs of every feature, plus a growing training catalogue — swing path, using a launch monitor, drills, coaching, and film study.',
    overview: [
      'The Video Library is your one-stop hub for learning SwingVantage and the craft behind it. It holds short walkthroughs of every feature alongside a growing training catalogue — swing path, using a launch monitor, drills, coaching concepts, and film study.',
      'Whether you’re learning how a feature works or studying a technique, the library keeps the explanations in one place, so you’re never hunting across the app for "how do I do this?" It grows as the product does.',
    ],
    bestFor: [
      'New users learning what SwingVantage can do',
      'Players who want to deepen their understanding of technique and tools',
    ],
    guide: [
      {
        title: 'Start with the feature walkthroughs',
        body: 'New to a feature? Watch its short walkthrough before diving in.',
      },
      {
        title: 'Explore the training catalogue',
        body: 'Browse topics like swing path or film study to build the knowledge behind the tools.',
      },
    ],
    relatedSlugs: ['tutorial-center', 'pro-reference-comparison'],
    relatedLinks: [{ label: 'Learn hub', href: '/learn' }],
  },
  {
    slug: 'tutorial-center',
    name: 'Tutorial Center',
    group: 'Learn & Reference',
    sports: 'All 7 sports',
    summary:
      'Short, role-specific walkthrough videos organized into tracks for players, parents, and coaches, so each person learns the parts that matter to them. Your progress is saved.',
    overview: [
      'The Tutorial Center organises learning by who you are. Short walkthrough videos are grouped into tracks for players, parents, and coaches — so each person sees the parts that matter to them instead of wading through everything. Your progress is saved as you go.',
      'Role-specific tracks respect the fact that a parent managing a young athlete’s uploads needs different guidance than a coach evaluating film. By tailoring the path, the Tutorial Center gets each person productive faster.',
    ],
    bestFor: [
      'Parents getting set up to support a young athlete',
      'Coaches onboarding to the tools their players use',
    ],
    guide: [
      {
        title: 'Pick your track',
        body: 'Choose the player, parent, or coach track so you only see the walkthroughs relevant to your role.',
      },
      {
        title: 'Work through it in order',
        body: 'Follow the track sequentially; your progress is saved so you can pick up where you left off.',
      },
    ],
    relatedSlugs: ['video-library'],
    relatedLinks: [{ label: 'For parents', href: '/parents' }],
  },

  // ── Data Safety ──────────────────────────────────────────
  {
    slug: 'private-by-default',
    name: 'Private by Default',
    group: 'Data Safety',
    sports: 'All sports',
    summary:
      'Sign in and your data is securely saved to your own private account and synced across your devices. Prefer no account? Everything works on your device too. Either way, your data is yours.',
    overview: [
      'SwingVantage is private by default. Without an account, everything you do stays on your own device — no sign-up required to get full value. Sign in and your data is securely saved to your private account and synced across your devices, so you can move from phone to laptop without losing anything.',
      'Either way, your data is yours. There’s no dark pattern forcing an account before you can try the product, and no quiet harvesting of your swings. Privacy isn’t a setting you have to find — it’s the starting state.',
    ],
    bestFor: [
      'Privacy-conscious players who want to try before creating an account',
      'Anyone who wants their data synced securely once they do sign in',
    ],
    guide: [
      {
        title: 'Start with no account',
        body: 'Use SwingVantage immediately — your data lives on your device, fully functional, no sign-up.',
      },
      {
        title: 'Sign in to sync',
        body: 'When you want cross-device sync and a backup, create an account; everything on your device comes with you.',
      },
    ],
    relatedSlugs: ['backup-restore', 'deletion-controls'],
    relatedLinks: [{ label: 'Privacy & youth safety', href: '/privacy' }],
  },
  {
    slug: 'backup-restore',
    name: 'Backup & Restore',
    group: 'Data Safety',
    sports: 'All sports',
    summary:
      'Export all your SwingVantage data as a single downloadable JSON file. Re-import it on any device to restore your full profile, sessions, and history.',
    note: 'Optional AES-256-GCM password encryption for backup files.',
    overview: [
      'Backup & Restore makes your training record portable and permanent. Export everything — profile, sessions, history — as a single downloadable JSON file, then re-import it on any device to restore your full account. Your data is never trapped in the app.',
      'For sensitive backups, optional AES-256-GCM password encryption protects the file so only you can open it. It’s the safety net that means a lost phone or a new device never means lost progress.',
    ],
    bestFor: [
      'Players switching devices or wanting an offline safety copy',
      'Anyone who wants their data truly in their own hands',
    ],
    guide: [
      {
        title: 'Export regularly',
        body: 'Download a backup periodically — especially before switching devices — so your history is always safe.',
      },
      {
        title: 'Encrypt sensitive backups',
        body: 'Turn on password encryption for the file if you’re storing it somewhere shared. Keep the password safe — it can’t be recovered.',
      },
      {
        title: 'Restore on any device',
        body: 'Import the file on a new device to bring back your full profile, sessions, and history.',
      },
    ],
    limitations: [
      'An encrypted backup can’t be recovered without its password — store it carefully.',
    ],
    relatedSlugs: ['private-by-default', 'deletion-controls', 'session-history'],
  },
  {
    slug: 'deletion-controls',
    name: 'Deletion Controls',
    group: 'Data Safety',
    sports: 'All sports',
    summary:
      'Delete sessions, video analyses, equipment data, or everything — individually or all at once. Deletion is immediate and permanent.',
    overview: [
      'Deletion Controls give you complete authority over your data. Remove individual sessions, video analyses, or equipment entries, or wipe everything at once. Deletion is immediate and permanent — when you delete, it’s gone.',
      'This is the other half of "your data is yours": real ownership means the ability to remove, not just export. For signed-in users, account-level deletion cascades to your cloud data as well, with the local device wipe always available regardless of mode.',
    ],
    bestFor: [
      'Anyone who wants the absolute ability to erase their data',
      'Players cleaning up old or test sessions',
    ],
    guide: [
      {
        title: 'Delete granularly',
        body: 'Remove a single session, analysis, or equipment entry when you just want to tidy up.',
      },
      {
        title: 'Clear the device',
        body: 'Use "clear all" to wipe everything on this device — useful before handing a device on.',
      },
      {
        title: 'Delete your account and cloud data',
        body: 'Signed in? Account deletion cascades to remove your cloud data too. It’s permanent — export first if you want a copy.',
      },
    ],
    limitations: [
      'Deletion is immediate and permanent — there’s no undo, so export anything you want to keep first.',
    ],
    relatedSlugs: ['private-by-default', 'backup-restore'],
  },
];
