import { buildMetadata } from '@/lib/seo/metadata';
import { AudienceLanding, type AudienceConfig } from '@/components/landing/AudienceLanding';

export const metadata = buildMetadata({
  title: 'SwingIQ for Coaches — Better Practice Between Sessions',
  description:
    'SwingIQ helps your athletes practice the right priority between lessons. It supports your coaching — it does not replace it. Start a free coach pilot.',
  path: '/coaches',
  keywords: ['swing analysis for coaches', 'coaching tool', 'golf coach software'],
});

const config: AudienceConfig = {
  slug: 'coaches',
  name: 'Coaches',
  leadSource: 'coach',
  headline: 'Help your athletes practice better between sessions',
  positioning:
    'SwingIQ gives your athletes a clear, single-priority focus and beginner-safe drills to work on between lessons — so they show up to your sessions further along. It supports your coaching; it does not replace it.',
  benefits: [
    { title: 'One priority, not twenty', desc: 'Athletes arrive knowing the one thing they were working on, not overwhelmed.' },
    { title: 'Shareable summaries', desc: 'Players can bring a privacy-safe text summary to lessons — no raw video required.' },
    { title: 'Free to try', desc: 'No cost to pilot with a few athletes and see if it fits your program.' },
  ],
  how: [
    'Your athletes run a free analysis and get their top priority + drills.',
    'They practice that priority between sessions and retest.',
    'They bring their SwingIQ summary to your lesson so you can confirm and fine-tune.',
  ],
  ctaLabel: 'Start a free coach pilot',
  captureHeading: 'Start a free coach pilot',
  captureSub: 'Tell us about your program and we’ll help you get a few athletes set up.',
};

export default function Page() {
  return <AudienceLanding config={config} />;
}
