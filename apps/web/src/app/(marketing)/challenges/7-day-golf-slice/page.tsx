import { buildMetadata } from '@/lib/seo/metadata';
import { ChallengeView } from '@/components/challenge/ChallengeView';
import { CHALLENGES } from '@/content/challenges';

const challenge = CHALLENGES['7-day-golf-slice'];

export const metadata = buildMetadata({
  title: challenge.title,
  description: challenge.metaDescription,
  path: `/challenges/${challenge.slug}`,
  keywords: ['7 day slice challenge', 'fix slice in a week', 'golf slice plan'],
});

export default function Page() {
  return <ChallengeView challenge={challenge} />;
}
