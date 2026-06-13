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
  ClaimStatusBadge,
  AuthorityPageView,
  EditorialMeta,
} from '@/components/authority';

const SLUG = '/resources/ai-in-sports-performance';

export const metadata = buildMetadata({
  title: 'AI in Sports Performance: What It Can and Cannot Do',
  description:
    'How AI supports sports improvement without replacing structured coaching logic — and why organizing the right data beats simply collecting more of it.',
  path: SLUG,
  ogType: 'article',
});

const FAQS = [
  {
    question: 'Does AI replace a coach?',
    answer:
      'No. AI can speed up pattern-spotting and turn structured findings into readable guidance, but it does not replace a qualified coach who can see context, adjust in person, and build a relationship. SwingVantage is a practice aid, not a coach replacement.',
  },
  {
    question: 'Is more data always better?',
    answer:
      'No. Collecting more numbers without interpretation often adds noise, not insight. What changes an athlete is organizing the right data, interpreting it in context, and converting it into one clear next action.',
  },
  {
    question: 'What is the difference between AI analysis and pose estimation?',
    answer:
      'Pose estimation tracks body landmarks frame-by-frame to measure joint positions — a specific computer-vision technique. AI analysis is broader and can be qualitative. SwingVantage’s optional AI video feature reviews a few sampled still-frames qualitatively; it is not frame-by-frame biomechanical measurement.',
  },
  {
    question: 'How does SwingVantage use AI responsibly?',
    answer:
      'Deterministic rules lead; AI is used selectively for sampled-frame review and premium narrative coaching. Findings carry confidence and evidence labels, the product is local-first by default, and youth-athlete and privacy considerations come first.',
  },
];

