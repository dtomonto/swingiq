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

const SLUG = 'how-to-read-your-swing-report';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const PARTS = [
  { title: 'Your top fix', body: 'The headline: the single change most likely to help your results right now. Start here, not with the metrics.' },
  { title: 'The evidence', body: 'Why the engine flagged it — the data points behind the call and whether they were measured or estimated.' },
  { title: 'Confidence label', body: 'How strongly to trust the finding, in plain English, so you know how much to commit.' },
  { title: 'Matched drills', body: 'A short set of drills chosen for your sport, level, and the specific fix.' },
  { title: 'Practice plan', body: 'An ordered, do-this-next plan — “one plan” you can actually run between sessions.' },
  { title: 'Retest', body: 'The way to prove it worked: record again later and compare to your baseline.' },
];

export default function HowToReadYourSwingReportPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Using SwingVantage</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Get your report', primary: true },
              { href: '/sample-report', label: 'See a sample report' },
            ]}
          />
        </header>

        <EduSection id="parts" eyebrow="What’s in it" title="The parts of your report">
          <p>
            Your report is built to be read top-down. The headline fix is where to start — everything below it
            explains and supports that one decision.
          </p>
          <EduCardGrid>
            {PARTS.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="onefix" eyebrow="Why one fix" title="One fix beats ten">
          <p>
            A report could list everything imperfect about your swing — and overwhelm you into doing nothing.
            Instead, SwingVantage leads with your single next-best action, powered by a{' '}
            <EducationalLink term="heuristic-data">structured</EducationalLink> read and{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink>. One fix, one plan, one retest keeps
            practice focused and progress measurable.
          </p>
        </EduSection>

        <EduSection id="trust" eyebrow="Read the labels" title="Use the confidence labels">
          <p>
            Before you commit practice time, glance at the confidence on a finding. High confidence? Go all in.
            Lower confidence? Add a clearer video or another session first. The{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">
              measured-vs-estimated label
            </Link>{' '}
            tells you exactly how much weight a read has earned.
          </p>
        </EduSection>

        <EduSection id="after" eyebrow="Then act" title="What to do next">
          <p>
            Run the practice plan for your top fix, then record a{' '}
            <Link href="/learn/how-retesting-improves-swing-feedback" className="font-medium text-primary hover:underline">
              retest
            </Link>{' '}
            under similar conditions. Comparing it to your baseline confirms whether the change worked — so you
            improve on evidence, not guesswork.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Read your own report">
          <CtaRow
            items={[
              { href: '/start', label: 'Get your report', primary: true },
              { href: '/sample-report', label: 'See a sample report' },
              { href: '/learn/how-retesting-improves-swing-feedback', label: 'How retesting works' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-ai-swing-analysis-works" className="text-primary hover:underline">
            How AI Swing Analysis Works
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">
            Measured vs Estimated Data
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
