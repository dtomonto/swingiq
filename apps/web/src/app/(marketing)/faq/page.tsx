import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata } from '@/lib/seo/metadata';

// buildMetadata adds canonical + hreflang alternates to localized versions
// (e.g. /es/faq) when they exist — see lib/seo/metadata.
export const metadata = buildMetadata({
  title: 'Frequently Asked Questions | SwingVantage',
  description:
    'Answers to the most common questions about SwingVantage — how AI swing analysis works, what sports are supported, how your data is protected, and what the platform can and cannot do.',
  path: '/faq',
});

const FAQ_SECTIONS = [
  {
    heading: 'Getting Started',
    items: [
      {
        q: 'What is SwingVantage?',
        a: 'SwingVantage is a free, web-based AI swing performance platform. You upload a swing video or import launch monitor data, and SwingVantage identifies your highest-priority swing issue, explains why it matters, and recommends specific drills and a practice plan.',
      },
      {
        q: 'Is SwingVantage free?',
        a: "Yes. SwingVantage's full swing analysis, diagnostic engine, drill recommendations, and progress tracking are free. No credit card is required.",
      },
      {
        q: 'Do I need to create an account?',
        a: 'No — you can start instantly with no account, and your data is saved privately in your browser. You can move it between devices anytime with Backup & Restore, and optional accounts with automatic cloud sync are on the way.',
      },
      {
        q: 'Does SwingVantage work on a phone?',
        a: 'Yes. SwingVantage is a mobile-optimized web app. It works on any modern phone, tablet, or desktop browser — no app download required.',
      },
    ],
  },
  {
    heading: 'Supported Sports',
    items: [
      {
        q: 'What sports does SwingVantage support?',
        a: 'SwingVantage supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own diagnostic engine, drill library, and coaching logic.',
      },
      {
        q: 'Can I switch between sports in the same account?',
        a: 'Yes. SwingVantage remembers your selected sport across sessions. You can switch sports at any time from the sidebar or sport selector — the entire interface adapts to the sport you are using.',
      },
      {
        q: 'Does SwingVantage analyze slow pitch softball separately from fast pitch?',
        a: 'Yes. Slow pitch and fast pitch softball have separate diagnostic engines because the swing mechanics, timing demands, and equipment are different. Slow pitch analysis focuses on arc timing, line-drive bat path, and directional hitting. Fast pitch analysis focuses on compact launch, quick load, and adapting to pitch speed.',
      },
    ],
  },
  {
    heading: 'How the AI Works',
    items: [
      {
        q: 'How does SwingVantage analyze a swing?',
        a: 'SwingVantage uses two layers. First, a rules-based diagnostic engine compares your data against sport-specific benchmarks to identify your highest-priority swing fault — similar to how a coach would read a shot pattern. Second, an AI language model generates a plain-English explanation, personalized drill recommendations, and a practice plan based on your specific pattern.',
      },
      {
        q: 'Can SwingVantage see what my swing looks like from a video?',
        a: "Yes — upload a swing video and SwingVantage breaks it into phases with coaching notes for each one. Video reads are heuristic estimates: confident, data-backed starting points that sharpen the more you add. Import data from a launch monitor or tracking device and SwingVantage folds those exact numbers straight in for the sharpest read.",
      },
      {
        q: 'Does SwingVantage replace a private coach?',
        a: "SwingVantage is your everyday improvement edge — it spots your recurring patterns, prioritizes your practice, and keeps you sharp between lessons, no appointment needed. For complex technique corrections, injury concerns, or advanced competitive development it pairs perfectly with a qualified coach, and you'll arrive already ahead.",
      },
      {
        q: 'How accurate is the swing diagnosis?',
        a: "Diagnostic confidence depends on how much data is available. SwingVantage labels every finding with a confidence level and lists the evidence it used to reach its conclusion. When data is limited, the diagnosis will say so. Don't rely on a single analysis as a definitive verdict — look for patterns that repeat across multiple sessions.",
      },
    ],
  },
  {
    heading: 'Data Import',
    items: [
      {
        q: 'What launch monitor brands does SwingVantage support for golf?',
        a: 'SwingVantage imports CSV data from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak, and other common formats. You can also enter data manually.',
      },
      {
        q: 'What tracking devices does SwingVantage support for baseball and softball?',
        a: 'SwingVantage supports data from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, and similar devices. Manual session entry is also available.',
      },
      {
        q: 'Can I import a screenshot of my performance data?',
        a: 'SwingVantage includes an image upload flow for performance data tables. You can upload a screenshot and manually confirm the extracted values. Automated OCR extraction is a best effort and may need manual correction.',
      },
    ],
  },
  {
    heading: 'Privacy & Data',
    items: [
      {
        q: 'Where is my data stored?',
        a: "When you sign in, your SwingVantage data is saved to your own private account and synced across your devices, so you never lose your progress. Without an account, it stays on your device. Either way it is yours: you can export everything as a single downloadable file from Settings → Backup & Restore, or delete it anytime.",
      },
      {
        q: 'Is my swing video private?',
        a: 'Yes. Videos are analyzed in your browser. They are not uploaded to external servers by default and are not shared publicly.',
      },
      {
        q: 'Can I delete my data?',
        a: 'Yes. You can delete individual records, specific data categories, or everything at once from Settings → Data Management. Deletion takes effect immediately.',
      },
      {
        q: 'Is SwingVantage safe for kids and young athletes?',
        a: 'SwingVantage is not directed at children under 13. For users under 18, we recommend parental involvement and supervision when uploading videos. See our Parents page and Trust & Safety page for more detail.',
      },
    ],
  },
  {
    heading: 'Equipment',
    items: [
      {
        q: 'Does SwingVantage analyze my golf clubs or equipment?',
        a: 'SwingVantage includes an Equipment section where you can log your golf clubs, review loft gapping between clubs, and get suggestions about whether your equipment setup may be contributing to your swing patterns. Equipment analysis is an optional layer — it is not required to use SwingVantage.',
      },
      {
        q: 'Will SwingVantage tell me to buy new equipment?',
        a: 'SwingVantage recommends adjustments before upgrades. Most equipment recommendations in SwingVantage suggest testing changes — like adjusting loft, grip size, or setup — before buying new gear. Equipment upgrades are only flagged when there is a meaningful mismatch between your data and your current setup.',
      },
    ],
  },
];

export default function FAQPage() {
  const allItems = FAQ_SECTIONS.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SV</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-primary-foreground/80 transition-colors">SwingVantage</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Common questions about SwingVantage — what it does, how it works, and what it honestly cannot do.
          </p>
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">
              {section.heading}
            </h2>
            <dl className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-foreground mb-1 text-base">{item.q}</dt>
                  <dd className="text-muted-foreground text-sm leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {/* JSON-LD FAQ Schema for AEO/GEO */}
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allItems.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          }}
        />

        {/* CTA */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Ready to analyze your swing?</h3>
          <p className="text-muted-foreground text-sm mb-4">Free. No account required. Works on any device.</p>
          <Link
            href="/start"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Start Free Analysis
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href="/" className="text-primary hover:underline">← SwingVantage Home</Link>
          <Link href="/how-it-works" className="text-primary hover:underline">How It Works</Link>
          <Link href="/trust" className="text-primary hover:underline">Trust & Safety</Link>
          <Link href="/parents" className="text-primary hover:underline">For Parents</Link>
          <Link href="/updates" className="text-primary hover:underline">Updates</Link>
        </nav>
      </div>
    </div>
  );
}
