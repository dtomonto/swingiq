import type { Metadata } from 'next';
import { MotionLabGate } from '@/components/motion-lab/MotionLabGate';

export const metadata: Metadata = {
  title: 'Motion Lab — 3D Motion Analysis | SwingVantage',
  description:
    'Upload or record a swing, serve, pitch, or throw and get an on-device 3D motion reconstruction, sport-specific phase breakdown, biomechanical metrics, and a practical coaching plan — for golf, tennis, baseball, and softball.',
};

export default function MotionLabPage() {
  // Gated by the `motion_lab.enabled` operator flag (admin → Feature Flags).
  return <MotionLabGate />;
}
