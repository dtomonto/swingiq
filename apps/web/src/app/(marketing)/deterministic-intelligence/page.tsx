import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import {
  buildGraph,
  articleSchema,
  faqPageSchema,
  softwareApplicationSchema,
  breadcrumbListSchema,
} from '@/lib/seo/jsonLd';
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
  TableOfContents,
} from '@/components/authority';

const SLUG = '/deterministic-intelligence';

export const metadata = buildMetadata({
  title: 'Deterministic Intelligence — How SwingVantage Analyzes Your Swing',
  description:
    'Deterministic intelligence is rules-based analysis that returns the same answer from the same inputs. See how SwingVantage runs heuristics first and AI only when needed.',
  path: SLUG,
  ogType: 'article',
});

const FAQS = [
  {
    question: 'What is deterministic intelligence in simple terms?',
    answer:
      'A system that follows explicit, written rules, so the same inputs always produce the same output. SwingVantage maps your shot data and symptoms against sport-specific rule windows to surface the most likely pattern — you can trace exactly why it reached its conclusion.',
  },
  {
    question: 'Is this just an AI chatbot for swings?',
    answer:
      'No. A general chatbot generates plausible-sounding text that can change run to run. SwingVantage leads with a deterministic rules engine that is repeatable and inspectable, then uses AI selectively — for premium narrative coaching or deeper review of sampled video frames — never as the sole source of a diagnosis.',
  },
  {
    question: 'Does deterministic mean it is always right?',
    answer:
      'No. Deterministic means consistent, not certain. Swing analysis from a single camera or a small sample carries real uncertainty, so every finding is an estimate with a confidence label, not a lab measurement. Consistency reduces randomness; it does not remove uncertainty.',
  },
  {
    question: 'Where does AI actually get used?',
    answer:
      'AI is used when needed: optional qualitative review of a few downscaled video still-frames, and premium narrative coaching that turns the deterministic findings into plain-English guidance. The structured diagnosis and its confidence come from the rules engine first.',
  },
  {
    question: 'How does retesting fit in?',
    answer:
      'Each rule defines a retest protocol — how many shots, which metrics, and what counts as success. When you retest, the new data updates your profile and informs future recommendations, so the system gets more confident about you specifically over time.',
  },
];

const TOC = [
  { id: 'what', label: 'What deterministic intelligence means' },
  { id: 'heuristic', label: 'What heuristic analysis means' },
  { id: 'why', label: 'Why it matters for sports' },
  { id: 'how', label: 'How the inputs work together' },
  { id: 'hybrid', label: 'Heuristics first, AI when needed' },
  { id: 'vs-chatbot', label: 'How it differs from an AI chatbot' },
  { id: 'benefits', label: 'Benefits and limits' },
  { id: 'honesty', label: 'How it avoids overclaiming' },
];

