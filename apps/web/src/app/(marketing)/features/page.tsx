import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'SwingIQ Features — AI Swing Analysis, Diagnostics & Training Tools',
  description:
    'Every SwingIQ feature explained: AI swing diagnosis, launch monitor import, video analysis, drill library, practice scheduling, progress tracking, equipment diagnostics, and more — for golf, tennis, baseball, and softball.',
  openGraph: {
    title: 'SwingIQ Features — What You Get Free',
    description:
      'AI swing diagnosis, personalized drills, practice plans, video analysis, equipment management, and progress tracking — all free, all sports.',
    type: 'website',
    url: 'https://swingiq.app/features',
  },
  alternates: { canonical: '/features' },
};

const FEATURE_GROUPS = [
  {
    heading: 'Swing Diagnosis',
    features: [
      {
        name: 'AI Diagnostic Engine',
        sports: 'All 5 sports',
        desc: 'A rules-based engine compares your data against sport-specific benchmarks and identifies your highest-priority swing fault — ranked by severity, confidence, and impact on performance.',
        detail: 'Each finding includes the evidence used to reach the conclusion, likely causes, and what to expect if the issue is corrected.',
      },
      {
        name: 'Confidence Labels',
        sports: 'All 5 sports',
        desc: 'Every diagnosis shows a confidence level and lists exactly what data was used. When data is limited, SwingIQ says so rather than guessing.',
        detail: 'Labels include: High Confidence, Moderate Confidence, Low Confidence / Limited Data.',
      },
      {
        name: 'Competing Hypotheses',
        sports: 'Golf',
        desc: 'For golf diagnoses, SwingIQ shows the secondary issue most likely to co-exist with the primary fault — helping you understand pattern relationships rather than treating issues in isolation.',
        detail: '',
      },
    ],
  },
  {
    heading: 'Data Import',
    features: [
      {
        name: 'Launch Monitor CSV Import',
        sports: 'Golf',
        desc: 'Import CSV exports from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak, and other common formats. A 7-step wizard walks you through column mapping and session setup.',
        detail: 'The normalizer handles different column name formats and unit conversions automatically.',
      },
      {
        name: 'Screenshot / Image Import',
        sports: 'All 5 sports',
        desc: 'Upload a photo of a launch monitor screen, stats table, or scoreboard. SwingIQ provides a side-by-side data entry form so you can enter values while referencing the image.',
        detail: 'Optional OCR auto-extraction activates when an extraction provider is configured — it pre-fills the review table from your image and you confirm every value before saving. Manual entry is always the default.',
      },
      {
        name: 'Manual Session Log',
        sports: 'Tennis, Baseball, Softball',
        desc: 'Log a session manually — session type, duration, perceived effort, key metrics, and what you worked on. No tracking device required.',
        detail: '',
      },
      {
        name: 'Tracking Device Support',
        sports: 'Baseball & Softball',
        desc: 'Accepts data from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, and similar hitting trackers.',
        detail: '',
      },
    ],
  },
  {
    heading: 'Training & Drills',
    features: [
      {
        name: 'Fix Stack — One Fix at a Time',
        sports: 'All 5 sports',
        desc: 'SwingIQ finds your single highest-impact issue and turns it into a three-step loop: one body cue to feel, the best-matched drill for your level and the gear you have, and an honest before/after retest.',
        detail: 'Deterministic and local-first — it learns from what worked for you and needs no account.',
      },
      {
        name: 'Personalized Drill Recommendations',
        sports: 'All 5 sports',
        desc: 'Every diagnosis generates 3–5 sport-specific drills tailored to your exact fault pattern. Each drill includes a YouTube search link so you can immediately find video demonstrations.',
        detail: 'Drills are ranked by expected impact on your primary fault.',
      },
      {
        name: 'Training Routine Generator',
        sports: 'All 5 sports',
        desc: 'Generates a structured training routine based on your active diagnosis and skill level. Includes warm-up, focused drill work, and feedback checkpoints.',
        detail: '',
      },
      {
        name: 'Practice Schedule',
        sports: 'All 5 sports',
        desc: 'Creates a 7-day practice schedule based on your available days and session length. Each day has a focused theme tied to your current training priorities.',
        detail: '',
      },
      {
        name: 'Drill Library',
        sports: 'All 5 sports',
        desc: 'Browse the full drill library filtered by sport, issue category, and difficulty. Each drill entry explains what it corrects and how to perform it.',
        detail: '',
      },
      {
        name: 'Pre-Round / Pre-Game Warm-Up',
        sports: 'All 5 sports',
        desc: 'Generates a personalized pre-round warm-up sequence for golf, or a sport-specific pre-game activation checklist for tennis, baseball, and softball.',
        detail: 'Warm-ups are adapted to your active diagnosis and how much time you have before play.',
      },
    ],
  },
  {
    heading: 'Video Analysis',
    features: [
      {
        name: 'Swing Video Upload',
        sports: 'All 5 sports',
        desc: 'Upload a video of your swing from the face-on, down-the-line, or sport-specific angle. SwingIQ segments the video into phases and provides coaching notes for each phase.',
        detail: 'Every video read is a heuristic estimate that sharpens as you add data — a confident starting point you can act on today. For full on-device pose tracking and a rotatable 3D reconstruction, see Motion Lab below.',
      },
      {
        name: 'Phase-by-Phase Timeline',
        sports: 'All 5 sports',
        desc: 'Each sport has its own swing phases. Golf: address, backswing, transition, downswing, impact, follow-through. Tennis, baseball, and softball have sport-appropriate phases.',
        detail: '',
      },
      {
        name: 'Pro Reference Comparison',
        sports: 'All 5 sports',
        desc: 'Browse a curated library of professional athlete swing references filtered by sport. Use as a visual learning reference alongside your own video.',
        detail: 'References are publicly available YouTube videos. SwingIQ does not host or own the footage.',
      },
    ],
  },
  {
    heading: '3D Motion Analysis — Motion Lab',
    features: [
      {
        name: 'Motion Lab (3D)',
        sports: 'All 5 sports',
        desc: 'Turn a phone clip into a 3D figure of your motion you can spin, slow down, and step through — with a phase-by-phase breakdown, scores for power, rotation, balance, sequencing, timing, and consistency, your top 3 fixes, and a practice plan.',
        detail: 'Runs privately on your own device. One camera gives an estimated 3D read; filming the same rep from two angles about 90° apart produces measured 3D. No medical, injury, or tour-grade claims.',
      },
    ],
  },
  {
    heading: 'Equipment',
    features: [
      {
        name: 'Golf Bag Manager',
        sports: 'Golf',
        desc: 'Log every club in your bag — brand, model, loft, shaft flex, typical carry distance. SwingIQ uses this data to add equipment context to your diagnoses.',
        detail: '',
      },
      {
        name: 'Loft Gapping Analysis',
        sports: 'Golf',
        desc: 'See the carry distance gap between every club in your bag. SwingIQ highlights clubs where the gap is too large (missing distance window) or too small (overlap).',
        detail: '30+ club model specs are pre-loaded. Generic defaults fill in any gaps.',
      },
      {
        name: 'Loft Autofill',
        sports: 'Golf',
        desc: 'Select your club brand and model and SwingIQ auto-fills the stock loft. You can override with your actual measured loft for fitted clubs.',
        detail: '',
      },
    ],
  },
  {
    heading: 'Progress & AI Coach',
    features: [
      {
        name: 'Session History',
        sports: 'All 5 sports',
        desc: 'Every session is stored locally with its full shot data, diagnosis, scores, and training recommendations. Filter by sport, date range, or club/movement type.',
        detail: '',
      },
      {
        name: 'Swing Score Trends',
        sports: 'Golf',
        desc: 'Track your overall swing score, face control, path control, strike quality, consistency, and dispersion across sessions on a time-series chart.',
        detail: '',
      },
      {
        name: 'Milestones',
        sports: 'All 5 sports',
        desc: 'Automatically tracks key milestones — sessions completed, videos analyzed, personal bests, streaks, and improvement markers.',
        detail: '',
      },
      {
        name: 'Retest — Prove the Change',
        sports: 'All 5 sports',
        desc: 'SwingIQ reminds you when a diagnosed finding is due for a retest, then — after you re-analyze under the same conditions — shows an honest before-and-after read of whether it actually changed.',
        detail: 'Comparisons are labeled directional reads from your data and video, not lab-measured biomechanics.',
      },
      {
        name: 'Player Arc',
        sports: 'All 5 sports',
        desc: 'The story of your improvement over time — the faults that keep coming back, which drills actually worked for you, and honest proof of what each retest changed. It builds with every session.',
        detail: '',
      },
      {
        name: 'SwingIQ Labs',
        sports: 'All 5 sports',
        desc: 'An in-app home for emerging, on-device tools: a daily readiness score, a private player model, cross-sport skill transfer, your performance graph, and benchmark mirrors.',
        detail: 'Some are early versions — each is honest about its confidence and what it does not know yet.',
      },
      {
        name: 'AI Coach Chat',
        sports: 'All 5 sports',
        desc: 'Ask the AI coach questions about your swing, drills, or practice strategy. The AI coach uses your actual session data and active diagnosis as context.',
        detail: 'Powered by a large language model. Responses are coaching suggestions, not professional instruction.',
      },
    ],
  },
  {
    heading: 'Data Safety',
    features: [
      {
        name: 'Local-First Storage',
        sports: 'All sports',
        desc: 'All data is stored in your browser by default. No account required. Nothing leaves your device until you choose to sync.',
        detail: '',
      },
      {
        name: 'Backup & Restore',
        sports: 'All sports',
        desc: 'Export all your SwingIQ data as a single downloadable JSON file. Re-import it on any device to restore your full profile, sessions, and history.',
        detail: 'Optional AES-256-GCM password encryption for backup files.',
      },
      {
        name: 'Deletion Controls',
        sports: 'All sports',
        desc: 'Delete sessions, video analyses, equipment data, or everything — individually or all at once. Deletion is immediate and permanent.',
        detail: '',
      },
    ],
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingIQ', item: 'https://swingiq.app' },
        { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://swingiq.app/features' },
      ],
    },
    {
      '@type': 'SoftwareApplication',
      name: 'SwingIQ',
      applicationCategory: 'SportsApplication',
      operatingSystem: 'Web browser',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: FEATURE_GROUPS.flatMap((g) => g.features.map((f) => f.name)).join(', '),
    },
  ],
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-card">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SQ</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-primary-foreground/80 transition-colors">SwingIQ</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Everything SwingIQ Does — Free</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Every feature. Every sport. No credit card. No account required to start.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
            {['Golf', 'Tennis', 'Baseball', 'Slow Pitch Softball', 'Fast Pitch Softball'].map((s) => (
              <span key={s} className="bg-primary/50 text-primary-foreground/90 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature groups */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.heading}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">{group.heading}</h2>
            <div className="space-y-6">
              {group.features.map((f) => (
                <div key={f.name} className="flex gap-4">
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{f.name}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{f.sports}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    {f.detail && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{f.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Start using SwingIQ free</h3>
          <p className="text-muted-foreground text-sm mb-4">No account needed. Works on any device.</p>
          <Link
            href="/start"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Open SwingIQ Free
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href="/" className="text-primary hover:underline">← SwingIQ Home</Link>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
          <Link href="/golf-swing-analysis" className="text-primary hover:underline">Golf Analysis</Link>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
        </nav>
      </div>
    </div>
  );
}
