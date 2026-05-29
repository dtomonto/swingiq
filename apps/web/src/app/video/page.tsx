import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { VideoAnalyzerContent } from './VideoAnalyzerContent';

export const metadata: Metadata = {
  title: 'Swing Video Analyzer | SwingIQ',
  description:
    'Upload your golf swing video, get phase-by-phase coaching, drill recommendations, and an optional AI coach narrative.',
};

export default function VideoPage() {
  return (
    <AppShell>
      <VideoAnalyzerContent />
    </AppShell>
  );
}
