import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { buildGraph, articleSchema, faqPageSchema, breadcrumbListSchema } from '@/lib/seo/jsonLd';
import { ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  AnswerBlock,
  AuthoritySection,
  AuthorityFAQ,
  AuthorityCTA,
  RelatedLinks,
  AuthorityPageView,
  EditorialMeta,
} from '@/components/authority';

const SLUG = '/resources/what-is-heuristic-data';

export const metadata = buildMetadata({
  title: 'What Is Heuristic Data? A Plain-English Guide',
  description:
    'Heuristic data is information read through expert rules of thumb to surface the most likely pattern fast. How it differs from raw data, AI, and measurement — with examples.',
  path: SLUG,
  ogType: 'article',
});

const FAQS = [
  {
    question: 'What is heuristic data, in one sentence?',
    answer:
      'Heuristic data is information read through encoded expert rules of thumb to surface the most likely pattern quickly and consistently — a confident, data-backed estimate, not a guaranteed measurement.',
  },
  {
    question: 'Are heuristics just random guessing?',
    answer:
      'No. A heuristic has explicit trigger conditions drawn from how the sport actually works (for example, the start-line and curvature that define a slice). It is a structured, repeatable interpretation — the opposite of a guess.',
  },
  {
    question: 'How is heuristic data different from a real measurement?',
    answer:
      'A verified measurement is a number captured by a sensor or launch monitor. A heuristic interpretation infers a likely pattern from the data and your description. SwingVantage labels which is which so an estimate is never presented as a lab measurement.',
  },
  {
    question: 'Do heuristics get better over time?',
    answer:
      'They get more confident about you as you add profile data, symptoms, more sessions, video signals, and retest outcomes. More consistent evidence raises the confidence label on a finding.',
  },
];

