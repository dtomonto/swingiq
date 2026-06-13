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

const SLUG = 'is-ai-swing-analysis-accurate';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const ROWS: ComparisonRow[] = [
  {
    dimension: 'Setup & posture',
    heuristic: 'Read reliably from a clear frame.',
    ai: 'Best captured by a launch monitor or 3D system.',
  },
  {
    dimension: 'Path & plane tendencies',
    heuristic: 'Read well from a true down-the-line angle.',
    ai: 'Exact club path is a sensor measurement.',
  },
  {
    dimension: 'Balance & sequencing',
    heuristic: 'Read well from face-on video.',
    ai: 'Precise force/pressure needs a plate.',
  },
  {
    dimension: 'Ball-flight consequences',
    heuristic: 'Inferred from the swing’s signature.',
    ai: 'Measured directly by ball-flight tools.',
  },
  {
    dimension: 'Exact 3D angles',
    heuristic: 'Estimated, clearly labeled as such.',
    ai: 'Measured by hardware most athletes lack.',
  },
];

export default function IsAiSwingAnalysisAccuratePage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Trust</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Try your free analysis', primary: true },
              { href: '/methodology', label: 'See our full methodology' },
            ]}
          />
        </header>

        <EduSection id="estimate" eyebrow="The honest answer" title="Accurate — as a structured estimate">
          <p>
            A single phone camera is not a laboratory. So SwingVantage treats every video read as a{' '}
            <strong>structured estimate</strong>, never a measurement it cannot make. That is not a weakness —
            it is the honest framing that lets you trust what you see. An{' '}
            <EducationalLink term="ai-sports">AI analysis</EducationalLink> is reliable for the patterns it can
            actually observe, and it says so plainly when it is inferring rather than measuring.
          </p>
        </EduSection>

        <EduSection id="reads" eyebrow="What it reads well vs estimates" title="Where video is strong — and where it isn’t">
          <ComparisonTable
            caption="What single-camera AI swing analysis reads reliably from video versus what truly needs a sensor."
            rows={ROWS}
            leftLabel="From video"
            rightLabel="Needs a sensor"
          />
        </EduSection>

        <EduSection id="labels" eyebrow="How we keep it honest" title="Every finding carries its confidence">
          <p>
            SwingVantage labels each diagnosis, score, and recommendation as{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">
              measured or estimated
            </Link>{' '}
            with a plain-English confidence level and the data points behind it. A clean angle and repeated
            sessions raise confidence; a single blurry clip lowers it. You are never handed fabricated
            precision.
          </p>
        </EduSection>

        <EduSection id="improve" eyebrow="Make it sharper" title="How to make your analysis more accurate">
          <EduCardGrid>
            <EduCard title="Film a true angle">
              Face-on or down-the-line at hip height — the single biggest factor in an accurate read.
            </EduCard>
            <EduCard title="Light it well">
              Even, bright light and a still camera let the analysis see your motion clearly.
            </EduCard>
            <EduCard title="Add sessions">
              A pattern that repeats across sessions is far more reliable than a single swing.
            </EduCard>
            <EduCard title="Import sensor data">
              Launch-monitor numbers corroborate the video read and raise confidence.
            </EduCard>
            <EduCard title="Complete retests">
              Retesting confirms a change and strengthens the evidence behind your diagnosis.
            </EduCard>
            <EduCard title="Use a heuristic first pass">
              A fast <EducationalLink term="heuristic-data">heuristic</EducationalLink> read gives instant,
              auditable guidance before deeper AI is needed.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="See for yourself" title="Run a real analysis">
          <CtaRow
            items={[
              { href: '/start', label: 'Try your free analysis', primary: true },
              { href: '/learn/how-to-film-your-swing', label: 'How to film your swing' },
              { href: '/learn/measured-vs-estimated', label: 'Measured vs estimated data' },
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
          <Link href="/methodology" className="text-primary hover:underline">
            Methodology
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
