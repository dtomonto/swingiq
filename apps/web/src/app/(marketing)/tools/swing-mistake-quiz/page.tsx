import { buildMetadata } from '@/lib/seo/metadata';
import { SwingMistakeQuizTool } from './SwingMistakeQuizTool';

export const metadata = buildMetadata({
  title: 'Swing Mistake Quiz — Golf, Tennis, Baseball & Softball',
  description:
    'Pick your sport and most common result to find your likely top swing issue, a key checkpoint, drills, and a practice plan — free, no account.',
  path: '/tools/swing-mistake-quiz',
  keywords: ['swing mistake quiz', 'swing fault finder', 'hitting quiz', 'golf tennis baseball softball'],
});

export default function Page() {
  return <SwingMistakeQuizTool />;
}
