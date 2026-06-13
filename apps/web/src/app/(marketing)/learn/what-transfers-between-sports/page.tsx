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

const SLUG = 'what-transfers-between-sports';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function WhatTransfersBetweenSportsPage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Cross-sport</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Find your transfer', primary: true }, { href: '/learn/what-is-athlete-general-intelligence', label: 'What is AGI?' }]} />
        </header>

        <EduSection id="shared" eyebrow="The shared traits" title="What actually carries over">
          <p>
            Sports look different on the surface, but they run on the same engine. These sport-neutral
            capabilities are the ones that transfer:
          </p>
          <EduCardGrid>
            <EduCard title="Rotation &amp; coil">The turn that powers a golf drive also powers a tennis forehand and a baseball swing.</EduCard>
            <EduCard title="Kinetic sequencing">Ground-up timing — legs, hips, torso, arms — recurs in every athletic swing.</EduCard>
            <EduCard title="Balance &amp; posture">A stable, athletic base travels intact between sports.</EduCard>
            <EduCard title="Tempo &amp; timing">Rhythm shows up wherever you swing or strike.</EduCard>
            <EduCard title="Power &amp; speed">Output you can transfer once the sequence is right.</EduCard>
            <EduCard title="Consistency">Repeatability that compounds across activities.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="engine" eyebrow="How we find it" title="Mapping your overlap">
          <p>
            SwingVantage’s <Link href="/learn/what-is-athlete-general-intelligence" className="font-medium text-primary hover:underline">Athlete General Intelligence</Link>{' '}
            maps each sport-specific measurement onto these shared capabilities, then compares them across the
            sports you have analyzed. That is how a strength you already own in one sport can surface as the
            fastest path to improvement in another — and how a single limiting trait can be the keystone that
            lifts several at once.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="See what transfers for you">
          <CtaRow items={[{ href: '/start', label: 'Find your transfer', primary: true }, { href: '/athlete-general-intelligence', label: 'Explore the engine' }, { href: '/learn/ai-in-sports-performance', label: 'AI in sports performance' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-athlete-general-intelligence" className="text-primary hover:underline">What Is Athlete General Intelligence?</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/ai-in-sports-performance" className="text-primary hover:underline">AI in Sports Performance</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
