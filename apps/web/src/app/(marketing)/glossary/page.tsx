import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Swing & Sports Performance Glossary | SwingVantage',
  description:
    'Plain-English definitions for every term SwingVantage uses — launch monitor metrics, batting statistics, tennis stroke terms, softball batting terms, and AI analysis concepts.',
  openGraph: {
    title: 'SwingVantage Glossary — Swing & Sports Performance Terms Explained',
    description:
      'Definitions for ball speed, exit velocity, launch angle, spin rate, bat speed, club path, face angle, attack angle, and 40+ more terms used in SwingVantage.',
    type: 'website',
    url: 'https://swingvantage.com/glossary',
  },
  alternates: { canonical: '/glossary' },
};

const SECTIONS = [
  {
    heading: 'Golf — Launch Monitor Metrics',
    sport: 'golf',
    terms: [
      { term: 'Ball Speed', def: 'How fast the ball leaves the clubface, measured in miles per hour (mph). Ball speed is the primary driver of carry distance. It is determined by how well the club transfers energy to the ball at impact.' },
      { term: 'Club Speed', def: 'How fast the clubhead is moving just before impact, in mph. Higher club speed creates the potential for higher ball speed and distance, but only if contact quality is good.' },
      { term: 'Smash Factor', def: 'Ball speed divided by club speed. A smash factor of 1.50 means the ball left the face at 1.5× the clubhead speed — the theoretical maximum for a driver. Smash factor measures strike efficiency, not raw speed.' },
      { term: 'Launch Angle', def: 'The vertical angle at which the ball leaves the face, measured in degrees above horizontal. Optimal launch angle varies by club: roughly 10–14° for driver, higher for wedges. Low launch wastes spin; high launch adds carry but reduces roll.' },
      { term: 'Spin Rate', def: 'Total revolutions per minute (RPM) the ball spins after impact. High spin (5,000+ RPM on driver) creates a ballooning flight that loses distance. Low spin (under 2,000 RPM) produces a flatter, harder-to-control trajectory. Optimal driver spin is roughly 2,200–2,800 RPM.' },
      { term: 'Club Path', def: 'The direction the clubhead is traveling through impact, relative to the target line. Measured in degrees. Positive = in-to-out (draws). Negative = out-to-in (fades). Club path is the primary cause of shot curvature.' },
      { term: 'Face Angle', def: 'Where the clubface is pointing at impact, relative to the target line. Positive = open (right of target for right-handers). Negative = closed. Face angle determines starting direction — about 75–85% of starting direction comes from the face.' },
      { term: 'Face-to-Path', def: 'The difference between face angle and club path. A neutral face-to-path (±2°) produces a straight shot. Larger gaps produce more curve. A positive face-to-path (face open relative to path) produces a fade; negative produces a draw.' },
      { term: 'Attack Angle', def: 'The vertical angle at which the clubhead approaches the ball at impact. Negative = hitting down. Positive = hitting up. For irons you want a slightly negative attack angle (-2° to -5°). For driver, a slightly positive attack angle (+1° to +3°) reduces spin and increases distance.' },
      { term: 'Dynamic Loft', def: 'The actual loft of the face at impact — affected by shaft lean, attack angle, and adjustable hosel position. Dynamic loft determines how high the ball launches. Shaft lean forward (hands ahead of ball) reduces dynamic loft; shaft lean back increases it.' },
      { term: 'Carry Distance', def: 'How far the ball travels through the air before landing. Distinguished from total distance, which includes roll. Carry distance is the primary measurement for club selection on approaches over hazards.' },
      { term: 'Dispersion', def: 'How spread out your shots are, measured as a pattern. SwingVantage plots dispersion as a scatter chart. Tight dispersion means consistent contact; wide dispersion suggests inconsistency in face angle, strike location, or club path.' },
    ],
  },
  {
    heading: 'Baseball & Softball — Batting Metrics',
    sport: 'baseball',
    terms: [
      { term: 'Exit Velocity (EV)', def: 'How fast the ball comes off the bat, in mph. Exit velocity is a ceiling metric — the maximum possible distance is determined by EV. Higher EV requires better bat path, not just strength. Common benchmarks: youth 55–65 mph, high school 75–85 mph, college 85–92 mph, professional 88–100+ mph.' },
      { term: 'Launch Angle (Batting)', def: 'The vertical angle the ball leaves the bat. Negative = groundball. 0–10° = hard line drive. 10–25° = optimal for hard-hit balls. 25–50° = fly ball. Above 50° = pop-up. Elite hitters optimize exit velocity in the 8–20° launch angle range.' },
      { term: 'Bat Speed', def: 'How fast the barrel of the bat is moving at contact, measured in mph. Bat speed contributes to exit velocity along with bat path and contact location. It is measured by devices like Blast Motion and Diamond Kinetics.' },
      { term: 'Attack Angle (Batting)', def: 'The vertical angle of the bat path through the hitting zone. A slightly upward attack angle (+5° to +15°) matches the natural downward plane of a pitch and creates more favorable launch angles for hard contact.' },
      { term: 'Time to Contact', def: 'The time from load commitment to contact. Shorter time to contact indicates a quicker, more compact swing — valuable against high-velocity pitching.' },
      { term: 'Spray Angle', def: 'The horizontal direction the ball travels off the bat, measured from the middle of the field. Positive = pull side. Negative = opposite field. Consistent spray angle toward the pull side can indicate a pull-only swing pattern.' },
      { term: 'Hard-Hit Rate', def: 'The percentage of batted balls with an exit velocity above a set threshold (typically 95 mph in MLB; adjusted for level). Hard-hit rate is a better measure of contact quality than batting average.' },
      { term: 'Barrel', def: 'A batted ball with a high exit velocity AND an optimal launch angle simultaneously — the combination most likely to produce extra-base hits. In MLB Statcast data, a barrel requires EV of 98+ mph at 26–30° launch angle, with the EV threshold decreasing as launch angle moves away from that range.' },
    ],
  },
  {
    heading: 'Tennis — Stroke Terms',
    sport: 'tennis',
    terms: [
      { term: 'Split Step', def: 'A small jump timed to the moment the opponent strikes the ball. The split step activates fast-twitch muscle fibers and allows the player to move in any direction explosively. Skipping the split step is one of the most common causes of poor court positioning.' },
      { term: 'Unit Turn', def: 'Rotating the hips and shoulders together as a single unit when preparing for a groundstroke. Proper unit turn creates a loaded position with coiled hip-shoulder separation. Lack of unit turn — taking the racquet back with just the arm — is a common cause of late swings.' },
      { term: 'Racquet Drop', def: 'The moment after the shoulder turn where the racquet head drops below the wrist to create a whipping motion through contact. The racquet drop is what generates topspin. Many players who lack spin either skip the drop or execute it too early.' },
      { term: 'Trophy Position', def: 'The peak moment of the service motion, where the hitting arm is raised and the body is arched — resembling a trophy. The trophy position loads the kinetic chain for the swing. Rushing through it or missing it typically produces flat, inconsistent serves.' },
      { term: 'Follow-Through', def: "The path the racquet takes after contact. A complete follow-through — finishing over the non-dominant shoulder on groundstrokes — ensures the swing was not decelerated before contact. Stopping the swing at contact is a common beginner fault that reduces both power and consistency." },
      { term: 'Swingweight', def: 'A measurement of how heavy a racquet feels when swung, accounting for weight distribution. A higher swingweight produces more plow-through and power but is harder to maneuver. Swingweight is affected by lead tape and string choice.' },
      { term: 'RA / Stiffness', def: 'Racquet stiffness measured by deflection under load. High RA (66+) = stiff = more power, less feel, more arm stress. Low RA (below 58) = flexible = more feel, more arm-friendly, less power. Stiff racquets amplify wrist/elbow issues in players with poor mechanics.' },
    ],
  },
  {
    heading: 'Slow Pitch Softball — Terms',
    sport: 'softball',
    terms: [
      { term: 'Arc', def: "The required flight path of a slow pitch softball delivery. Most leagues require a minimum 6-foot arc and maximum 12-foot arc. Pitches outside this range are illegal. Hitters must time their swing to meet the ball at the optimal contact point in the arc's descent." },
      { term: 'Compression Rating', def: 'A measure of how much force it takes to compress a slow pitch softball 0.25 inches, in pounds per square inch (PSI). Higher compression = harder ball = more pop. League rules specify legal compression ranges; non-compliant bats can be disqualified.' },
      { term: 'End Load', def: 'Extra weight added toward the barrel end of a slow pitch bat to increase swing momentum and exit velocity. End-loaded bats reward hitters with bat speed to control them. Hitters without sufficient bat speed will struggle to get end-loaded bats through the zone on time.' },
      { term: 'BPF (Bat Performance Factor)', def: 'A standard that measures how much energy the bat returns to the ball compared to a completely rigid wall. Higher BPF = more pop. BPF is used to regulate bat performance across different slow pitch associations.' },
    ],
  },
  {
    heading: 'AI Analysis Concepts',
    sport: 'ai',
    terms: [
      { term: 'Diagnostic Confidence', def: 'How certain SwingVantage is about a given finding, based on how much data was available and how consistently the pattern appears. High confidence means the issue appears clearly and repeatedly. Low confidence means the finding is possible but would need more data to confirm.' },
      { term: 'Heuristic Analysis', def: 'Smart, rules-and-pattern-based analysis that reads observable cues to surface what is most likely happening in your swing — a confident, data-backed estimate that sharpens as you add more data. Import launch-monitor or tracking data to push it to its most precise.' },
      { term: 'Primary vs. Secondary Fault', def: "The primary fault is the swing issue with the highest severity and impact on performance. The secondary fault is the most likely co-existing issue. Fixing the primary fault often improves the secondary fault automatically — they're frequently connected." },
      { term: 'Severity', def: 'How significant a swing fault is expected to be for performance. Severity ratings in SwingVantage are labeled: Critical, High, Moderate, and Low. Critical and High faults are prioritized in training recommendations.' },
      { term: 'Benchmark', def: 'A reference value that defines acceptable or optimal performance for a given metric. SwingVantage compares your data against sport-specific, skill-level-adjusted benchmarks. Benchmarks are derived from publicly available research and coaching literature, not proprietary databases.' },
    ],
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwingVantage', item: 'https://swingvantage.com' },
        { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://swingvantage.com/glossary' },
      ],
    },
    {
      '@type': 'DefinedTermSet',
      name: 'SwingVantage Swing & Sports Performance Glossary',
      description: 'Plain-English definitions for launch monitor metrics, batting statistics, tennis terms, softball terms, and AI analysis concepts.',
      hasDefinedTerm: SECTIONS.flatMap((s) =>
        s.terms.map((t) => ({ '@type': 'DefinedTerm', name: t.term, description: t.def })),
      ),
    },
  ],
};

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-card">
      <JsonLd data={structuredData} />

      {/* Header */}
      <div className="bg-primary text-primary-foreground py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">SQ</span>
            </div>
            <Link href="/" className="text-white font-bold text-xl hover:text-primary-foreground/80 transition-colors">SwingVantage</Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Swing & Performance Glossary</h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Plain-English definitions for every term SwingVantage uses — launch monitor metrics, batting stats, stroke terminology, and AI concepts.
          </p>
        </div>
      </div>

      {/* Jump links */}
      <div className="bg-muted border-b border-border py-4 px-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap gap-3 text-sm">
          {SECTIONS.map((s) => (
            <a key={s.sport} href={`#${s.sport}`} className="text-primary hover:underline whitespace-nowrap">
              {s.heading.split('—')[0].trim()}
            </a>
          ))}
        </div>
      </div>

      {/* Glossary content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
        {SECTIONS.map((section) => (
          <section key={section.sport} id={section.sport}>
            <h2 className="text-xl font-bold text-foreground mb-6 pb-2 border-b border-border">
              {section.heading}
            </h2>
            <dl className="space-y-5">
              {section.terms.map((t) => (
                <div key={t.term} className="grid sm:grid-cols-[220px_1fr] gap-2 sm:gap-4">
                  <dt className="font-semibold text-foreground text-sm pt-0.5">{t.term}</dt>
                  <dd className="text-sm text-muted-foreground leading-relaxed">{t.def}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {/* Nav */}
        <nav className="flex flex-wrap gap-4 text-sm pt-4 border-t border-border">
          <Link href="/" className="text-primary hover:underline">← SwingVantage Home</Link>
          <Link href="/resources" className="text-primary hover:underline">Resources</Link>
          <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
          <Link href="/golf-swing-analysis" className="text-primary hover:underline">Golf Analysis</Link>
        </nav>
      </div>
    </div>
  );
}
