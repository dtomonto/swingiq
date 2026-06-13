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

const SLUG = 'how-often-should-you-retest';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const CADENCE = [
  { title: 'Casual improver', body: 'Working one fix in occasional practice? Retest every two to three weeks so a real change has time to show.' },
  { title: 'Frequent practicer', body: 'Drilling several times a week? Roughly weekly retests keep the change visible without measuring noise.' },
  { title: 'Pre-season push', body: 'Building a new pattern fast? Retest after each focused block of reps, still one fix at a time.' },
];

const CONDITIONS = [
  { title: 'Same angle', body: 'Match camera position and distance so the comparison reflects your swing, not your framing.' },
  { title: 'Same equipment', body: 'Use the same club or stroke you baselined, so you are comparing like with like.' },
  { title: 'Similar warm-up', body: 'Retest warmed up the way you were before, not cold or exhausted, to keep the read fair.' },
  { title: 'One change at a time', body: 'Isolate a single fix so the retest clearly attributes any difference to that change.' },
];

export default function HowOftenShouldYouRetestPage() {
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
              { href: '/start', label: 'Record a retest', primary: true },
              { href: '/learn/how-retesting-improves-swing-feedback', label: 'Why retesting works' },
            ]}
          />
        </header>

        <EduSection id="rule" eyebrow="The simple rule" title="Reps before you retest, not the clock">
          <p>
            Retest when you have practiced a single fix enough to expect a real change — not on a fixed daily
            schedule. For most athletes that lands every one to three weeks. Retest a swing you have barely
            grooved and you mostly capture an unsettled, in-between move; retest every session and normal
            swing-to-swing variation starts to look like progress when it is just noise.
          </p>
        </EduSection>

        <EduSection id="cadence" eyebrow="Pick your rhythm" title="A cadence by how you practice">
          <EduCardGrid>
            {CADENCE.map((c) => (
              <EduCard key={c.title} title={c.title}>
                {c.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="too-often" eyebrow="The common mistake" title="You can retest too often">
          <p>
            More retests are not more progress. Measuring every session turns random variation into apparent
            change and tempts you to abandon a fix before it sticks. A steady cadence with{' '}
            <EducationalLink term="heuristic-data">one change at a time</EducationalLink> keeps each retest
            readable — and keeps you from chasing your own noise.
          </p>
        </EduSection>

        <EduSection id="conditions" eyebrow="Make it count" title="Keep these the same every retest">
          <p>
            A retest is only fair if the conditions match your baseline. Hold these steady so SwingVantage can
            compare like with like:
          </p>
          <EduCardGrid>
            {CONDITIONS.map((c) => (
              <EduCard key={c.title} title={c.title}>
                {c.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Close the loop" title="Confirm your last change">
          <CtaRow
            items={[
              { href: '/start', label: 'Record a retest', primary: true },
              { href: '/learn/how-retesting-improves-swing-feedback', label: 'Why retesting improves feedback' },
              { href: '/learn/how-to-film-your-swing', label: 'How to film your swing' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-retesting-improves-swing-feedback" className="text-primary hover:underline">
            Why Retesting Improves Swing Feedback
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-to-read-your-swing-report" className="text-primary hover:underline">
            How to Read Your Swing Report
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
