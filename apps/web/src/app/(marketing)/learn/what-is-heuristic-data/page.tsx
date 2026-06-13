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
  ComparisonTable,
  TrustCallout,
  CtaRow,
  type ComparisonRow,
} from '@/components/learn/education-ui';
import {
  getTechEducationArticle,
  techEducationCrumbs,
  buildTechEducationMetadata,
  buildTechEducationGraph,
} from '@/lib/learn/tech-education';
import { technologyClaims } from '@/content/technologyClaims';

const SLUG = 'what-is-heuristic-data';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    dimension: 'Speed',
    heuristic: 'Near-instant — applies rules to your inputs in real time.',
    ai: 'Slower — processes video and richer signals before answering.',
  },
  {
    dimension: 'Cost',
    heuristic: 'Very low, so it can power free and instant estimates.',
    ai: 'Higher, reserved for where depth genuinely adds value.',
  },
  {
    dimension: 'Consistency',
    heuristic: 'Highly consistent — the same inputs give the same logic.',
    ai: 'Strong, but can vary with video quality and context.',
  },
  {
    dimension: 'Best use case',
    heuristic: 'Common swing flaws, first-pass feedback, quick triage.',
    ai: 'Nuanced movement, subtle patterns, deep video breakdowns.',
  },
  {
    dimension: 'Depth',
    heuristic: 'Focused and practical rather than exhaustive.',
    ai: 'Deeper — can surface patterns rules would miss.',
  },
  {
    dimension: 'Explainability',
    heuristic: 'Transparent and easy to audit — you can see the rule.',
    ai: 'Powerful, but reasoning can be harder to fully inspect.',
  },
  {
    dimension: 'Role in SwingVantage',
    heuristic: 'The fast first pass and safety net behind every analysis.',
    ai: 'The depth layer that sharpens confidence over time.',
  },
];

export default function WhatIsHeuristicDataPage() {
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
            It is the fast, practical layer behind SwingVantage’s core promise —{' '}
            <strong className="text-foreground">one fix, one plan, one retest</strong> — so you can act on
            the most likely next-best step before deeper{' '}
            <EducationalLink term="ai-sports">AI analysis</EducationalLink> is even needed.
          </p>
          <CtaRow
            items={[
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/learn/ai-in-sports-performance', label: 'See how AI works in sports' },
            ]}
          />
        </header>

        {/* 2. What heuristic data means */}
        <EduSection id="what" eyebrow="Definition" title="What heuristic data means">
          <p>
            Heuristic data is <strong>structured, rules-based performance intelligence</strong>. Instead of
            guessing, it applies proven, sport-specific rules to what it already knows about you — turning
            scattered inputs into a clear, useful recommendation. Think of it as the difference between a
            seasoned coach’s quick, experienced read and a random hunch.
          </p>
          <p>{technologyClaims.heuristicIntelligence.full}</p>
        </EduSection>

        {/* 3. Why heuristic data matters */}
        <EduSection id="why" eyebrow="The case for it" title="Why heuristic data matters">
          <EduCardGrid>
            <EduCard title="Faster feedback">
              Applies rules to your inputs in real time, so you get a useful read immediately.
            </EduCard>
            <EduCard title="Lower cost">
              Efficient enough to power free and instant estimates for everyone.
            </EduCard>
            <EduCard title="More consistent logic">
              The same inputs produce the same reasoning — no surprises.
            </EduCard>
            <EduCard title="Easier to audit">
              The rule behind a recommendation is transparent and inspectable.
            </EduCard>
            <EduCard title="Great for common misses">
              Excellent first-pass coverage of the swing flaws athletes hit most.
            </EduCard>
            <EduCard title="A foundation for AI">
              A strong, structured base that AI-assisted coaching builds on, not around.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        {/* 4. How SwingVantage uses heuristic data */}
        <EduSection id="how" eyebrow="In the product" title="How SwingVantage uses heuristic data">
          <p className="text-muted-foreground">
            Your <EducationalLink term="heuristic-data">heuristic engine</EducationalLink> reads many signals
            at once and applies sport-specific rules to find your most likely next-best action:
          </p>
          <EduCardGrid>
            <EduCard title="Player profile intelligence">
              Your sport, skill level, goals, and equipment context shape every rule that applies.
            </EduCard>
            <EduCard title="Sport-specific swing patterns">
              Known good and poor patterns per sport anchor the read in real mechanics.
            </EduCard>
            <EduCard title="Symptom & miss-pattern mapping">
              Your reported feels and ball flight map to the most probable cause.
            </EduCard>
            <EduCard title="Session history">
              Repeated signals across sessions raise confidence and filter out noise.
            </EduCard>
            <EduCard title="Retest outcomes">
              Whether a change actually worked feeds back into the next recommendation.
            </EduCard>
            <EduCard title="Drill completion">
              What you have practiced (and found helpful) tunes what comes next.
            </EduCard>
            <EduCard title="Skill tree progression">
              Where you are on the path decides which fundamentals are in range now.
            </EduCard>
            <EduCard title="Athlete journey stages">
              Beginner vs. advanced framing keeps guidance appropriate and safe.
            </EduCard>
            <EduCard title="Next-best-action logic">
              All of it resolves to one prioritized recommendation — not a wall of metrics.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        {/* 5. Comparison table */}
        <EduSection id="compare" eyebrow="Side by side" title="Heuristic Intelligence vs AI Analysis">
          <p className="text-muted-foreground">
            These are partners, not rivals. SwingVantage leads with heuristics for speed and clarity, then
            adds AI where extra depth earns its keep.
          </p>
          <ComparisonTable
            caption="Comparison of heuristic intelligence and AI analysis across speed, cost, consistency, best use case, depth, explainability, and role in SwingVantage."
            rows={COMPARISON_ROWS}
          />
          <p className="text-sm text-muted-foreground">
            Want the deeper breakdown? Read{' '}
            <Link href="/learn/heuristic-vs-ai-swing-analysis" className="font-medium text-primary hover:underline">
              Heuristic vs AI Swing Analysis
            </Link>
            .
          </p>
        </EduSection>

        {/* 6. Trust callout */}
        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        {/* 7. CTAs */}
        <EduSection id="next" eyebrow="Keep going" title="Turn your data into your next move">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your swing check', primary: true },
              { href: '/learn/ai-in-sports-performance', label: 'See how AI works in sports' },
              { href: '/athlete-general-intelligence', label: 'How SwingVantage turns data into improvement' },
            ]}
          />
        </EduSection>

        {/* FAQ — mirrors the FAQPage JSON-LD */}
        <FaqSection faqs={article.faqs} />

        {/* Related */}
        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/ai-in-sports-performance" className="text-primary hover:underline">
            AI in Sports Performance
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/heuristic-vs-ai-swing-analysis" className="text-primary hover:underline">
            Heuristic vs AI Swing Analysis
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
