import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { NotCoachReplacementNotice } from '@/components/trust/NotCoachReplacementNotice';
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

const SLUG = 'what-is-the-skill-tree';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const PARTS = [
  { title: 'Branches', body: 'Your game split into sport-specific areas — technique, consistency, finesse, tactics, and more.' },
  { title: 'A score', body: 'Each branch shows a score built from the real evidence feeding it, or stays unscored with none.' },
  { title: 'Evidence count', body: 'How many signals — videos, sessions, benchmarks — sit behind a branch, so you trust it accordingly.' },
  { title: 'Self-rating', body: 'An optional one-to-five rating you can add; weighted lightly so it never overrides real data.' },
];

export default function WhatIsTheSkillTreePage() {
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
              { href: '/start', label: 'Build your skill tree', primary: true },
              { href: '/learn/what-is-the-athlete-journey', label: 'The athlete journey' },
            ]}
          />
        </header>

        <EduSection id="anatomy" eyebrow="What it is made of" title="Branches, scores, and evidence">
          <p>
            The skill tree breaks your overall game into parts you can actually work on. Instead of a single,
            blunt number, it shows where you stand across the areas that make up your sport — each backed by the
            data behind it.
          </p>
          <EduCardGrid>
            {PARTS.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="honest" eyebrow="Honest by design" title="Empty branches are a feature">
          <p>
            A branch with no data stays empty rather than showing a made-up score. That is deliberate:
            SwingVantage will not fabricate a number it cannot support. An empty branch is simply an honest
            prompt to add a video or session there — never a hidden zero, and never a guess dressed up as a
            measurement.
          </p>
        </EduSection>

        <EduSection id="use" eyebrow="Why it matters" title="From a vague sense to a clear focus">
          <p>
            The tree turns a fuzzy feeling about your game into clear strengths and gaps, and flags the branch
            that is your current priority. That makes it obvious where focused practice will pay off most. It is
            built from the same inputs described in{' '}
            <Link href="/learn/what-data-swingvantage-uses" className="font-medium text-primary hover:underline">
              What Data Does SwingVantage Use?
            </Link>
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See your game, branch by branch">
          <CtaRow
            items={[
              { href: '/start', label: 'Build your skill tree', primary: true },
              { href: '/learn/what-is-the-athlete-journey', label: 'The athlete journey' },
              { href: '/benchmarks', label: 'See benchmarks' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-the-athlete-journey" className="text-primary hover:underline">
            What Is the Athlete Journey?
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
