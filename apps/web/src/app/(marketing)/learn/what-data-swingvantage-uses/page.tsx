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

const SLUG = 'what-data-swingvantage-uses';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const INPUTS = [
  { title: 'Your swing video', body: 'The core input — a single phone clip is enough to produce a useful first read.' },
  { title: 'Profile answers', body: 'Sport, skill level, goals, and equipment you choose to provide help tailor the guidance.' },
  { title: 'Session history', body: 'Practices and outings over time let the system see patterns, not just one swing.' },
  { title: 'Drills & retests', body: 'What you worked on and your follow-up clips let it confirm whether a change held.' },
  { title: 'Launch-monitor imports', body: 'Optional measured numbers that keep their measured label, never blended with estimates.' },
  { title: 'Self-reported notes', body: 'Symptoms or context you add, used carefully to keep guidance safe and relevant.' },
];

export default function WhatDataSwingVantageUsesPage() {
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
              { href: '/start', label: 'Start with one video', primary: true },
              { href: '/privacy', label: 'Read the privacy policy' },
            ]}
          />
        </header>

        <EduSection id="inputs" eyebrow="The inputs behind your guidance" title="What you can share">
          <p>
            SwingVantage works from the inputs you choose to provide. None are mandatory beyond a single clip —
            each additional signal simply sharpens and personalizes the read over time.
          </p>
          <EduCardGrid>
            {INPUTS.map((i) => (
              <EduCard key={i.title} title={i.title}>
                {i.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="privacy" eyebrow="Privacy-forward by default" title="Your data stays yours">
          <p>
            Your video is private by default — not shared publicly — and is never used to train{' '}
            <EducationalLink term="ai-sports">AI</EducationalLink> models without your explicit consent. Consent
            is a deliberate opt-in, never the silent default, and you control what you upload and can remove it.
            The full details live in the{' '}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              privacy policy
            </Link>
            .
          </p>
        </EduSection>

        <EduSection id="more" eyebrow="You stay in control" title="More signals, sharper read — your call">
          <p>
            Sharing more inputs generally improves the guidance, because the system has more to reason over. But
            that is always your choice: you can get value from one video and add sessions, retests, or imports
            only when you want to. How those inputs become personalized advice is covered in{' '}
            <Link href="/learn/how-swingvantage-uses-player-profiles" className="font-medium text-primary hover:underline">
              How SwingVantage Uses Player Profiles
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="Start with what you have">
          <CtaRow
            items={[
              { href: '/start', label: 'Start with one video', primary: true },
              { href: '/methodology', label: 'How we measure and estimate' },
              { href: '/learn/measured-vs-estimated', label: 'Measured vs estimated' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-swingvantage-uses-player-profiles" className="text-primary hover:underline">
            How SwingVantage Uses Player Profiles
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/measured-vs-estimated" className="text-primary hover:underline">
            Measured vs Estimated
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
