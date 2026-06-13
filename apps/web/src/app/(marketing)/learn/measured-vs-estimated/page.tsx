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

const SLUG = 'measured-vs-estimated';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function MeasuredVsEstimatedPage() {
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
              { href: '/start', label: 'Get a labeled analysis', primary: true },
              { href: '/methodology', label: 'Read the methodology' },
            ]}
          />
        </header>

        <EduSection id="four" eyebrow="The four labels" title="How SwingVantage labels every finding">
          <p>
            Honesty is a feature here. Rather than present everything as if it were precisely measured,
            SwingVantage tags each finding with the evidence behind it — so you always know how much weight to
            give it.
          </p>
          <EduCardGrid>
            <EduCard title="Measured">
              Captured directly by a sensor — e.g. ball speed from a launch monitor you imported. Highest certainty.
            </EduCard>
            <EduCard title="Estimated from video">
              Inferred from what the camera could see plus proven rules. Reliable for patterns; affected by angle.
            </EduCard>
            <EduCard title="AI-inferred">
              Derived by deeper AI reasoning over your signals where rules alone fall short.
            </EduCard>
            <EduCard title="Self-reported">
              What you told us — symptoms, goals, equipment. Useful context, clearly not independently verified.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="why" eyebrow="Why not measure everything" title="Why we estimate honestly instead of faking precision">
          <p>
            Some numbers genuinely require hardware most athletes don’t own. The dishonest move would be to
            present a video guess as a lab measurement. Instead, SwingVantage estimates from video using a
            transparent <EducationalLink term="heuristic-data">rules-based</EducationalLink> approach and{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink>, labels it clearly, and uses your real
            launch-monitor data the moment you import it.
          </p>
        </EduSection>

        <EduSection id="confidence" eyebrow="More than a label" title="Confidence, and how to raise it">
          <p>
            Beyond the basis, every finding carries a plain-English confidence level and the data points it was
            built from. You can raise it: film a true angle, add sessions so a pattern repeats, import sensor
            data, and complete retests. Consistent, corroborating evidence is what turns a tentative read into
            a confident one.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="See the labels" title="Get an honestly-labeled analysis">
          <CtaRow
            items={[
              { href: '/start', label: 'Get a labeled analysis', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'Is AI analysis accurate?' },
              { href: '/learn/how-to-film-your-swing', label: 'Film a clean clip' },
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
