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

const SLUG = 'single-camera-swing-analysis';
const article = getTechEducationArticle(SLUG)!;

export const metadata = buildTechEducationMetadata(SLUG);

const CAN = [
  { title: 'Track your motion', body: 'Pose detection follows your body through the swing from one ordinary phone clip.' },
  { title: 'Spot likely faults', body: 'Sport-specific logic flags recognizable patterns and the fix most likely to help.' },
  { title: 'Compare retests', body: 'Consistent clips let it compare a later swing to your baseline and show what moved.' },
];

const CANNOT = [
  { title: 'Measure true 3D', body: 'One camera sees 2D and reconstructs an approximation of depth — exact 3D angles are estimated.' },
  { title: 'Match lab sensors', body: 'It is a motion proxy, not a force plate or optical capture rig, so confidence is capped.' },
  { title: 'Replace measured data', body: 'For precise ball numbers, a launch monitor is the right tool; the two answer different questions.' },
];

export default function SingleCameraSwingAnalysisPage() {
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
              { href: '/start', label: 'Analyze a phone clip', primary: true },
              { href: '/learn/how-to-film-your-swing', label: 'How to film your swing' },
            ]}
          />
        </header>

        <EduSection id="how" eyebrow="How it works" title="One camera, pose detection, sport logic">
          <p>
            Single-camera analysis applies <EducationalLink term="ai-sports">AI</EducationalLink> pose detection
            to a single phone video, tracking your body through the swing and reading the result with
            sport-specific logic. Everything it reports is inferred from that one 2D view — which is exactly why
            it is honest about what that view can and cannot support.
          </p>
          <EduCardGrid>
            {CAN.map((c) => (
              <EduCard key={c.title} title={c.title}>
                {c.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="limits" eyebrow="The honest part" title="What one camera cannot do">
          <p>
            A single camera is a motion proxy, not a measurement lab. SwingVantage reconstructs an approximation
            of depth from 2D, so it caps the confidence of these reads and labels them estimated rather than
            dressing them up as sensor data:
          </p>
          <EduCardGrid>
            {CANNOT.map((c) => (
              <EduCard key={c.title} title={c.title}>
                {c.body}
              </EduCard>
            ))}
          </EduCardGrid>
        </EduSection>

        <EduSection id="useful" eyebrow="Useful within limits" title="Why it still helps a lot">
          <p>
            Honest limits do not mean low value. For the job most athletes need — finding the one change that
            helps most — a single good clip is plenty, and every finding carries a confidence label so you know
            how much to trust it. If you also have measured numbers, see{' '}
            <Link href="/learn/ai-analysis-vs-launch-monitors" className="font-medium text-primary hover:underline">
              AI Analysis vs Launch Monitors
            </Link>
            .
          </p>
        </EduSection>

        <TrustCallout>{technologyClaims.trustDisclaimer}</TrustCallout>

        <NotCoachReplacementNotice className="mt-6" />

        <EduSection id="next" eyebrow="Try it" title="See what one clip reveals">
          <CtaRow
            items={[
              { href: '/start', label: 'Analyze a phone clip', primary: true },
              { href: '/learn/is-ai-swing-analysis-accurate', label: 'How accurate is it?' },
              { href: '/learn/measured-vs-estimated', label: 'Measured vs estimated' },
            ]}
          />
        </EduSection>

        <FaqSection faqs={article.faqs} />

        <nav aria-label="Related" className="mt-10 border-t border-border pt-5 text-sm">
          <span className="font-semibold text-foreground">Related: </span>
          <Link href="/learn/how-to-film-your-swing" className="text-primary hover:underline">
            How to Film Your Swing
          </Link>
          <span className="text-muted-foreground"> · </span>
          <Link href="/learn/is-ai-swing-analysis-accurate" className="text-primary hover:underline">
            Is AI Swing Analysis Accurate?
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
