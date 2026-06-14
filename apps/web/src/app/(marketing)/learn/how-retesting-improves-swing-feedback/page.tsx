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

const SLUG = 'how-retesting-improves-swing-feedback';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const STEPS = [
  {
    title: '1. Baseline',
    body: 'Record and analyze a swing. This is your starting point — the read SwingVantage measures progress against.',
  },
  {
    title: '2. One fix, one plan',
    body: 'Work the single highest-impact fix with a short, focused practice plan instead of changing five things at once.',
  },
  {
    title: '3. Retest',
    body: 'After a focused block of practice, record a fresh swing under similar conditions so the comparison is fair.',
  },
  {
    title: '4. Compare',
    body: 'SwingVantage lines the retest up against your baseline and shows what moved, what held, and what to do next.',
  },
];

export default function HowRetestingImprovesSwingFeedbackPage() {
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
          <p className="mt-3 text-muted-foreground">
            Retesting is the “one retest” in SwingVantage’s core promise —{' '}
            <strong className="text-foreground">one fix, one plan, one retest</strong> — and it is what turns
            a tip into proof.
          </p>
          <CtaRow
            items={[
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/retest', label: 'See your retest plan' },
            ]}
          />
        </header>

        <EduSection id="what" eyebrow="Definition" title="What a retest is">
          <p>
            A retest is a fresh analysis recorded after you practice a change, compared directly against your
            earlier baseline. Instead of relying on feel — which is notoriously unreliable right after a swing
            change — it gives you objective evidence of whether the fix actually took.
          </p>
        </EduSection>

        <EduSection id="how" eyebrow="The loop" title="How retesting works in SwingVantage">
          <EduCardGrid>
            {STEPS.map((s) => (
              <EduCard key={s.title} title={s.title}>
                {s.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="why" eyebrow="Why it matters" title="Why retesting improves your feedback">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>It closes the loop.</strong> You stop guessing whether a change worked and start knowing.
            </li>
            <li>
              <strong>It raises confidence.</strong> A pattern confirmed across sessions is far more reliable
              than a single read — repeated, consistent signals strengthen your{' '}
              <EducationalLink term="heuristic-data">heuristic</EducationalLink> and{' '}
              <EducationalLink term="ai-sports">AI</EducationalLink> diagnosis alike.
            </li>
            <li>
              <strong>It catches regressions.</strong> If a fix did not stick, the retest flags it early
              instead of letting a bad habit settle in.
            </li>
            <li>
              <strong>It keeps practice focused.</strong> Testing one change at a time makes the result easy to
              read and the next step obvious.
            </li>
          </ul>
        </EduSection>

        <EduSection id="tips" eyebrow="Do it right" title="How to get a clean retest">
          <EduCardGrid>
            <EduCard title="Match the conditions">
              Same camera angle, lighting, and club or implement so you compare like with like.
            </EduCard>
            <EduCard title="Change one thing">
              Isolate the single fix you practiced so the result clearly belongs to it.
            </EduCard>
            <EduCard title="Give it real reps">
              Retest after a focused block — a week or a few sessions — not after a single swing.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Keep going" title="Prove your next change">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/learn/how-swingvantage-uses-player-profiles', label: 'How profiles personalize your plan' },
              { href: '/learn/ai-in-sports-performance', label: 'AI in sports performance' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/heuristic-vs-ai-swing-analysis" className="text-primary hover:underline">
            Heuristic vs AI Swing Analysis
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-swingvantage-uses-player-profiles" className="text-primary hover:underline">
            How SwingVantage Uses Player Profiles
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
