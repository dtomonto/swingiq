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
  ComparisonTable,
  TrustCallout,
  CtaRow,
  type ComparisonRow,
} from '@/components/learn/education-ui';
import {
  getTechEducationArticle,
  techEducationCrumbs,
  buildTechEducationMetadata,
  buildTechEducationGraph,
} from '@/lib/learn/tech-education';
import { technologyClaims } from '@/content/technologyClaims';

const SLUG = 'ai-analysis-vs-launch-monitors';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  {
    dimension: 'What it captures',
    heuristic: 'Body movement, sequencing, and likely faults.',
    ai: 'Ball and club outputs: speed, spin, launch, path.',
  },
  {
    dimension: 'How',
    heuristic: 'Estimated from ordinary phone video.',
    ai: 'Measured by dedicated sensor hardware.',
  },
  {
    dimension: 'Question it answers',
    heuristic: '“Why did that happen and what do I fix?”',
    ai: '“Exactly what did the ball and club do?”',
  },
  {
    dimension: 'Cost & access',
    heuristic: 'Low — runs on a phone you already own.',
    ai: 'Higher — dedicated device or a bay to rent.',
  },
  {
    dimension: 'Honesty label',
    heuristic: 'Reads are labeled estimated, not measured.',
    ai: 'Numbers are sensor-measured.',
  },
];

export default function AiAnalysisVsLaunchMonitorsPage() {
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
              { href: '/start', label: 'Analyze your swing', primary: true },
              { href: '/learn/measured-vs-estimated', label: 'Measured vs estimated' },
            ]}
          />
        </header>

        <EduSection id="different-jobs" eyebrow="Two different jobs" title="Outputs vs the motion that made them">
          <p>
            A launch monitor and <EducationalLink term="ai-sports">AI swing analysis</EducationalLink> are not
            competitors so much as different instruments. A launch monitor measures what the ball and club did
            with sensor precision. AI video analysis estimates the body movement that produced that result and
            points you to the one fix most likely to help. One tells you the score; the other tells you why.
          </p>
        </EduSection>

        <EduSection id="compare" eyebrow="Side by side" title="Launch monitor vs AI analysis">
          <ComparisonTable
            caption="AI swing analysis versus a launch monitor across what each captures, how, the question it answers, cost, and honesty labeling."
            rows={ROWS}
            leftLabel="AI Analysis"
            rightLabel="Launch Monitor"
          />
        </EduSection>

        <EduSection id="honesty" eyebrow="No fabricated precision" title="Measured numbers stay measured">
          <p>
            SwingVantage will not dress up a video estimate as a sensor reading. Movement reads from phone
            video carry an estimated label; if you import real launch-monitor numbers, they keep their measured
            label so the two are never blended into one false figure. The deeper breakdown of those labels is in{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">
              Measured vs Estimated
            </Link>
            .
          </p>
        </EduSection>

        <EduSection id="do-you-need" eyebrow="The practical answer" title="Do you actually need one?">
          <EduCardGrid>
            <EduCard title="If you want raw numbers">
              A launch monitor is the right tool — nothing estimates ball speed or spin as precisely.
            </EduCard>
            <EduCard title="If you want to know what to fix">
              AI movement analysis turns a phone clip into a prioritized change you can practice today.
            </EduCard>
            <EduCard title="If you have both">
              Import your numbers as extra signals so the analysis reasons over measured output and motion.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See what your video reveals">
          <CtaRow
            items={[
              { href: '/start', label: 'Analyze your swing', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'How accurate is it?' },
              { href: '/learn/how-to-film-your-swing', label: 'How to film your swing' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">
            Measured vs Estimated
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">
            Is AI Swing Analysis Accurate?
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
