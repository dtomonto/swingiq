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

const SLUG = 'what-transfers-between-sports';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const EXAMPLES = [
  {
    title: 'Golf ↔ Tennis',
    body: 'Rotational power, posture, and a stable base carry over. Both reward turning the hips and torso in the right order and staying balanced through contact.',
  },
  {
    title: 'Baseball ↔ Golf',
    body: 'A coiled load and an unwind that fires the hips before the hands is shared. The timing differs, but the sequencing instinct transfers directly.',
  },
  {
    title: 'Tennis ↔ Pickleball',
    body: 'Footwork, split-step timing, and a compact rotational stroke move across almost unchanged — the smaller court mostly shortens the swing.',
  },
  {
    title: 'Baseball ↔ Softball',
    body: 'Hip-led rotation, a connected upper body, and tracking the ball into contact are nearly identical engines under different pitch speeds.',
  },
];

const PILLARS = [
  { title: 'Ground-up sequencing', body: 'Power that starts from the ground and moves hips → torso → arms is the backbone of nearly every swing sport.' },
  { title: 'Rotation', body: 'Turning the hips and torso to load and release energy repeats whether you swing a club, racket, or bat.' },
  { title: 'Balance', body: 'A stable base through contact keeps the strike repeatable in every sport, even as stances change.' },
  { title: 'Timing', body: 'Matching the swing to a moving or stationary ball is a transferable skill of rhythm and tracking.' },
];

export default function WhatTransfersBetweenSportsPage() {
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
              { href: '/start', label: 'Analyze any sport', primary: true },
              { href: '/athlete-general-intelligence', label: 'The cross-sport engine' },
            ]}
          />
        </header>

        <EduSection id="examples" eyebrow="Concrete crossovers" title="Skills that carry between sports">
          <p>
            The implement and target change, but the engine of a good swing does not. Here are real crossovers
            athletes feel when they pick up a second sport:
          </p>
          <EduCardGrid>
            {EXAMPLES.map((e) => (
              <EduCard key={e.title} title={e.title}>
                {e.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="pillars" eyebrow="The common thread" title="Four fundamentals that repeat everywhere">
          <p>
            Look closely and the same four pillars show up in nearly every swing sport. SwingVantage looks for
            them across the board, which is why guidance is consistent whether you play golf or pickleball.
          </p>
          <EduCardGrid>
            {PILLARS.map((p) => (
              <EduCard key={p.title} title={p.title}>
                {p.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="engine" eyebrow="Why this is a moat" title="How SwingVantage reuses what transfers">
          <p>
            Because these fundamentals are shared, what the system learns about your sequencing or balance in
            one sport can inform the read in another instead of starting from zero. That cross-sport reasoning is
            the job of <EducationalLink term="ai-sports">SwingVantage’s</EducationalLink> Athlete General
            Intelligence — explained in depth on the{' '}
            <Link href="/learn/what-is-athlete-general-intelligence" className="font-medium text-primary hover:underline">
              Athlete General Intelligence guide
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See it across your sports">
          <CtaRow
            items={[
              { href: '/start', label: 'Analyze any sport', primary: true },
              { href: '/learn/what-is-athlete-general-intelligence', label: 'What is AGI?' },
              { href: '/learn/how-ai-swing-analysis-works', label: 'How analysis works' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-athlete-general-intelligence" className="text-primary hover:underline">
            What Is Athlete General Intelligence?
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
