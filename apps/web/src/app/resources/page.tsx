import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Swing Training Resources | SwingIQ',
  description:
    'Guides, checklists, and reference materials to help golfers, tennis players, baseball hitters, and softball players improve their swing mechanics and training habits.',
  openGraph: {
    title: 'Swing Training Resources | SwingIQ',
    description:
      'Free guides and references for swing improvement — golf, tennis, baseball, and softball.',
    type: 'website',
    url: 'https://swingiq.app/resources',
  },
  alternates: { canonical: '/resources' },
};

const RESOURCE_SECTIONS = [
  {
    sport: 'Golf',
    emoji: '⛳',
    href: '/golf-swing-analysis',
    resources: [
      {
        title: 'Understanding Launch Monitor Data',
        desc: 'What each metric means and which numbers matter most for your swing. Ball speed, club speed, launch angle, spin rate, club path, face angle, attack angle, and smash factor — explained in plain English.',
      },
      {
        title: 'How to Read a Shot Pattern',
        desc: "A consistent shot shape that repeats — even an imperfect one — is more useful than random misses. Here's how to identify whether your pattern is driven by face angle, path, or both.",
      },
      {
        title: 'Loft Gapping Basics',
        desc: "The average golfer carries overlapping clubs that produce the same distance, creating gaps in the middle of the bag. SwingIQ's gap analysis identifies which clubs are redundant and which distances are uncovered.",
      },
      {
        title: 'When to Trust Your Diagnosis',
        desc: "A single session's data can be misleading. SwingIQ's diagnostic confidence is highest when the same issue appears consistently across multiple sessions. One bad day is noise; three sessions in a row is a pattern.",
      },
      {
        title: 'Driver vs. Iron Differences',
        desc: 'Optimal attack angle, launch angle, and spin rate are different for driver and irons. SwingIQ accounts for this when setting benchmarks — a negative attack angle is correct for irons but a fault for driver.',
      },
    ],
  },
  {
    sport: 'Tennis',
    emoji: '🎾',
    href: '/tennis-swing-analysis',
    resources: [
      {
        title: 'The Five Phases of a Tennis Groundstroke',
        desc: 'Ready position → split step → unit turn → swing path → follow-through. Each phase has a distinct job. Understanding which phase breaks down helps you identify where to focus your practice.',
      },
      {
        title: 'Serve Trophy Position',
        desc: 'The trophy position is the moment at maximum shoulder rotation before the racquet drop. Athletes who miss this checkpoint typically struggle with serve consistency and power regardless of arm speed.',
      },
      {
        title: 'Topspin vs. Flat Ball Tradeoffs',
        desc: 'Topspin adds net clearance and bounce. Flat balls are harder and lower. Understanding the mechanical difference — primarily racquet head path and contact point — helps you practice intentionally.',
      },
    ],
  },
  {
    sport: 'Baseball',
    emoji: '⚾',
    href: '/baseball-swing-analysis',
    resources: [
      {
        title: 'Exit Velocity Benchmarks by Level',
        desc: 'High school average: 75–85 mph. College: 85–92 mph. Professional: 88–95 mph. Elite: 100+ mph. Exit velocity is a ceiling metric — maximizing it requires optimal bat path, not just strength.',
      },
      {
        title: 'Launch Angle and Batted Ball Type',
        desc: 'Below -10°: groundball. -10° to 10°: line drive. 10°–25°: flare or burner. 25°–50°: fly ball. Above 50°: pop-up. Optimal hard-hit average comes from keeping launch angle in the 10–25° range.',
      },
      {
        title: 'Hip-Shoulder Separation',
        desc: 'The gap between hip rotation and shoulder rotation is the primary power source in a baseball swing. SwingIQ identifies athletes who rotate hips and shoulders simultaneously — the most common power leak in youth hitters.',
      },
      {
        title: 'Reading Tee Work Results',
        desc: 'Tee work is diagnostic, not just practice. Where the ball goes off the tee tells you about bat path. Where it goes in live BP tells you about timing. Keeping both in your session log helps identify which issue is mechanical vs. timing.',
      },
    ],
  },
  {
    sport: 'Slow Pitch Softball',
    emoji: '🥎',
    href: '/softball-swing-analysis',
    resources: [
      {
        title: 'Arc Timing in Slow Pitch',
        desc: 'Slow pitch arcs demand that the hitter wait — a skill that contradicts every baseball-trained muscle memory. Most slow pitch power losses come from early rotation triggered by the pitcher release, not the ball arrival.',
      },
      {
        title: 'End Load vs. Balanced Bat',
        desc: 'End-loaded bats shift weight toward the barrel, adding power for hitters with quick enough bat speed to control them. Balanced bats improve contact rate. Choosing the wrong type is one of the most common slow pitch equipment mismatches.',
      },
      {
        title: 'Bat Association Certifications',
        desc: 'USSSA, USA/ASA, ISA, NSA, and SSUSA (senior) each have different compression and performance standards. Using an illegal bat — even accidentally — can result in ejection. SwingIQ helps you track the certification of each bat in your profile.',
      },
    ],
  },
  {
    sport: 'Fast Pitch Softball',
    emoji: '🥎',
    href: '/softball-swing-analysis',
    resources: [
      {
        title: 'Compact Swing Mechanics',
        desc: "Fast pitch timing windows are measured in hundredths of a second. A long swing path that works in slow pitch becomes a liability against 60+ mph pitching. SwingIQ's fast pitch engine flags path length as a primary fault category.",
      },
      {
        title: 'Drop and Rise Ball Adjustments',
        desc: 'Adjusting to movement pitches requires maintaining a level bat path through the zone rather than swinging to where you think the ball will be. Most timing issues against off-speed pitches are actually load-timing issues, not swing-path issues.',
      },
    ],
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'SwingIQ', item: 'https://swingiq.app' },
    { '@type': 'ListItem', position: 2, name: 'Resources', item: 'https://swingiq.app/resources' },
  ],
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Header */}
      <div className="bg-[#1a3a2a] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SQ</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-green-300 transition-colors">SwingIQ</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Swing Training Resources</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Guides and references to help you understand your swing data and make better use of your practice time — for all 5 sports.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {RESOURCE_SECTIONS.map((section) => (
          <section key={section.sport}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{section.emoji}</span>
              <h2 className="text-xl font-bold text-gray-900">{section.sport}</h2>
              <Link href={section.href} className="text-xs text-green-700 hover:underline ml-auto">
                {section.sport} Analysis →
              </Link>
            </div>
            <div className="space-y-5">
              {section.resources.map((r) => (
                <div key={r.title} className="border-l-2 border-green-200 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{r.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Apply this in SwingIQ</h3>
          <p className="text-gray-600 text-sm mb-4">Import your data and get a diagnosis based on your actual swing — not just general advice.</p>
          <Link
            href="/dashboard"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Start Free Analysis
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-gray-200">
          <Link href="/" className="text-green-700 hover:underline">← SwingIQ Home</Link>
          <Link href="/glossary" className="text-green-700 hover:underline">Glossary</Link>
          <Link href="/faq" className="text-green-700 hover:underline">FAQ</Link>
          <Link href="/how-it-works" className="text-green-700 hover:underline">How It Works</Link>
        </nav>
      </div>
    </div>
  );
}
