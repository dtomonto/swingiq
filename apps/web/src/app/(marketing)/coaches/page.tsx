import { buildMetadata } from '@/lib/seo/metadata';
import { AudienceLanding, type AudienceConfig } from '@/components/landing/AudienceLanding';
import { PERSONA_CTA_MAP } from '@/lib/personas/cta-map';

export const metadata = buildMetadata({
  title: 'SwingVantage for Coaches — Better Practice Between Sessions',
  description:
    'SwingVantage helps your athletes practice the right priority between lessons. It supports your coaching — it does not replace it. Start a free coach pilot.',
  path: '/coaches',
  keywords: ['swing analysis for coaches', 'coaching tool', 'golf coach software'],
});

const config: AudienceConfig = {
  slug: 'coaches',
  name: 'Coaches',
  leadSource: 'coach',
  headline: 'Help your athletes practice better between sessions',
  positioning:
    'SwingVantage gives your athletes a clear, single-priority focus and beginner-safe drills to work on between lessons — so they show up to your sessions further along. It supports your coaching; it does not replace it.',
  benefits: [
    { title: 'One priority, not twenty', desc: 'Athletes arrive knowing the one thing they were working on, not overwhelmed.' },
    { title: 'Shareable summaries', desc: 'Players can bring a privacy-safe text summary to lessons — no raw video required.' },
    { title: 'Free to try', desc: 'No cost to pilot with a few athletes and see if it fits your program.' },
  ],
  how: [
    'Your athletes run a free analysis and get their top priority + drills.',
    'They practice that priority between sessions and retest.',
    'They bring their SwingVantage summary to your lesson so you can confirm and fine-tune.',
  ],
  ctaLabel: PERSONA_CTA_MAP.coaches.ctaLabel,
  captureHeading: 'Start a free coach pilot',
  captureSub: 'Tell us about your program and we’ll help you get a few athletes set up.',
};

export default function Page() {
  return <AudienceLanding config={config} />;
}
