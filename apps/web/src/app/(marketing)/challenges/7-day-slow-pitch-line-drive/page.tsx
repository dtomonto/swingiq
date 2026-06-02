import { buildMetadata } from '@/lib/seo/metadata';
import { ChallengeView } from '@/components/challenge/ChallengeView';
import { CHALLENGES } from '@/content/challenges';

const challenge = CHALLENGES['7-day-slow-pitch-line-drive'];

export const metadata = buildMetadata({
  title: challenge.title,
  description: challenge.metaDescription,
  path: `/challenges/${challenge.slug}`,
  keywords: ['slow pitch line drive challenge', 'stop popping up', 'softball hitting plan'],
});

export default function Page() {
  return <ChallengeView challenge={challenge} />;
}
