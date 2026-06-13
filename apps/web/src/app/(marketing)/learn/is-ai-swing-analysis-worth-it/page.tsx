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

const SLUG = 'is-ai-swing-analysis-worth-it';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const VALUE = [
  { title: 'Speed', body: 'A structured read in minutes instead of waiting for a lesson slot or guessing on the range.' },
  { title: 'Low cost', body: 'Starts free, so the barrier to a useful first answer is effectively zero.' },
  { title: 'Repeatable', body: 'Run it as often as you like and compare retests to see whether a change actually stuck.' },
  { title: 'Focused', body: 'One prioritized fix and a short plan beats a wall of metrics you do not know how to act on.' },
];

export default function IsAiSwingAnalysisWorthItPage() {
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
              { href: '/start', label: 'Try it free', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'Is it accurate?' },
            ]}
          />
        </header>

        <EduSection id="value" eyebrow="Where the value is" title="What you actually get">
          <p>
            The worth of <EducationalLink term="ai-sports">AI swing analysis</EducationalLink> is not “AI giving
            tips.” It is turning a vague sense that something is off into one clear thing to practice. That value
            comes from four things:
          </p>
          <EduCardGrid>
            {VALUE.map((v) => (
              <EduCard key={v.title} title={v.title}>
                {v.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="limits" eyebrow="The honest caveats" title="Where it is not worth it">
          <p>
            It is least useful if you never run the plan, never retest, or expect sensor-grade measurements from
            a phone clip. AI analysis is a guidance tool, not a guarantee — it rewards athletes who put the
            recommendation into practice. If you want raw measured numbers, that is a job for a launch monitor,
            covered in{' '}
            <Link href="/learn/ai-analysis-vs-launch-monitors" className="font-medium text-primary hover:underline">
              AI Analysis vs Launch Monitors
            </Link>
            .
          </p>
        </EduSection>

        <EduSection id="who" eyebrow="Who benefits most" title="Is it worth it for you?">
          <p>
            It pays off most for self-directed athletes who practice between lessons, players without easy
            access to a coach, and anyone who wants a fast, structured read before deciding what to work on.
            Because SwingVantage starts free and labels its confidence honestly, you can test the value on your
            own swing before spending anything.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Decide for yourself" title="See the value on your swing">
          <CtaRow
            items={[
              { href: '/start', label: 'Try it free', primary: true },
              { href: '/learn/ai-analysis-vs-private-coach', label: 'AI vs a private coach' },
              { href: '/pricing', label: 'See pricing' },
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
          <Link href="/learn/ai-analysis-vs-private-coach" className="text-primary hover:underline">
            AI Analysis vs a Private Coach
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
