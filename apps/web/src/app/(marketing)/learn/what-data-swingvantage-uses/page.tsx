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

const SLUG = 'what-data-swingvantage-uses';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function WhatDataSwingVantageUsesPage() {
  const crumbs = techEducationCrumbs(article);
  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Trust &amp; privacy</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <CtaRow items={[{ href: '/start', label: 'Start an analysis', primary: true }, { href: '/privacy', label: 'Read the privacy policy' }]} />
        </header>

        <EduSection id="inputs" eyebrow="The inputs" title="What SwingVantage actually uses">
          <EduCardGrid>
            <EduCard title="Swing video">A phone clip — the core input the analysis reads.</EduCard>
            <EduCard title="Player profile">Sport, level, goals, and equipment that personalize guidance.</EduCard>
            <EduCard title="Session history">Repeated signals that raise confidence and filter noise.</EduCard>
            <EduCard title="Drill &amp; retest results">What you’ve practiced and whether it worked.</EduCard>
            <EduCard title="Imported sensor data">Optional launch-monitor numbers that corroborate the video read.</EduCard>
            <EduCard title="Self-reported notes">Symptoms and goals you choose to share — clearly labeled as such.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="honest" eyebrow="Labeled, not fabricated" title="Every data point carries its source">
          <p>
            Nothing is invented. Each input is labeled by its source — measured, estimated, AI-inferred, or
            self-reported — and used only to personalize honest guidance, never to manufacture precision. See
            how that works in <Link href="/learn/measured-vs-estimated" className="font-medium text-primary hover:underline">measured vs estimated data</Link>,
            and how your profile shapes the read in{' '}
            <Link href="/learn/how-swingvantage-uses-player-profiles" className="font-medium text-primary hover:underline">how SwingVantage uses player profiles</Link>.
            It is built privacy-forward, and a single video is enough to start — everything else is optional.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>
        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Your data, working for you">
          <CtaRow items={[{ href: '/start', label: 'Start an analysis', primary: true }, { href: '/learn/how-swingvantage-uses-player-profiles', label: 'How profiles personalize it' }, { href: '/trust', label: 'Trust & safety' }]} />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-swingvantage-uses-player-profiles" className="text-primary hover:underline">How SwingVantage Uses Player Profiles</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">Measured vs Estimated Data</Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn" className="inline-flex items-center gap-1 text-primary hover:underline">All learn guides <ArrowRight size={12} aria-hidden="true" /></Link>
        </nav>
      </div>
    </main>
  );
}
