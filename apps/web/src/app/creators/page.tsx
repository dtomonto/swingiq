import { buildMetadata } from '@/lib/seo/metadata';
import { AudienceLanding, type AudienceConfig } from '@/components/landing/AudienceLanding';

export const metadata = buildMetadata({
  title: 'SwingIQ for Creators — Support Educational Swing Content',
  description:
    'SwingIQ supports educational swing-analysis content for creators. Collaborate with us on honest, helpful instructional material.',
  path: '/creators',
  keywords: ['swing analysis creator', 'golf content creator', 'instructional content'],
});

const config: AudienceConfig = {
  slug: 'creators',
  name: 'Creators',
  leadSource: 'creator',
  headline: 'Make better educational swing-analysis content',
  positioning:
    'SwingIQ supports creators who make honest, educational swing-analysis content. Use it to illustrate priorities, drills, and progress — without overclaiming or faking results.',
  benefits: [
    { title: 'Clear visuals', desc: 'Priority-first breakdowns and drills make for clean, teachable segments.' },
    { title: 'Honest by design', desc: 'No fake ratings or guaranteed-outcome claims — content you can stand behind.' },
    { title: 'Multi-sport', desc: 'Golf, tennis, baseball, and softball, all in one tool.' },
  ],
  how: [
    'Use SwingIQ to analyze example swings for your content.',
    'Show the single top priority and the drills that address it.',
    'Point your audience to a free analysis so they can try it themselves.',
  ],
  ctaLabel: 'Collaborate with SwingIQ',
  captureHeading: 'Collaborate with SwingIQ',
  captureSub: 'Tell us about your content and audience and we’ll explore working together.',
  showCoachNotice: false,
};

export default function Page() {
  return <AudienceLanding config={config} />;
}
