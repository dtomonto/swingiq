import { buildMetadata } from '@/lib/seo/metadata';
import { PracticePlanTool } from './PracticePlanTool';

export const metadata = buildMetadata({
  title: 'Free Practice Plan Generator',
  description:
    'Build a focused 7-day or 30-day swing practice plan with success metrics and a retest schedule. Free for golf, tennis, baseball, and softball.',
  path: '/tools/practice-plan-generator',
  keywords: ['practice plan generator', 'swing practice plan', '7 day plan', '30 day plan'],
});

export default function Page() {
  return <PracticePlanTool />;
}