export default function DeterministicIntelligencePage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'Deterministic Intelligence — How SwingVantage Analyzes Your Swing',
      description:
        'Deterministic intelligence is rules-based analysis that returns the same answer from the same inputs. SwingVantage runs heuristics first and AI only when needed, with confidence labels and a retest loop.',
      path: SLUG,
      dateModified: '2026-06-13',
    }),
    softwareApplicationSchema(),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Deterministic Intelligence', path: SLUG },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <AuthorityPageView event={ANALYTICS_EVENTS.AUTHORITY_PAGE_VIEWED} slug={SLUG} category="engine" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Deterministic Intelligence', path: SLUG },
          ]}
          className="mb-5"
        />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Deterministic Intelligence
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            Rules-based swing intelligence you can actually trace
          </h1>
          <EditorialMeta className="mt-3" lastReviewed="June 13, 2026" readingTime="8 min read" />
        </header>

        <AnswerBlock answer="Deterministic intelligence means analysis that follows explicit, written rules — so the same inputs always produce the same answer, and you can see exactly why.">
          <p>
            SwingVantage leads with a deterministic, rules-based diagnostic engine, then adds AI only
            when it earns its keep. The result is a single priority fix, a practice plan, and a
            confidence label on every finding — built for explainability and repeatability, not hype.{' '}
            <ClaimStatusBadge claimId="deterministic-engine" />
          </p>
        </AnswerBlock>

        <TableOfContents items={TOC} />

        <AuthoritySection
          id="what"
          title="What deterministic intelligence means"
          intro="Same inputs in, same answer out — every time."
        >
          <p>
            A <strong>deterministic</strong> system produces the same output for the same input. There is
            no randomness in the decision: your shot data and symptoms are checked against sport-specific
            rule windows (for example, the face-to-path and start-line numbers that define a slice), and
            the rule that fits best becomes your primary finding. Because the logic is written down, the
            result is <strong>repeatable</strong> and <strong>inspectable</strong> — you can trace the path
            from your numbers to the conclusion.
          </p>
          <p>
            That is the opposite of a generative model that can phrase the same situation three different
            ways on three different runs. Deterministic does not mean rigid or simplistic; it means the
            reasoning is stable and auditable.
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="heuristic"
          title="What heuristic analysis means"
          intro="Expert rules of thumb, encoded so they run instantly and consistently."
        >
          <p>
            A <strong>heuristic</strong> is a practical rule of thumb that experienced coaches use to read a
            pattern quickly: &ldquo;a ball that starts right and curves further right is usually an
            open-face, out-to-in pattern.&rdquo; SwingVantage encodes a library of these rules per sport so
            they run in milliseconds, every time, without a model call. Heuristics are not random guessing —
            they are structured, evidence-informed interpretations with known trigger conditions.
          </p>
          <p>
            Want the deep dive?{' '}
            <Link href="/resources/what-is-heuristic-data" className="text-primary hover:underline">
              What is heuristic data?
            </Link>
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="why"
          title="Why deterministic systems are valuable for sports improvement"
        >
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Explainability.</strong> You see the rule and the data behind every recommendation —
              trust comes from transparency, not from &ldquo;the AI said so.&rdquo;
            </li>
            <li>
              <strong>Repeatability.</strong> Two athletes with the same pattern get the same read, and your
              own report does not change just because you opened it again.
            </li>
            <li>
              <strong>Speed and cost.</strong> Rules run instantly and free, so you get feedback without
              waiting on — or paying for — a model on every request.
            </li>
            <li>
              <strong>Controlled recommendations.</strong> The system can only suggest what its rules and
              drill library support, so it cannot wander into invented or unsafe advice.
            </li>
          </ul>
        </AuthoritySection>

        <AuthoritySection
          id="how"
          title="How the inputs work together"
          intro="One model of you, assembled from the signals you actually have."
        >
          <p>SwingVantage combines, in priority order:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li><strong>Sport context</strong> — the rule set and target windows for your sport and club/stroke.</li>
            <li><strong>Player profile</strong> — level, goals, and equipment that shift what &ldquo;good&rdquo; looks like.</li>
            <li><strong>Symptoms</strong> — the miss or problem you describe, which narrows the candidate patterns.</li>
            <li><strong>Session history</strong> — multiple sessions turn a one-day result into a confirmed pattern.</li>
            <li><strong>Video signals</strong> — where available, optional AI review of sampled still-frames adds qualitative cues.</li>
            <li><strong>Retest outcomes</strong> — what actually changed after you practiced, fed back into your profile.</li>
          </ul>
          <p>
            The engine weighs these into one prioritized diagnosis with a confidence score, then ranks
            recommendations so you get <strong>one fix</strong> — not twenty. See the full{' '}
            <Link href="/methodology" className="text-primary hover:underline">methodology</Link>.
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="hybrid"
          title="Why SwingVantage uses “heuristics first, AI when needed”"
        >
          <p>
            More model calls do not automatically make better coaching. SwingVantage uses a deterministic
            heuristic estimate as the dependable floor for every analysis, and routes to AI only when it
            adds real value — qualitative review of sampled video frames, or premium narrative coaching that
            turns the structured findings into plain-English guidance.{' '}
            <ClaimStatusBadge claimId="heuristics-first" />
          </p>
          <p>
            If an AI provider is unavailable or a budget is reached, the deterministic engine still returns a
            complete, confidence-labeled result. The lights never go out.
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="vs-chatbot"
          title="How it differs from a generic AI chatbot"
        >
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-2 divide-x divide-border text-sm">
              <div className="p-4">
                <p className="font-semibold text-foreground">Generic AI chatbot</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>Generates text; can vary run to run</li>
                  <li>Reasoning is hidden</li>
                  <li>Can over-claim certainty</li>
                  <li>Costs a model call every time</li>
                </ul>
              </div>
              <div className="p-4">
                <p className="font-semibold text-foreground">SwingVantage</p>
                <ul className="mt-2 space-y-1.5 text-foreground/90">
                  <li>Rules engine; same input → same answer</li>
                  <li>Traceable from data to finding</li>
                  <li>Confidence-labeled estimates</li>
                  <li>Free, instant heuristics first</li>
                </ul>
              </div>
            </div>
          </div>
        </AuthoritySection>

        <AuthoritySection id="benefits" title="What it can — and cannot — do">
          <TwoColumnList
            left={{
              title: 'What it does well',
              tone: 'positive',
              items: [
                'Surface the single highest-leverage pattern to work on',
                'Explain the evidence and confidence behind it',
                'Give the same read for the same inputs, repeatably',
                'Return a result instantly, free, and offline-friendly',
              ],
            }}
            right={{
              title: 'What it does not do',
              tone: 'caution',
              items: [
                'Guarantee a score, distance, or performance outcome',
                'Replace a qualified coach or medical professional',
                'Measure biomechanics frame-by-frame from one phone camera',
                'Turn a small, noisy sample into a certainty',
              ],
            }}
          />
        </AuthoritySection>

        <AuthoritySection
          id="honesty"
          title="How confidence, evidence labels, and retests reduce overclaiming"
        >
          <p>
            Three mechanisms keep the system honest:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Confidence labels</strong> scale with how much data you gave and how consistently the
              pattern repeats — low sample, low confidence.{' '}
              <ClaimStatusBadge claimId="confidence-scoring" />
            </li>
            <li>
              <strong>Evidence labels</strong> separate what was <em>measured</em> from what was{' '}
              <em>estimated</em>, so nothing is dressed up as a lab number.
            </li>
            <li>
              <strong>Retest loops</strong> confirm whether the fix actually moved the metric before the
              system gets more confident about you.
            </li>
          </ul>
          <p>
            Read the full picture on{' '}
            <Link href="/trust/accuracy-and-limitations" className="text-primary hover:underline">
              accuracy &amp; limitations
            </Link>
            .
          </p>
        </AuthoritySection>

        <AuthorityCTA slug={SLUG} />

        <AuthorityFAQ items={FAQS} slug={SLUG} />

        <NotCoachReplacementNotice className="mt-10" />

        <RelatedLinks
          from={SLUG}
          title="Related concepts & pages"
          links={[
            {
              href: '/resources/what-is-heuristic-data',
              label: 'What is heuristic data?',
              description: 'How rules-of-thumb become fast, repeatable athlete guidance.',
            },
            {
              href: '/resources/ai-in-sports-performance',
              label: 'AI in sports performance',
              description: 'Where AI helps — and where structured logic should lead.',
            },
            {
              href: '/methodology',
              label: 'Our methodology',
              description: 'The full loop: profile → diagnosis → one fix → retest.',
            },
            {
              href: '/trust/accuracy-and-limitations',
              label: 'Accuracy & limitations',
              description: 'What we can help with, and what we never guarantee.',
            },
            {
              href: '/glossary',
              label: 'Glossary',
              description: 'Plain-English definitions for every term we use.',
            },
            {
              href: '/athlete-general-intelligence',
              label: 'Athlete General Intelligence',
              description: 'One reasoning engine across all of your sports.',
            },
          ]}
        />
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
