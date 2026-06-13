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

const SLUG = 'how-ai-swing-analysis-works';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const STEPS = [
  { title: '1. Capture the signals', body: 'Your video, sport, level, goals, and any imported launch-monitor data become structured signals the engine can reason over.' },
  { title: '2. Detect likely faults', body: 'Sport-specific rules and AI read setup, path, sequencing, balance, and ball-flight consequences to find what is probably going wrong.' },
  { title: '3. Rank the one fix', body: 'It prioritizes the fault limiting your results the most and realistic for your level — your single next-best action.' },
  { title: '4. Label confidence', body: 'Each finding is tagged measured or estimated with a confidence level and the data points behind it.' },
  { title: '5. Build the plan', body: 'The fix becomes matched drills and a short, ordered practice plan you can actually run.' },
  { title: '6. Confirm with a retest', body: 'A later retest is compared to your baseline to prove the change worked — or to adjust the plan.' },
];

export default function HowAiSwingAnalysisWorksPage() {
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
              { href: '/start', label: 'Run your analysis', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'How accurate is it?' },
            ]}
          />
        </header>

        <EduSection id="pipeline" eyebrow="Under the hood" title="From a phone clip to your next move">
          <p>
            AI swing analysis is not magic — it is a pipeline. SwingVantage turns what you give it into
            structured signals, reasons over them with a mix of{' '}
            <EducationalLink term="heuristic-data">rules-based logic</EducationalLink> and{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink>, and resolves everything into one clear
            recommendation. Here is each stage:
          </p>
          <EduCardGrid>
            {STEPS.map((s) => (
              <EduCard key={s.title} title={s.title}>
                {s.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="hybrid" eyebrow="Why two engines" title="Heuristics for speed, AI for depth">
          <p>
            A fast heuristic pass gives you instant, auditable guidance for common faults — ideal for free and
            instant estimates. Deeper AI video analysis layers in where the extra nuance genuinely helps. The
            two are reconciled into a single prioritized fix, so you get speed and depth without a wall of
            competing reports. Read the deeper comparison in{' '}
            <Link href="/learn/heuristic-vs-ai-swing-analysis" className="font-medium text-primary hover:underline">
              Heuristic vs AI Swing Analysis
            </Link>
            .
          </p>
        </EduSection>

        <EduSection id="honest" eyebrow="No fabricated precision" title="What it won’t do">
          <p>
            It will not invent 3D angles a sensor would measure, guarantee results, or replace a coach. Where
            it estimates from video, it says so and attaches a confidence label — so the output stays honest
            and you always know how much to trust a read.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See the pipeline on your swing">
          <CtaRow
            items={[
              { href: '/start', label: 'Run your analysis', primary: true },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
              { href: '/learn/how-to-film-your-swing', label: 'How to film your swing' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">
            Is AI Swing Analysis Accurate?
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
