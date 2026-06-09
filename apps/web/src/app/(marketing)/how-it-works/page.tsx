import { buildMetadata } from '@/lib/seo/metadata';
import { LocalizedHowItWorks } from '@/components/marketing/LocalizedHowItWorks';
import { FeatureHighlights } from '@/components/features/FeatureHighlights';

// Single source of truth: the English page renders from the marketing
// dictionary via the same component as /es and /fr, so the English copy and
// its translations can never drift. Edit the copy in
// content/marketing/i18n/en.json (then `npm run i18n:bless`).
export const metadata = buildMetadata({
  title: 'How SwingVantage Works — AI Swing Analysis in 4 Steps',
  description:
    'Learn how SwingVantage analyzes your swing in 4 steps: select your sport, upload data or video, get AI analysis, and follow your personalized practice plan.',
  path: '/how-it-works',
});

export default function HowItWorksPage() {
  return (
    <>
      <LocalizedHowItWorks locale="en" />
      {/* The four steps, each linked to its full feature guide (inbound links). */}
      <FeatureHighlights
        className="bg-card pb-14"
        heading="Go deeper on each step"
        blurb="Every step of the SwingVantage workflow is a feature with its own complete guide."
        slugs={[
          'swing-video-upload',
          'launch-monitor-csv-import',
          'ai-diagnostic-engine',
          'fix-stack',
          'practice-schedule',
          'retest',
        ]}
      />
    </>
  );
}
