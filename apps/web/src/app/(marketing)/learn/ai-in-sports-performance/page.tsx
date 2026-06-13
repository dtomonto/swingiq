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

const SLUG = 'ai-in-sports-performance';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function AiInSportsPerformancePage() {
  const crumbs = techEducationCrumbs(article);

  return (
    <main className="min-h-screen bg-card">
      <JsonLd data={buildTechEducationGraph(SLUG)} />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Breadcrumbs items={crumbs} className="mb-5" />

        {/* 1. Hero — H1 + AEO/GEO direct-answer lead */}
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Learn · Technology</p>
          <h1 className="mt-1 text-3xl font-bold text-foreground md:text-4xl">{article.heading}</h1>
          <AnswerLead>{article.answerSummary}</AnswerLead>
          <p className="mt-3 text-muted-foreground">
            SwingVantage brings together video, player-profile data, symptoms, goals, session history, and
            retest results to create practical improvement plans — not a wall of metrics, but a clear next
            step you can act on today.
          </p>
          <CtaRow
            items={[
              { href: '/start', label: 'Start your analysis', primary: true },
              { href: '/profile', label: 'Build your player profile' },
            ]}
          />
        </header>

        {/* 2. What AI actually means */}
        <EduSection id="what" eyebrow="Plain English" title="What AI actually means">
          <p>{technologyClaims.aiSportsPerformance.full}</p>
          <p className="text-muted-foreground">
            No magic, no guaranteed improvement, and no replacing your coach. AI is a tool for organizing
            information and surfacing the patterns that matter — the judgment and the practice are still
            yours.
          </p>
        </EduSection>

        {/* 3. How AI is used in sports */}
        <EduSection id="uses" eyebrow="In practice" title="How AI is used in sports">
          <EduCardGrid>
            <EduCard title="Video analysis">Reads your swing from a phone clip to spot likely faults.</EduCard>
            <EduCard title="Movement pattern detection">Finds the recurring mechanics behind your results.</EduCard>
            <EduCard title="Swing flaw identification">Names the single fix most likely to help first.</EduCard>
            <EduCard title="Personalized drill selection">Matches drills to your level, sport, and goal.</EduCard>
            <EduCard title="Practice plan generation">Turns the fix into a simple, ordered plan.</EduCard>
            <EduCard title="Progress tracking">Watches the trend across sessions, not just one day.</EduCard>
            <EduCard title="Retest comparison">Confirms whether a change actually worked.</EduCard>
            <EduCard title="Player development timelines">Shows how an athlete grows over months and years.</EduCard>
            <EduCard title="Coach & parent communication">Makes progress easy to share and understand.</EduCard>
          </EduCardGrid>
        </EduSection>

        {/* 4. The new sports data environment */}
        <EduSection id="environment" eyebrow="The shift" title="The new sports data environment">
          <p className="text-muted-foreground">Athletes now have access to more signal than ever:</p>
          <ul className="grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
            {[
              'Smartphone video',
              'Launch monitors',
              'Wearables',
              'Session tracking',
              'Ball-flight data',
              'Player profiles',
              'Training history',
              'Coach notes',
              'Self-reported symptoms',
              'Competitive results',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </EduSection>

        {/* 5. The problem */}
        <EduSection
          id="problem"
          eyebrow="The catch"
          title="More data does not automatically mean more improvement"
        >
          <p>
            Most athletes are <strong>overloaded with disconnected information</strong>: a video here, a
            launch-monitor printout there, a coach note in a text thread, a vague feeling that something is
            off. Data sitting in ten places is not insight.
          </p>
          <p className="text-muted-foreground">
            SwingVantage’s job is to organize that data into{' '}
            <strong className="text-foreground">decisions</strong> — to translate everything you have into the
            one thing worth working on next.
          </p>
        </EduSection>

        {/* 6. How SwingVantage puts the data together */}
        <EduSection id="together" eyebrow="The system" title="How SwingVantage puts the data together">
          <EduCardGrid>
            <EduCard title="Player profile">Who you are as an athlete — the context for everything else.</EduCard>
            <EduCard title="Sport-specific analysis">Reads your swing against real, per-sport mechanics.</EduCard>
            <EduCard title="Athlete General Intelligence">
              The cross-sport engine that finds what limits the most of your game at once.
            </EduCard>
            <EduCard title="Heuristic engine">
              A fast, structured <EducationalLink term="heuristic-data">heuristic</EducationalLink> first pass for
              instant, auditable guidance.
            </EduCard>
            <EduCard title="AI coach">Deeper, conversational guidance when more nuance helps.</EduCard>
            <EduCard title="Skill tree">A clear path of fundamentals appropriate to where you are.</EduCard>
            <EduCard title="Athlete journey">Keeps guidance right for your stage and goals.</EduCard>
            <EduCard title="Session history">Turns repeated signals into confidence, not noise.</EduCard>
            <EduCard title="Retest plan">A built-in way to prove a change actually worked.</EduCard>
            <EduCard title="Progress dashboard">The trend over time, in plain language.</EduCard>
          </EduCardGrid>
        </EduSection>

        {/* 7. The future of technology in sports */}
        <EduSection id="future" eyebrow="What's next" title="The future of technology in sports">
          <ul className="list-disc space-y-2 pl-5">
            <li>Athletes will expect personalized coaching systems, not generic tips.</li>
            <li>Coaches will use AI to scale feedback to more players without losing quality.</li>
            <li>Parents will have clearer, honest visibility into development.</li>
            <li>Teams and facilities will track progress with far better signal.</li>
            <li>Recreational athletes will gain tools that once felt elite-only.</li>
            <li>
              Winning platforms will not just collect data — they will{' '}
              <strong className="text-foreground">translate data into action</strong>.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Go deeper:{' '}
            <Link
              href="/learn/future-of-ai-coaching-in-recreational-sports"
              className="font-medium text-primary hover:underline"
            >
              The Future of AI Coaching in Recreational Sports
            </Link>
            .
          </p>
        </EduSection>

        {/* 8. SwingVantage's role */}
        <EduSection id="role" eyebrow="Where we fit" title="SwingVantage’s role">
          <p>
            SwingVantage is a <strong>premium improvement layer</strong> that turns video, data, and history
            into clear next steps. The future of sports improvement is not just more data — it is turning the
            right data into the right action at the right time. That is the whole product.
          </p>
        </EduSection>

        {/* Trust */}
        <TrustCallout title="Honest by design">{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        {/* 9. CTAs */}
        <EduSection id="next" eyebrow="Get started" title="Put your data to work">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your analysis', primary: true },
              { href: '/profile', label: 'Build your player profile' },
              { href: '/learn/what-is-heuristic-data', label: 'Learn what heuristic data means' },
              { href: '/dashboard', label: 'See your next best action' },
            ]}
          />
        </EduSection>

        {/* FAQ — mirrors the FAQPage JSON-LD */}
        <FaqSection faqs={article.faqs} />

        {/* Related */}
        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/what-is-heuristic-data" className="text-primary hover:underline">
            What Is Heuristic Data?
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/how-swingvantage-uses-player-profiles" className="text-primary hover:underline">
            How SwingVantage Uses Player Profiles
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
