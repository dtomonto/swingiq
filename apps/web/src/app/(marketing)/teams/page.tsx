import { buildMetadata } from '@/lib/seo/metadata';
import { AudienceLanding, type AudienceConfig } from '@/components/landing/AudienceLanding';

export const metadata = buildMetadata({
  title: 'SwingVantage for Teams — Affordable Swing Development',
  description:
    'Affordable, web-based swing-development support for teams, parents, and coaches. Give every player a clear priority and a plan. Start a team pilot.',
  path: '/teams',
  keywords: ['team swing analysis', 'youth team hitting', 'team development tool'],
});

const config: AudienceConfig = {
  slug: 'teams',
  name: 'Teams',
  leadSource: 'team',
  headline: 'Affordable swing development for your whole team',
  positioning:
    'SwingVantage gives every player on your team a clear top priority, beginner-safe drills, and a simple plan — supporting your coaches and parents between practices, at no cost to start.',
  benefits: [
    { title: 'Every player, one priority', desc: 'Each athlete gets their own focus instead of generic team drills.' },
    { title: 'Parents in the loop', desc: 'Parents can support practice with youth-safe, private-by-default tools.' },
    { title: 'No budget required', desc: 'Web-based and free to start — nothing to install.' },
  ],
  how: [
    'Players run free analyses and get individual priorities.',
    'Coaches and parents support those priorities between team practices.',
    'The team retests and tracks progress over a season.',
  ],
  ctaLabel: 'Start a team pilot',
  captureHeading: 'Start a team pilot',
  captureSub: 'Tell us about your team and we’ll help you roll it out.',
};

export default function Page() {
  return <AudienceLanding config={config} />;
}