export default function AiInSportsPerformancePage() {
  const jsonLd = buildGraph(
    articleSchema({
      headline: 'AI in Sports Performance: What It Can and Cannot Do',
      description:
        'How AI supports — but should not replace — structured coaching logic, and why organizing and interpreting the right data beats collecting more of it.',
      path: SLUG,
      dateModified: '2026-06-13',
    }),
    breadcrumbListSchema([
      { name: 'Home', path: '/' },
      { name: 'Resources', path: '/resources' },
      { name: 'AI in sports performance', path: SLUG },
    ]),
    faqPageSchema(FAQS),
  );

  return (
    <main className="min-h-screen bg-card">
      <AuthorityPageView event={ANALYTICS_EVENTS.RESOURCE_ARTICLE_VIEWED} slug={SLUG} category="ai-in-sports" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs
          items={[
            { name: 'Home', path: '/' },
            { name: 'Resources', path: '/resources' },
            { name: 'AI in sports performance', path: SLUG },
          ]}
          className="mb-5"
        />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">AI in Sports</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">
            AI in sports performance: what it can and cannot do
          </h1>
          <EditorialMeta className="mt-3" lastReviewed="June 13, 2026" readingTime="7 min read" />
        </header>

        <AnswerBlock answer="AI can support athlete improvement — spotting patterns and turning findings into plain-English guidance — but it works best on top of structured, rules-based logic, not as a replacement for it.">
          <p className="font-medium text-foreground">
            The future of sports improvement is not just collecting more data. It is organizing the right
            data, interpreting it in context, and converting it into a simple next action the athlete can
            actually use.
          </p>
        </AnswerBlock>

        <AuthoritySection id="what" title="What “AI” means in sports performance">
          <p>
            &ldquo;AI&rdquo; covers a wide range of tools: large language models that summarize and explain,
            computer-vision models that detect objects or body landmarks, and statistical models that find
            patterns. In practice, the useful question is not &ldquo;is there AI?&rdquo; but &ldquo;does this
            convert your data into a clear, trustworthy next step?&rdquo;
          </p>
        </AuthoritySection>

        <AuthoritySection id="support" title="How AI should support — not replace — coaching logic">
          <p>
            Structured logic is what makes a recommendation explainable and repeatable. SwingVantage leads
            with a deterministic rules engine and uses AI selectively on top of it.{' '}
            <ClaimStatusBadge claimId="heuristics-first" /> AI is excellent at language and qualitative review;
            it is weaker at being consistent and auditable. Letting rules set the diagnosis and AI handle the
            explanation plays to each one&rsquo;s strengths.
          </p>
        </AuthoritySection>

        <AuthoritySection
          id="terms"
          title="AI analysis, deterministic rules, computer vision, and pose estimation"
        >
          <div className="space-y-3">
            {[
              { t: 'Deterministic rules', d: 'Explicit if-then logic with target windows. Same input → same output; fully traceable.' },
              { t: 'AI analysis (LLM)', d: 'Flexible reasoning and natural-language explanation. Powerful but variable run to run, so used for narrative, not the core diagnosis.' },
              { t: 'Computer vision', d: 'Models that interpret images/video — detecting objects, regions, or motion. A capability, not a guarantee of accuracy on a phone clip.' },
              { t: 'Pose estimation', d: 'A specific computer-vision technique that tracks body landmarks frame-by-frame. SwingVantage does NOT do real-time pose capture; its optional AI video review is qualitative still-frame analysis.' },
            ].map((row) => (
              <div key={row.t} className="rounded-xl border border-border bg-card p-4">
                <p className="font-semibold text-foreground">{row.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{row.d}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <ClaimStatusBadge claimId="ai-vision-frames" /> &nbsp;Our optional AI video feature is qualitative
            frame review, not biomechanical measurement.
          </p>
        </AuthoritySection>

        <AuthoritySection id="more-data" title="Why more data does not automatically help">
          <p>
            A bigger pile of numbers is not insight. Without interpretation and prioritization, more data
            increases noise, decision fatigue, and false confidence. Athletes do not need twenty metrics and
            twenty tips — they need to know <strong>the one thing</strong> to work on next, why, and how to
            check it worked. That requires context, ranking, drills, and retests — the work that happens{' '}
            <em>after</em> data collection.
          </p>
        </AuthoritySection>

        <AuthoritySection id="combine" title="How SwingVantage combines structure with selective AI">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Deterministic rules produce the diagnosis and its confidence.</li>
            <li>Session history and your profile sharpen the read.</li>
            <li>Optional AI reviews sampled video frames for qualitative cues.</li>
            <li>Premium narrative AI turns findings into plain-English coaching.</li>
            <li>Retests confirm the fix before the system grows more confident.</li>
          </ul>
          <p>
            See the{' '}
            <Link href="/methodology" className="text-primary hover:underline">methodology</Link> for the full
            loop, or{' '}
            <Link href="/deterministic-intelligence" className="text-primary hover:underline">
              deterministic intelligence
            </Link>{' '}
            for why rules lead.
          </p>
        </AuthoritySection>

        <AuthoritySection id="responsible" title="Privacy, youth athletes, and responsible use">
          <p>
            Tools that touch young athletes and personal video carry real responsibility. SwingVantage is
            local-first by default — your data stays in your browser and the original video never leaves your
            device; only downscaled frames are sent if you opt into AI vision.{' '}
            <ClaimStatusBadge claimId="local-first-privacy" /> Nothing here is medical or injury advice, and
            youth use should involve a parent or guardian. More on the{' '}
            <Link href="/trust" className="text-primary hover:underline">trust &amp; safety</Link> page.
          </p>
        </AuthoritySection>

        <AuthoritySection id="future" title="The future of recreational sports improvement">
          <p>
            As capture gets easier — phones, affordable launch monitors, wearables — the bottleneck shifts
            from <em>getting</em> data to <em>using</em> it. The winners will be systems that organize the
            right signals, interpret them in context, label their confidence honestly, and hand the athlete
            one clear action. That is the bet SwingVantage is built on.
          </p>
        </AuthoritySection>

        <AuthorityCTA slug={SLUG} />

        <AuthorityFAQ items={FAQS} slug={SLUG} />

        <NotCoachReplacementNotice className="mt-10" />

        <RelatedLinks
          from={SLUG}
          title="Related concepts & pages"
          links={[
            { href: '/deterministic-intelligence', label: 'Deterministic intelligence', description: 'Why rules lead and AI supports.' },
            { href: '/resources/what-is-heuristic-data', label: 'What is heuristic data?', description: 'The fast, repeatable first pass.' },
            { href: '/methodology', label: 'Our methodology', description: 'Profile → diagnosis → one fix → retest.' },
            { href: '/trust/accuracy-and-limitations', label: 'Accuracy & limitations', description: 'What AI here can and cannot promise.' },
            { href: '/athlete-general-intelligence', label: 'Athlete General Intelligence', description: 'Reasoning across all of your sports.' },
            { href: '/glossary', label: 'Glossary', description: 'Computer vision, pose estimation, confidence and more.' },
          ]}
        />
      </div>

      <JsonLd data={jsonLd} />
    </main>
  );
}
