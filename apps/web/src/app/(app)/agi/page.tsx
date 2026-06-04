import type { Metadata } from 'next';
import { AthleteGIDashboard } from '@/components/agi/AthleteGIDashboard';

export const metadata: Metadata = {
  title: 'Athlete General Intelligence | SwingIQ',
  description:
    'One reasoning engine across all your sports. Athlete General Intelligence fuses every motion you analyse into a single cross-sport athletic profile, finds the keystone skill that limits the most sports, shows what transfers between them, and builds one prioritised plan — honest, on-device, and explainable.',
};

export default function AthleteGIPage() {
  return <AthleteGIDashboard />;
}
