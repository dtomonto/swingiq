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
  TwoColumnList,
  AuthorityFAQ,
  AuthorityCTA,
  RelatedLinks,
  ClaimStatusBadge,
  AuthorityPageView,
  EditorialMeta,
} from '@/components/authority';

const SLUG = '/trust/accuracy-and-limitations';

export const metadata = buildMetadata({
  title: 'Accuracy & Limitations of AI Swing Analysis',
  description:
    'What SwingVantage can help with, what it cannot guarantee, how confidence labels work, and when to consult a coach or medical professional.',
  path: SLUG,
  ogType: 'article',
});

const FAQS = [
  {
    question: 'How accurate is SwingVantage?',
    answer:
      'It is consistent and confidence-labeled rather than lab-precise. Findings from a single camera or a small sample are estimates, not measurements. Accuracy improves with more sessions, cleaner inputs, and retests — and every finding tells you how confident it is.',
  },
  {
    question: 'What is the difference between a likely pattern and a confirmed measurement?',
    answer:
      'A likely pattern is the most probable interpretation given your data — an estimate with a confidence level. A confirmed measurement is a number captured by a sensor or launch monitor. SwingVantage labels which is which so they are never confused.',
  },
  {
    question: 'When should I see a coach or a doctor instead?',
    answer:
      'Work with a qualified coach for hands-on technique changes and anything the data cannot see. Consult a medical professional for any pain, injury, or health concern — SwingVantage does not provide medical or injury advice.',
  },
  {
    question: 'Why does my confidence label change?',
    answer:
      'Confidence scales with how much data you provided and how consistently the pattern repeats. One noisy session is low confidence; the same pattern across several sessions, or a successful retest, raises it.',
  },
];

