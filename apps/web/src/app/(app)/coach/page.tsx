import type { Metadata } from 'next';
import { CoachDashboard } from '@/components/motion-lab/CoachDashboard';

export const metadata: Metadata = {
  title: 'Coach & Team — Motion Lab | SwingIQ',
  description:
    'A local-first roster for coaches, parents, and teams: group Motion Lab sessions by athlete and see per-athlete progress plus team-level aggregate weaknesses and upload tracking. Everything stays on your device.',
};

export default function CoachPage() {
  return <CoachDashboard />;
}
