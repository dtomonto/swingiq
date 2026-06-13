import { buildMetadata } from '@/lib/seo/metadata';
import { SwingTempoTrainerTool } from './SwingTempoTrainerTool';

export const metadata = buildMetadata({
  title: 'Free Swing Tempo Trainer — Groove the 3:1 Rhythm',
  description:
    'A free audio-visual swing tempo trainer. Play the classic 3:1 backswing-to-downswing rhythm (Set, Top, Strike) with a pendulum that keeps time. No account, nothing recorded.',
  path: '/tools/swing-tempo-trainer',
  keywords: ['swing tempo trainer', 'golf tempo metronome', '3 to 1 tempo', 'golf swing rhythm', 'tempo training aid'],
});

export default function Page() {
  return <SwingTempoTrainerTool />;
}
