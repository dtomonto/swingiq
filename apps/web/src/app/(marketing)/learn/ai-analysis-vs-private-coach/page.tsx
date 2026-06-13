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

const SLUG = 'ai-analysis-vs-private-coach';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  {
    dimension: 'Cost',
    heuristic: 'One lesson often costs more than months of app analysis.',
    ai: 'Low and predictable — starts free, no booking.',
  },
  {
    dimension: 'Availability',
    heuristic: 'Limited to a coach’s schedule and your travel.',
    ai: 'Any time, from your phone, as often as you like.',
  },
  {
    dimension: 'Feedback style',
    heuristic: 'Structured, repeatable reads with confidence labels.',
    ai: 'Hands-on, in the moment, adjusted to what they see.',
  },
  {
    dimension: 'Accountability',
    heuristic: 'You drive the practice plan and retests.',
    ai: 'A coach holds you to it week to week.',
  },
  {
    dimension: 'Best for',
    heuristic: 'Fast triage and between-lesson direction.',
    ai: 'Deep correction, feel, and personal relationship.',
  },
];

export default function AiAnalysisVsPrivateCoachPage() {
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
              { href: '/start', label: 'Try a free analysis', primary: true },
              { href: '/learn/does-ai-replace-a-coach', label: 'Does AI replace a coach?' },
            ]}
          />
        </header>

        <EduSection id="economics" eyebrow="The honest cost picture" title="What each one actually costs">
          <p>
            A single in-person lesson often costs more than months of app-based{' '}
            <EducationalLink term="ai-sports">AI analysis</EducationalLink>. That is not a knock on coaching —
            a good coach is worth it — but it changes how you should use each. AI gives you a low-cost,
            repeatable read you can run before you ever book; a coach gives you the deep, human correction that
            is hard to get any other way.
          </p>
        </EduSection>

        <EduSection id="compare" eyebrow="Side by side" title="AI analysis vs a private coach">
          <ComparisonTable
            caption="AI swing analysis versus a private coach across cost, availability, feedback style, accountability, and best use."
            rows={ROWS}
            leftLabel="AI Analysis"
            rightLabel="Private Coach"
          />
        </EduSection>

        <EduSection id="together" eyebrow="Better together" title="How to use both for more value">
          <EduCardGrid>
            <EduCard title="Diagnose between lessons">
              Run an AI check between sessions so you arrive at your lesson knowing your top fix already.
            </EduCard>
            <EduCard title="Spend lesson time on correction">
              Less time on basic diagnosis means more of your paid time goes to real, hands-on coaching.
            </EduCard>
            <EduCard title="Bring a retest history">
              Show your coach what changed since last time so they can adjust the plan with real evidence.
            </EduCard>
            <EduCard title="Stay on track at home">
              A short, AI-built practice plan keeps you working the right thing between visits.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Keep going" title="Decide what fits your goals">
          <CtaRow
            items={[
              { href: '/start', label: 'Try a free analysis', primary: true },
              { href: '/learn/is-ai-swing-analysis-worth-it', label: 'Is it worth it?' },
              { href: '/pricing', label: 'See pricing' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/does-ai-replace-a-coach" className="text-primary hover:underline">
            Does AI Replace a Coach?
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-worth-it" className="text-primary hover:underline">
            Is AI Swing Analysis Worth It?
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
