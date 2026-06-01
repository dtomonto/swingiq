import { buildMetadata } from '@/lib/seo/metadata';
import { SavingsCalculatorTool } from './SavingsCalculatorTool';

export const metadata = buildMetadata({
  title: 'Private Lesson Savings Calculator',
  description:
    'Estimate your yearly lesson spend and see how practicing the right priority between sessions can help you get more from each lesson. Free.',
  path: '/tools/private-lesson-savings-calculator',
  keywords: ['golf lesson cost', 'lesson savings calculator', 'private lesson cost'],
});

export default function Page() {
  return <SavingsCalculatorTool />;
}
