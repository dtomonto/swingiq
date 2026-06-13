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

const SLUG = 'how-the-ai-coach-works';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const DOES = [
  { title: 'Explains your report', body: 'It translates faults, confidence, and your prioritized fix into plain language you can act on.' },
  { title: 'Answers in context', body: 'Ask what to work on today or what a finding means; it answers using your real report and history.' },
  { title: 'Points to the next step', body: 'It keeps you focused on your next-best action instead of a wall of competing metrics.' },
];

const WONT = [
  { title: 'Invent findings', body: 'It is grounded in your real analysis first; a language model may only reword that, never fabricate a result.' },
  { title: 'Fake precision', body: 'It will not present an estimate as a measurement, or quote a metric a single camera cannot support.' },
  { title: 'Replace your coach', body: 'No hands-on correction, feel, or accountability — it complements a coach, it does not stand in for one.' },
];

export default function HowTheAiCoachWorksPage() {
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
              { href: '/start', label: 'Meet your AI Coach', primary: true },
              { href: '/learn/how-ai-swing-analysis-works', label: 'How analysis works' },
            ]}
          />
        </header>

        <EduSection id="what" eyebrow="A layer, not a second opinion" title="What the AI Coach actually is">
          <p>
            The AI Coach is the conversational layer on top of your{' '}
            <EducationalLink term="ai-sports">AI analysis</EducationalLink>. The analysis produces the findings —
            your faults, their confidence, and the one fix that matters most. The coach explains those findings
            in plain language and helps you decide what to do next. It is not a separate engine forming its own
            opinion; it is a guide to the report you already have.
          </p>
          <EduCardGrid>
            {DOES.map((d) => (
              <EduCard key={d.title} title={d.title}>
                {d.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="grounded" eyebrow="Why you can trust it" title="Grounded first, reworded second">
          <p>
            Honesty is built into how the coach speaks. Its explanation is assembled from your real findings and
            their confidence first. Only then may an optional language model reword that narrative for clarity —
            it can never add a finding that is not in your data, and if anything fails it falls back to the plain,
            deterministic explanation. You get readable coaching without invented precision.
          </p>
        </EduSection>

        <EduSection id="wont" eyebrow="The honest limits" title="What it will not do">
          <EduCardGrid>
            {WONT.map((w) => (
              <EduCard key={w.title} title={w.title}>
                {w.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="Ask about your own swing">
          <CtaRow
            items={[
              { href: '/start', label: 'Meet your AI Coach', primary: true },
              { href: '/learn/does-ai-replace-a-coach', label: 'Does AI replace a coach?' },
              { href: '/learn/how-to-read-your-swing-report', label: 'How to read your report' },
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
          <Link href="/learn/how-ai-swing-analysis-works" className="text-primary hover:underline">
            How AI Swing Analysis Works
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