export default function AccuracyAndLimitationsPage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'Accuracy & Limitations — How Much to Trust Your Swing Analysis',
      description:
        'What SwingVantage can help with, what it cannot guarantee, and how confidence labels, evidence labels, and retests keep findings honest.',
      path: SLUG,
      dateModified: '2026-06-13',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Trust & Safety', path: '/trust' },
      { name: 'Accuracy & limitations', path: SLUG },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <AuthorityPageView event={ANALYTICS_EVENTS.TRUST_PAGE_VIEWED} slug={SLUG} category="accuracy" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Trust & Safety', path: '/trust' },
            { name: 'Accuracy & limitations', path: SLUG },
          ]}
          className="mb-5"
        />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Trust · Accuracy &amp; Limitations
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            How accurate is it — and where are the limits?
          </h1>
          <EditorialMeta className="mt-3" lastReviewed="June 13, 2026" readingTime="7 min read" />
        </header>

        <AnswerBlock answer="SwingVantage gives consistent, confidence-labeled estimates — not lab measurements. It is most reliable when you give it more sessions and cleaner inputs, and it is transparent about what it cannot know.">
          <p>
            We would rather earn trust by being clear about the limits than by overclaiming. Here is the
            honest version of what the analysis can and cannot do.
          </p>
        </AnswerBlock>

        <AuthoritySection id="can-cannot" title="What it can help with — and what it cannot guarantee">
          <TwoColumnList
            left={{
              title: 'SwingVantage can help you',
              tone: 'positive',
              items: [
                'Identify the most likely pattern limiting your swing',
                'Prioritize one high-leverage fix instead of twenty tips',
                'Get repeatable, confidence-labeled feedback for free',
                'Track whether a fix actually moved your numbers',
              ],
            }}
            right={{
              title: 'It cannot guarantee',
              tone: 'caution',
              items: [
                'A specific score, distance, or performance result',
                'Lab-grade biomechanics from a single phone camera',
                'Certainty from a small or noisy sample',
                'A replacement for a coach or medical professional',
              ],
            }}
          />
        </AuthoritySection>

        <AuthoritySection id="uncertainty" title="Why swing analysis contains uncertainty">
          <p>
            A swing is a fast, three-dimensional motion sampled imperfectly — a few shots, one camera angle,
            variable lighting, your own description of the miss. Any reading from that has a margin of error.
            Rather than hide it, SwingVantage makes it explicit: a deterministic engine reduces randomness so
            the same inputs give the same answer, and a confidence label tells you how much weight to put on
            that answer. <ClaimStatusBadge claimId="deterministic-engine" />
          </p>
        </AuthoritySection>

        <AuthoritySection id="likely-vs-measured" title="Likely pattern vs. confirmed measurement">
          <p>
            This distinction is the heart of the honesty model:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              A <strong>likely pattern</strong> is an interpretation — the most probable read of your data,
              labeled as an estimate with a confidence level.
            </li>
            <li>
              A <strong>confirmed measurement</strong> is a number captured by a sensor or launch monitor.
            </li>
          </ul>
          <p>
            SwingVantage labels every finding so an estimate is never dressed up as a measurement.{' '}
            <ClaimStatusBadge claimId="evidence-labels" /> The full framing lives on the{' '}
            <Link href="/methodology" className="text-primary hover:underline">methodology page</Link>.
          </p>
        </AuthoritySection>

        <AuthoritySection id="confidence" title="How confidence labels work">
          <p>
            Confidence is calibrated, not cosmetic. It scales with sample size, how consistent your shots are
            shot-to-shot, and how complete the inputs were. A handful of erratic shots earns low confidence; a
            clear pattern repeated across sessions earns high confidence.{' '}
            <ClaimStatusBadge claimId="confidence-scoring" />
          </p>
        </AuthoritySection>

        <AuthoritySection id="video-limits" title="Video quality and capture limitations">
          <p>
            Optional AI video analysis reviews a small set of downscaled still-frames qualitatively — it is{' '}
            <strong>not</strong> frame-by-frame biomechanical measurement or real-time pose tracking.{' '}
            <ClaimStatusBadge claimId="ai-vision-frames" /> Poor lighting, a bad angle, or a shaky clip all
            reduce what any analysis can see, which is reflected in the confidence of the result.
          </p>
        </AuthoritySection>

        <AuthoritySection id="sport-limits" title="Sport-specific limitations">
          <p>
            Each sport has its own measurable signals and its own blind spots. Launch-monitor sports (golf)
            expose rich ball data; bat-and-ball sports lean on contact and timing cues; racket and paddle
            sports rely more on described symptoms and video. The rule sets are tuned per sport, and the
            confidence label reflects how much hard signal was available for yours.
          </p>
        </AuthoritySection>

        <AuthoritySection id="youth-coach-medical" title="Youth athletes, coaches, and medical professionals">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Youth athletes:</strong> use with a parent or guardian; SwingVantage is local-first and
              privacy-forward by default. <ClaimStatusBadge claimId="local-first-privacy" />
            </li>
            <li>
              <strong>See a coach</strong> for hands-on technique work, drills tailored to your body, and
              anything data cannot observe.
            </li>
            <li>
              <strong>See a medical professional</strong> for any pain, injury, or health concern — nothing
              here is medical or injury advice.
            </li>
          </ul>
        </AuthoritySection>

        <AuthoritySection id="retests" title="How retesting improves confidence">
          <p>
            The single best way to raise accuracy is to retest. Each recommendation comes with a retest
            protocol; when your follow-up numbers move toward the target window, the finding is confirmed and
            future recommendations get sharper. <ClaimStatusBadge claimId="retest-informed" /> Consistency plus
            confirmation is how a likely pattern becomes a trusted one.
          </p>
        </AuthoritySection>

        <AuthorityCTA
          slug={SLUG}
          title="See your confidence labels in action"
          body="Run a free analysis and watch how confidence rises as you add sessions and retests."
          trustHref="/methodology"
          trustLabel="Read the methodology"
        />

        <AuthorityFAQ items={FAQS} slug={SLUG} />

        <NotCoachReplacementNotice className="mt-10" />

        <RelatedLinks
          from={SLUG}
          title="Related concepts & pages"
          links={[
            { href: '/trust', label: 'Trust & Safety', description: 'Privacy, data, AI honesty, youth safety.' },
            { href: '/methodology', label: 'Our methodology', description: 'Measured vs. estimated, in full.' },
            { href: '/deterministic-intelligence', label: 'Deterministic intelligence', description: 'Why the engine is repeatable.' },
            { href: '/resources/ai-in-sports-performance', label: 'AI in sports performance', description: 'What AI here does and does not do.' },
            { href: '/privacy', label: 'Privacy policy', description: 'How your data is handled.' },
            { href: '/glossary', label: 'Glossary', description: 'Confidence, evidence labels, retest and more.' },
          ]}
        />
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
