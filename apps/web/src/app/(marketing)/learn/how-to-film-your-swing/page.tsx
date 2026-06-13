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

const SLUG = 'how-to-film-your-swing';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function HowToFilmYourSwingPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · How-to</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow
            items={[
              { href: '/start', label: 'Upload a swing', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'How accurate is the read?' },
            ]}
          />
        </header>

        <EduSection id="checklist" eyebrow="The 60-second setup" title="Get a clean clip">
          <EduCardGrid>
            <EduCard title="Steady the phone">
              A tripod or a solid surface — never handheld. A still camera is the foundation of a good read.
            </EduCard>
            <EduCard title="Hip height">
              Set the lens at roughly hip height so angles aren’t distorted from above or below.
            </EduCard>
            <EduCard title="Frame the whole swing">
              Fit your full body, the club or bat, and the start of ball flight with a little room to spare.
            </EduCard>
            <EduCard title="Good, even light">
              Bright, even lighting; avoid shooting into the sun or in deep shade.
            </EduCard>
            <EduCard title="Normal speed is fine">
              You don’t need slow-motion — a clear angle matters far more than frame rate.
            </EduCard>
            <EduCard title="Capture the finish">
              Record through the full finish so balance and sequencing can be judged.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="angles" eyebrow="The most important choice" title="Pick the right angle">
          <p>
            Camera angle is the single biggest factor in an accurate read — because analysis is inferred from
            a 2D video, an off-axis camera can fake a problem that isn’t really there.
          </p>
          <EduCardGrid>
            <EduCard title="Down-the-line">
              Directly behind your hands, on the target line, at hip height. Best for swing path and plane.
            </EduCard>
            <EduCard title="Face-on">
              Directly in front of you, square to your body. Best for balance, weight shift, and sequencing.
            </EduCard>
            <EduCard title="One angle at a time">
              Film each angle as its own clip rather than a moving shot that captures neither cleanly.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="why" eyebrow="Why it matters" title="A clean clip means an honest read">
          <p>
            A true angle and good light let SwingVantage’s{' '}
            <EducationalLink term="ai-sports">video analysis</EducationalLink> read your motion clearly and
            raise the confidence of every finding. A blurry or off-axis clip lowers confidence — and the{' '}
            <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">
              estimated label
            </Link>{' '}
            on your results will reflect that honestly.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="You’re set" title="Film it and get your fix">
          <CtaRow
            items={[
              { href: '/start', label: 'Upload a swing', primary: true },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
              { href: '/learn/how-ai-swing-analysis-works', label: 'How the analysis works' },
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