export default function WhatIsHeuristicDataPage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'What Is Heuristic Data?',
      description:
        'Heuristic data is information interpreted through expert rules of thumb to surface the most likely pattern fast — distinct from raw data, AI interpretation, and verified measurement.',
      path: SLUG,
      dateModified: '2026-06-13',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Resources', path: '/resources' },
      { name: 'What is heuristic data?', path: SLUG },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <AuthorityPageView event={ANALYTICS_EVENTS.RESOURCE_ARTICLE_VIEWED} slug={SLUG} category="heuristic-data" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
            { name: 'What is heuristic data?', path: SLUG },
          ]}
          className="mb-5"
        />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Heuristic Data</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            What is heuristic data?
          </h1>
          <EditorialMeta className="mt-3" lastReviewed="June 13, 2026" readingTime="6 min read" />
        </header>

        <AnswerBlock answer="Heuristic data is information read through encoded expert rules of thumb to surface the most likely pattern quickly and consistently — a confident, data-backed estimate, not a guess and not a guaranteed measurement.">
          <p>
            SwingVantage uses heuristics as the fast, repeatable first pass on your swing: it matches your
            numbers and symptoms against sport-specific rules to name the pattern that fits best, with a
            confidence label attached.
          </p>
        </AnswerBlock>

        <AuthoritySection id="how" title="How heuristic rules work">
          <p>
            Each heuristic is a small, explicit rule: a trigger condition plus the pattern it implies. For
            golf, &ldquo;face open relative to path beyond a threshold, with the ball starting and curving
            right&rdquo; implies a slice pattern. The rule fires only when the data fits, and the strength of
            the fit feeds the confidence score. Because the rules are written down, they run instantly and
            return the same read for the same inputs.
          </p>
        </AuthoritySection>

        <AuthoritySection id="why" title="Why heuristics are useful for athletes">
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Fast:</strong> a read in milliseconds, with no model call and no waiting.</li>
            <li><strong>Repeatable:</strong> the same pattern always produces the same first-pass interpretation.</li>
            <li><strong>Explainable:</strong> you can see the trigger and the evidence behind the call.</li>
            <li><strong>Free and offline-friendly:</strong> the rules run without a paid service in the loop.</li>
          </ul>
        </AuthoritySection>

        <AuthoritySection id="not-guessing" title="Why heuristics are not random guessing">
          <p>
            A guess has no defined basis; a heuristic does. The trigger conditions come from how each sport
            actually behaves — ball flight laws, contact geometry, timing windows — so the interpretation is
            structured and testable. When a heuristic is uncertain (small sample, conflicting signals), the
            confidence label says so rather than pretending otherwise.
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="vs"
          title="Heuristic data vs. raw data vs. AI interpretation vs. verified measurement"
        >
          <div className="space-y-3">
            {[
              {
                t: 'Raw data',
                d: 'The unprocessed numbers and inputs — shot rows, your symptom description, video frames. Meaningful only once interpreted.',
              },
              {
                t: 'Verified measurement',
                d: 'A value captured by a sensor or launch monitor (e.g. ball speed from a TrackMan). High trust, but only as good as the device and capture.',
              },
              {
                t: 'Heuristic interpretation',
                d: 'Expert rules applied to the data to name the most likely pattern, fast and repeatably — labeled as an estimate with a confidence level.',
              },
              {
                t: 'AI interpretation',
                d: 'A model used selectively for qualitative review of sampled frames or narrative coaching. Powerful but variable, so it supports the structured read rather than replacing it.',
              },
            ].map((row) => (
              <div key={row.t} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{row.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.d}</p>
              </div>
            ))}
          </div>
        </AuthoritySection>

        <AuthoritySection
          id="examples"
          title="Examples across six sports"
          intro="The same idea — encode the rule of thumb — adapts to each sport."
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Golf — slice pattern:</strong> start line plus curvature point to an open-face, out-to-in read.</li>
            <li><strong>Baseball — late contact:</strong> consistent foul-side spray and timing cues suggest a timing or load issue, not bat path.</li>
            <li><strong>Softball — pop-up:</strong> repeated high launch with weak contact points to getting under the ball or early rotation.</li>
            <li><strong>Tennis — mishit location:</strong> off-center contact patterns hint at unit-turn or spacing problems.</li>
            <li><strong>Pickleball — poor contact consistency:</strong> a popped-up dink pattern flags a stiff wrist or paddle-face control.</li>
            <li><strong>Padel — recurring miss off the glass:</strong> rushed contact off the wall suggests footwork and patience, not power.</li>
            <li><strong>Across all — retest improvement:</strong> when the next session&rsquo;s numbers move toward the target window, the heuristic confirms the fix worked.</li>
          </ul>
        </AuthoritySection>

        <AuthoritySection id="better" title="How heuristics get sharper">
          <p>
            Heuristics improve when they have more to work with: a complete{' '}
            <Link href="/methodology" className="text-primary hover:underline">player profile</Link>, a clear
            symptom, several sessions instead of one, optional video signals, and{' '}
            <strong>retest outcomes</strong> that confirm what actually changed. None of that makes a finding
            certain — it makes the confidence label honest.
          </p>
        </AuthoritySection>

        <AuthorityCTA
          slug={SLUG}
          title="Try a heuristic read on your own swing"
          body="Import your data or describe your miss and get an instant, confidence-labeled first pass — free, no account."
        />

        <AuthorityFAQ items={FAQS} slug={SLUG} />

        <NotCoachReplacementNotice className="mt-10" />

        <RelatedLinks
          from={SLUG}
          title="Related concepts & pages"
          links={[
            { href: '/deterministic-intelligence', label: 'Deterministic intelligence', description: 'Why rules-based analysis is repeatable and explainable.' },
            { href: '/resources/ai-in-sports-performance', label: 'AI in sports performance', description: 'Where AI supports the structured read.' },
            { href: '/methodology', label: 'Our methodology', description: 'How a heuristic becomes one prioritized fix.' },
            { href: '/glossary', label: 'Glossary', description: 'Heuristic analysis, confidence, evidence labels and more.' },
            { href: '/tools/swing-mistake-quiz', label: 'Swing Mistake Quiz', description: 'A heuristic in action — find your likely fault.' },
            { href: '/resources', label: 'All resources', description: 'Browse the full resource library.' },
          ]}
        />
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
