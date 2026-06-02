import { buildMetadata } from '@/lib/seo/metadata';
import { GolfSliceFixerTool } from './GolfSliceFixerTool';

export const metadata = buildMetadata({
  title: 'Free Golf Slice Fixer Quiz',
  description:
    'Answer a few questions about your ball flight and get your likely slice pattern, top priority fix, three beginner-safe drills, and a free 7-day practice plan.',
  path: '/tools/golf-slice-fixer',
  keywords: ['golf slice fixer', 'fix my slice', 'slice diagnosis', 'golf slice drills'],
});

export default function Page() {
  return <GolfSliceFixerTool />;
}
