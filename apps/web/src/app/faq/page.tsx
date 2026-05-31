import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | SwingIQ',
  description:
    'Answers to the most common questions about SwingIQ — how AI swing analysis works, what sports are supported, how your data is protected, and what the platform can and cannot do.',
  openGraph: {
    title: 'SwingIQ FAQ — AI Swing Analysis Questions Answered',
    description:
      'Everything you need to know about SwingIQ: supported sports, how the AI works, privacy, data import, and more.',
    type: 'website',
    url: 'https://swingiq.app/faq',
  },
  alternates: { canonical: '/faq' },
};

const FAQ_SECTIONS = [
  {
    heading: 'Getting Started',
    items: [
      {
        q: 'What is SwingIQ?',
        a: 'SwingIQ is a free, web-based AI swing performance platform. You upload a swing video or import launch monitor data, and SwingIQ identifies your highest-priority swing issue, explains why it matters, and recommends specific drills and a practice plan.',
      },
      {
        q: 'Is SwingIQ free?',
        a: "Yes. SwingIQ's full swing analysis, diagnostic engine, drill recommendations, and progress tracking are free. No credit card is required.",
      },
      {
        q: 'Do I need to create an account?',
        a: 'No account is required to start. Your data is saved locally in your browser. Account sync across devices is coming soon.',
      },
      {
        q: 'Does SwingIQ work on a phone?',
        a: 'Yes. SwingIQ is a mobile-optimized web app. It works on any modern phone, tablet, or desktop browser — no app download required.',
      },
    ],
  },
  {
    heading: 'Supported Sports',
    items: [
      {
        q: 'What sports does SwingIQ support?',
        a: 'SwingIQ supports golf, tennis, baseball, slow pitch softball, and fast pitch softball. Each sport has its own diagnostic engine, drill library, and coaching logic.',
      },
      {
        q: 'Can I switch between sports in the same account?',
        a: 'Yes. SwingIQ remembers your selected sport across sessions. You can switch sports at any time from the sidebar or sport selector — the entire interface adapts to the sport you are using.',
      },
      {
        q: 'Does SwingIQ analyze slow pitch softball separately from fast pitch?',
        a: 'Yes. Slow pitch and fast pitch softball have separate diagnostic engines because the swing mechanics, timing demands, and equipment are different. Slow pitch analysis focuses on arc timing, line-drive bat path, and directional hitting. Fast pitch analysis focuses on compact launch, quick load, and adapting to pitch speed.',
      },
    ],
  },
  {
    heading: 'How the AI Works',
    items: [
      {
        q: 'How does SwingIQ analyze a swing?',
        a: 'SwingIQ uses two layers. First, a rules-based diagnostic engine compares your data against sport-specific benchmarks to identify your highest-priority swing fault — similar to how a coach would read a shot pattern. Second, an AI language model generates a plain-English explanation, personalized drill recommendations, and a practice plan based on your specific pattern.',
      },
      {
        q: 'Can SwingIQ see what my swing looks like from a video?',
        a: "SwingIQ can accept a swing video, but it currently uses heuristic analysis rather than full computer-vision pose tracking. Diagnostic results from video are labeled as estimates and should be treated as starting points, not measurements. For more precise analysis, import data from a launch monitor or tracking device.",
      },
      {
        q: 'Does SwingIQ replace a private coach?',
        a: 'No. SwingIQ is an AI-powered improvement assistant. It helps you identify recurring patterns, prioritize your practice, understand your swing data, and stay consistent between lessons. For complex technique corrections, injury concerns, or advanced competitive development, work with a qualified coach.',
      },
      {
        q: 'How accurate is the swing diagnosis?',
        a: "Diagnostic confidence depends on how much data is available. SwingIQ labels every finding with a confidence level and lists the evidence it used to reach its conclusion. When data is limited, the diagnosis will say so. Don't rely on a single analysis as a definitive verdict — look for patterns that repeat across multiple sessions.",
      },
    ],
  },
  {
    heading: 'Data Import',
    items: [
      {
        q: 'What launch monitor brands does SwingIQ support for golf?',
        a: 'SwingIQ imports CSV data from FlightScope, TrackMan, Foresight GCQuad, Garmin Approach, Rapsodo, SkyTrak, and other common formats. You can also enter data manually.',
      },
      {
        q: 'What tracking devices does SwingIQ support for baseball and softball?',
        a: 'SwingIQ supports data from HitTrax, Rapsodo, Blast Motion, Diamond Kinetics, and similar devices. Manual session entry is also available.',
      },
      {
        q: 'Can I import a screenshot of my performance data?',
        a: 'SwingIQ includes an image upload flow for performance data tables. You can upload a screenshot and manually confirm the extracted values. Automated OCR extraction is a best effort and may need manual correction.',
      },
    ],
  },
  {
    heading: 'Privacy & Data',
    items: [
      {
        q: 'Where is my data stored?',
        a: "By default, all your SwingIQ data is stored locally in your browser — not on a remote server. Nothing leaves your device until you choose to sync or back up. You can export everything as a single downloadable file from Settings → Backup & Restore.",
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
        q: 'Is SwingIQ safe for kids and young athletes?',
        a: 'SwingIQ is not directed at children under 13. For users under 18, we recommend parental involvement and supervision when uploading videos. See our Parents page and Trust & Safety page for more detail.',
      },
    ],
  },
  {
    heading: 'Equipment',
    items: [
      {
        q: 'Does SwingIQ analyze my golf clubs or equipment?',
        a: 'SwingIQ includes an Equipment section where you can log your golf clubs, review loft gapping between clubs, and get suggestions about whether your equipment setup may be contributing to your swing patterns. Equipment analysis is an optional layer — it is not required to use SwingIQ.',
      },
      {
        q: 'Will SwingIQ tell me to buy new equipment?',
        a: 'SwingIQ recommends adjustments before upgrades. Most equipment recommendations in SwingIQ suggest testing changes — like adjusting loft, grip size, or setup — before buying new gear. Equipment upgrades are only flagged when there is a meaningful mismatch between your data and your current setup.',
      },
    ],
  },
];

export default function FAQPage() {
  const allItems = FAQ_SECTIONS.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#1a3a2a] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SQ</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-green-300 transition-colors">SwingIQ</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Common questions about SwingIQ — what it does, how it works, and what it honestly cannot do.
          </p>
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
              {section.heading}
            </h2>
            <dl className="space-y-6">
              {section.items.map((item) => (
                <div key={item.q}>
                  <dt className="font-semibold text-gray-900 mb-1 text-base">{item.q}</dt>
                  <dd className="text-gray-600 text-sm leading-relaxed">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {/* JSON-LD FAQ Schema for AEO/GEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
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
            }),
          }}
        />

        {/* CTA */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Ready to analyze your swing?</h3>
          <p className="text-gray-600 text-sm mb-4">Free. No account required. Works on any device.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Start Free Analysis
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-gray-200">
          <Link href="/" className="text-green-700 hover:underline">← SwingIQ Home</Link>
          <Link href="/how-it-works" className="text-green-700 hover:underline">How It Works</Link>
          <Link href="/trust" className="text-green-700 hover:underline">Trust & Safety</Link>
          <Link href="/parents" className="text-green-700 hover:underline">For Parents</Link>
          <Link href="/updates" className="text-green-700 hover:underline">Updates</Link>
        </nav>
      </div>
    </div>
  );
}
