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

const SLUG = 'future-of-ai-coaching-in-recreational-sports';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

export default function FutureOfAiCoachingPage() {
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
              { href: '/start', label: 'Start your analysis', primary: true },
              { href: '/learn/ai-in-sports-performance', label: 'What is AI in sports?' },
            ]}
          />
        </header>

        <EduSection id="shift" eyebrow="The shift" title="Elite tools are reaching everyone">
          <p>
            For decades, <EducationalLink term="ai-sports">video analysis</EducationalLink>, launch monitors,
            and personalized coaching were reserved for professionals and well-funded academies. Smartphones,
            cheaper sensors, and AI have collapsed that gap. The same kind of feedback that once required an
            expensive private lesson now fits in a recreational athlete’s pocket.
          </p>
        </EduSection>

        <EduSection id="who" eyebrow="Who benefits" title="What changes for each group">
          <EduCardGrid>
            <EduCard title="Recreational athletes">
              Personalized feedback, measurement, and retesting that used to feel elite-only — affordably.
            </EduCard>
            <EduCard title="Coaches">
              AI scales the routine first pass, freeing time for nuanced, relationship-driven, hands-on work.
            </EduCard>
            <EduCard title="Parents">
              Clearer, honest visibility into a young athlete’s development instead of guesswork.
            </EduCard>
            <EduCard title="Teams & facilities">
              Better progress tracking across many athletes, with consistent, comparable signal.
            </EduCard>
            <EduCard title="Beginners">
              A friendly on-ramp: a clear first fix and plan instead of an intimidating wall of data.
            </EduCard>
            <EduCard title="Lifelong improvers">
              A development timeline that follows them across sports and seasons, not a one-off lesson.
            </EduCard>
          </EduCardGrid>
        </EduSection>

        <EduSection id="not-replace" eyebrow="The honest take" title="AI augments coaches — it doesn’t replace them">
          <p>
            The likely future is not robots replacing instructors. It is coaches using AI as leverage: letting
            software handle the first pass and the routine tracking so their human judgment, motivation, and
            injury-aware expertise go further. SwingVantage is designed to make your coaching sessions more
            productive, not to stand in for one.
          </p>
        </EduSection>

        <EduSection id="principle" eyebrow="The core idea" title="Data is not the point — action is">
          <p>
            Athletes are already drowning in data. The platforms that win the next decade will not be the ones
            that collect the most of it; they will be the ones that{' '}
            <strong className="text-foreground">translate the right data into the right action at the right
            time</strong>. The future of sports improvement is a decision engine, not a dashboard.
          </p>
        </EduSection>

        <EduSection id="role" eyebrow="Where we fit" title="SwingVantage’s role in that future">
          <p>
            SwingVantage is a premium improvement layer across seven sports: it leads with fast{' '}
            <EducationalLink term="heuristic-data">heuristics</EducationalLink>, adds AI where it helps, and
            proves progress with retests — turning video, data, and history into clear next steps for everyday
            athletes.
          </p>
        </EduSection>

        <TrustCallout title="Honest by design">{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Get started" title="Step into it">
          <CtaRow
            items={[
              { href: '/start', label: 'Start your analysis', primary: true },
              { href: '/learn/how-swingvantage-uses-player-profiles', label: 'How profiles personalize your plan' },
              { href: '/athlete-general-intelligence', label: 'Athlete General Intelligence' },
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
          <Link href="/learn/heuristic-vs-ai-swing-analysis" className="text-primary hover:underline">
            Heuristic vs AI Swing Analysis
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
