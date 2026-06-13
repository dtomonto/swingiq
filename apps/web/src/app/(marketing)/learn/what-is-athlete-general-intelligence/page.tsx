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

const SLUG = 'what-is-athlete-general-intelligence';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function WhatIsAthleteGeneralIntelligencePage() {
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
              { href: '/start', label: 'Build your athlete model', primary: true },
              { href: '/athlete-general-intelligence', label: 'Explore the full engine' },
            ]}
          />
        </header>

        <EduSection id="general" eyebrow="The name, honestly" title="What “general” really means">
          <p>
            <strong>AGI = Athlete General Intelligence.</strong> The word “general” is used in its real
            technical sense — <strong>breadth and transfer across domains</strong> (your sports) — not the
            science-fiction kind. It is not self-aware and does not think like a person. Where a normal{' '}
            <EducationalLink term="ai-sports">AI analysis</EducationalLink> is a specialist that studies one
            swing, Athlete General Intelligence is the generalist that reasons across all of them at once.
          </p>
        </EduSection>

        <EduSection id="capabilities" eyebrow="The idea that makes it work" title="One model of you, built from shared capabilities">
          <p>
            Every sport-specific measurement is mapped onto a small set of <strong>sport-neutral
            capabilities</strong> — the traits you actually carry between sports. That is what lets the engine
            reason about <em>you</em>, not one isolated swing.
          </p>
          <EduCardGrid>
            <EduCard title="Rotation & coil">The turn that powers a golf drive also powers a tennis forehand.</EduCard>
            <EduCard title="Kinetic sequencing">Ground-up timing shared across every athletic swing.</EduCard>
            <EduCard title="Balance & posture">A stable base that travels between sports.</EduCard>
            <EduCard title="Tempo & timing">Rhythm that shows up in every motion you make.</EduCard>
            <EduCard title="Power & speed">The output you can transfer once the sequence is right.</EduCard>
            <EduCard title="Consistency">Repeatability that compounds across activities.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="keystone" eyebrow="The payoff" title="Finding your keystone skill">
          <p>
            Once your capabilities are mapped, the engine finds your <strong>keystone</strong>: the single
            capability limiting the most sports at once. Train it and you lift every sport that uses it — the
            literal meaning of <strong>one fix, one plan, one retest</strong>, applied across your whole game.
            It also shows what already transfers, factors in today’s readiness, and tracks whether the thing
            you trained actually moved.
          </p>
        </EduSection>

        <EduSection id="honest" eyebrow="How it stays honest" title="It shows its work">
          <p>
            Like the rest of SwingVantage, every conclusion carries an inspectable chain of reasoning, each
            capability shows its basis (measured vs estimated) and confidence, and the whole picture gets a
            single A–D trust grade that always explains what would raise it. A{' '}
            <EducationalLink term="heuristic-data">heuristic</EducationalLink> first pass keeps it fast and
            auditable, and single-camera analysis is always an estimate — never a lab measurement.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="See your cross-sport model">
          <CtaRow
            items={[
              { href: '/start', label: 'Build your athlete model', primary: true },
              { href: '/learn/how-swingvantage-uses-player-profiles', label: 'How player profiles personalize it' },
              { href: '/athlete-general-intelligence', label: 'Explore the full engine' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/ai-in-sports-performance" className="text-primary hover:underline">
            AI in Sports Performance
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/what-is-heuristic-data" className="text-primary hover:underline">
            What Is Heuristic Data?
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
