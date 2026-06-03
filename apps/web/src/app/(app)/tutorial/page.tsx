import type { Metadata } from 'next';
import { TutorialCenter } from '@/components/tutorial/TutorialCenter';

export const metadata: Metadata = {
  title: 'Tutorials · SwingIQ',
  description:
    'Short, guided video tutorials for SwingIQ — a tailored path for players, parents, coaches, and teams, plus one quick video for every feature.',
};

export default function TutorialPage() {
  return <TutorialCenter />;
}
