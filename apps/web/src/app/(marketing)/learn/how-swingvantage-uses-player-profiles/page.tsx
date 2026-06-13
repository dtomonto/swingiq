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

const SLUG = 'how-swingvantage-uses-player-profiles';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function HowSwingVantageUsesPlayerProfilesPage() {
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
              { href: '/profile', label: 'Build your player profile', primary: true },
              { href: '/start', label: 'Start your swing check' },
            ]}
          />
        </header>

        <EduSection id="what" eyebrow="Definition" title="What your player profile captures">
          <p>
            Your player profile is the picture SwingVantage builds of you as an athlete. It is the context
            behind every recommendation — the difference between generic advice and a plan that actually fits
            you.
          </p>
          <EduCardGrid>
            <EduCard title="Sport & discipline">Golf, tennis, pickleball, padel, baseball, or softball — each has its own logic.</EduCard>
            <EduCard title="Skill level">Beginner to advanced, so guidance is challenging but never over your head.</EduCard>
            <EduCard title="Goals">What you are trying to do — more distance, fewer misses, more consistency.</EduCard>
            <EduCard title="Equipment context">Clubs, bats, or rackets that shape what is realistic for you.</EduCard>
            <EduCard title="Physical context">Self-reported factors that keep guidance appropriate and safe.</EduCard>
            <EduCard title="History">Sessions, drills, and retests that show what has worked for you before.</EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="how" eyebrow="In the product" title="How your profile shapes your plan">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>It decides which rules apply.</strong> Your profile drives the{' '}
              <EducationalLink term="heuristic-data">heuristic engine</EducationalLink>, so the same swing miss
              produces different guidance for a beginner and an advanced player.
            </li>
            <li>
              <strong>It frames the language.</strong> Explanations, drills, and pacing are tuned to your level
              and goals — encouraging for newcomers, precise for advanced athletes.
            </li>
            <li>
              <strong>It personalizes AI analysis.</strong> Your context makes{' '}
              <EducationalLink term="ai-sports">AI</EducationalLink> reads more relevant, not just more data.
            </li>
            <li>
              <strong>It connects across sports.</strong> Athlete General Intelligence maps your profile onto
              sport-neutral capabilities, so a strength in one sport can inform another.
            </li>
          </ul>
        </EduSection>

        <EduSection id="start" eyebrow="No gatekeeping" title="You don’t need a complete profile to start">
          <p>
            You can get a useful analysis from a single swing. Your profile then fills in over time, and each
            detail you add sharpens the guidance rather than gating it. More signal means a more personal plan
            — but you are never blocked from your first read.
          </p>
        </EduSection>

        <EduSection id="privacy" eyebrow="Trust" title="Privacy and honesty">
          <p>
            SwingVantage is built privacy-forward and labels the source of every data point. Your profile is
            used to <strong>personalize</strong> guidance, never to fabricate metrics — and nothing here is
            medical or injury advice.
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Keep going" title="Make your plan yours">
          <CtaRow
            items={[
              { href: '/profile', label: 'Build your player profile', primary: true },
              { href: '/athlete-general-intelligence', label: 'How your data connects across sports' },
              { href: '/learn/how-retesting-improves-swing-feedback', label: 'How retesting improves feedback' },
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
          <Link href="/athlete-general-intelligence" className="text-primary hover:underline">
            Athlete General Intelligence
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
