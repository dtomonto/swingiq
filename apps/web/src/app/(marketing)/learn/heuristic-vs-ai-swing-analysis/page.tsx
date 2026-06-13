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

const SLUG = 'heuristic-vs-ai-swing-analysis';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  {
    dimension: 'How it works',
    heuristic: 'Applies proven, sport-specific rules to your inputs.',
    ai: 'Studies your video and richer signals for patterns.',
  },
  {
    dimension: 'Speed',
    heuristic: 'Near-instant.',
    ai: 'Takes longer to process video and context.',
  },
  {
    dimension: 'Cost',
    heuristic: 'Very low — powers free and instant estimates.',
    ai: 'Higher — used where depth genuinely helps.',
  },
  {
    dimension: 'Explainability',
    heuristic: 'Transparent — you can see the rule behind a read.',
    ai: 'Deeper, but reasoning is harder to fully inspect.',
  },
  {
    dimension: 'Best for',
    heuristic: 'Common misses, first-pass triage, quick wins.',
    ai: 'Subtle or unusual movement, fine detail.',
  },
  {
    dimension: 'In SwingVantage',
    heuristic: 'Leads every analysis and is the safety net.',
    ai: 'Adds depth and sharpens confidence over time.',
  },
];

export default function HeuristicVsAiSwingAnalysisPage() {
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
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/learn/what-is-heuristic-data', label: 'What is heuristic data?' },
            ]}
          />
        </header>

        <EduSection id="heuristic" eyebrow="The fast first pass" title="What heuristic swing analysis is">
          <p>
            <EducationalLink term="heuristic-data">Heuristic analysis</EducationalLink> applies transparent,
            sport-specific rules to what it already knows about you — your sport, skill level, swing miss,
            ball flight, and history — to produce a fast, auditable estimate of your most likely next-best
            action. It is the kind of quick, experienced read a coach gives before they study the tape.
          </p>
          <p>{technologyClaims.heuristicIntelligence.full}</p>
        </EduSection>

        <EduSection id="ai" eyebrow="The depth layer" title="What AI swing analysis is">
          <p>
            <EducationalLink term="ai-sports">AI analysis</EducationalLink> studies your actual video and
            richer signals to surface nuanced movement patterns that fixed rules would miss. It is slower and
            more costly, but it adds depth — and it gets more useful as your profile, sessions, and retests
            accumulate.
          </p>
        </EduSection>

        <EduSection id="compare" eyebrow="Side by side" title="Heuristic vs AI: a direct comparison">
          <ComparisonTable
            caption="Heuristic swing analysis versus AI swing analysis across how it works, speed, cost, explainability, best use, and role in SwingVantage."
            rows={ROWS}
            leftLabel="Heuristic"
            rightLabel="AI"
          />
        </EduSection>

        <EduSection id="together" eyebrow="Better together" title="How SwingVantage combines them">
          <EduCardGrid>
            <EduCard title="Heuristics lead">
              Every analysis starts with a fast, structured read so you are never blocked waiting on AI.
            </EduCard>
            <EduCard title="AI adds depth">
              Deeper tiers layer in video analysis where the extra nuance genuinely improves the answer.
            </EduCard>
            <EduCard title="One recommendation">
              The two are reconciled into a single prioritized next-best action — not two competing reports.
            </EduCard>
            <EduCard title="Honest confidence">
              Every finding shows its basis (measured vs estimated) and a confidence level you can trust.
            </EduCard>
            <EduCard title="Retests confirm it">
              Session history and retests then verify whether the change actually worked.
            </EduCard>
            <EduCard title="You stay in control">
              Transparent logic plus labeled confidence means you always know how much weight to give a read.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Keep going" title="See it on your own swing">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/learn/how-retesting-improves-swing-feedback', label: 'How retesting improves feedback' },
              { href: '/athlete-general-intelligence', label: 'Athlete General Intelligence' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-heuristic-data" className="text-primary hover:underline">
            What Is Heuristic Data?
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/ai-in-sports-performance" className="text-primary hover:underline">
            AI in Sports Performance
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
