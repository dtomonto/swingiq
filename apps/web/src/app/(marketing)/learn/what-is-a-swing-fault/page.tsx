import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
import { EducationalLink } from '@/components/learn/EducationalLink';
import {
  AnswerLead,
  FaqSection,
  EduSection,
  EduCard,
  EduCardGrid,
  TrustCallout,
  CtaRow,
} from '@/components/learn/education-ui';
import {
  getTechEducationArticle,
  techEducationCrumbs,
  buildTechEducationMetadata,
  buildTechEducationGraph,
} from '@/lib/learn/tech-education';
import { technologyClaims } from '@/content/technologyClaims';

const SLUG = 'what-is-a-swing-fault';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const EXAMPLES = [
  { title: 'Early extension', body: 'Hips push toward the ball through impact in a golf swing, costing posture and consistency.' },
  { title: 'Over the top', body: 'The club drops outside the ideal path on the downswing, a frequent source of slices.' },
  { title: 'Casting', body: 'Stored angle is released too early — common in golf and in bat swings that lose speed.' },
  { title: 'Weak unit turn', body: 'A limited shoulder-and-hip coil in a tennis or racket stroke that saps power.' },
];

const PIPELINE = [
  { title: '1. Detect the pattern', body: 'Your video and inputs are matched to recognizable fault patterns for your sport.' },
  { title: '2. Explain it honestly', body: 'Each fault gets a plain-language cause, the evidence behind it, and a confidence label.' },
  { title: '3. Rank by impact', body: 'Faults are prioritized by what limits you most and is realistic at your level.' },
  { title: '4. Turn it into a fix', body: 'The top fault becomes matched drills, a short plan, and clear retest criteria.' },
];

export default function WhatIsASwingFaultPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Technology</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Find your top fault', primary: true },
              { href: '/learn/data-points', label: 'Browse swing data points' },
            ]}
          />
        </header>

        <EduSection id="definition" eyebrow="The foundational concept" title="A fault is a fixable pattern, not a verdict">
          <p>
            A swing fault is a specific, recognizable flaw in your motion — something concrete you can name and
            work on, not a vague feeling that a swing looks off. SwingVantage carries a curated library of common
            faults across its sports, and resolves new ones it detects into the same honest explanation format,
            so every fault comes with a cause, evidence, and a confidence label rather than a bare label.
          </p>
          <EduCardGrid>
            {EXAMPLES.map((e) => (
              <EduCard key={e.title} title={e.title}>
                {e.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="pipeline" eyebrow="From pattern to plan" title="How a fault becomes a fix">
          <p>
            Detecting a fault is only useful if it leads somewhere. SwingVantage uses{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink> and sport-specific rules to take each fault
            from detection to a concrete, provable change:
          </p>
          <EduCardGrid>
            {PIPELINE.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="one" eyebrow="Not everything at once" title="Why one fault leads the list">
          <p>
            Most swings have several faults at any time. Trying to fix them all at once stalls progress, so
            SwingVantage ranks them and puts the single highest-impact one first — your next-best action. The
            others wait their turn. Each finding shows whether it was measured or estimated, explained in{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">
              Measured vs Estimated
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See your faults, ranked and explained">
          <CtaRow
            items={[
              { href: '/start', label: 'Find your top fault', primary: true },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
              { href: '/learn/data-points', label: 'Swing data points' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/data-points" className="text-primary hover:underline">
            Swing Data Points
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">
            Measured vs Estimated
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">
            All learn guides <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </main>
  );
}
