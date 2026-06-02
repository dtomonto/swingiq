import { buildMetadata } from '@/lib/seo/metadata';
import { ChallengeView } from '@/components/challenge/ChallengeView';
import { CHALLENGES } from '@/content/challenges';

const challenge = CHALLENGES['30-day-swingiq'];

export const metadata = buildMetadata({
  title: challenge.title,
  description: challenge.metaDescription,
  path: `/challenges/${challenge.slug}`,
  keywords: ['30 day swing challenge', 'swing improvement plan', 'practice challenge'],
});

export default function Page() {
  return <ChallengeView challenge={challenge} />;
}
