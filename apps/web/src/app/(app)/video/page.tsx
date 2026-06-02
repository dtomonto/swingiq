// ============================================================
// /video — Swing Video Analyzer
// Dispatches to the golf analyzer or the multi-sport analyzer
// based on the user's active sport selection.
// ============================================================

import type { Metadata } from 'next';
import { VideoPageRouter } from './VideoPageRouter';

export const metadata: Metadata = {
  title: 'Swing Video Analyzer | SwingIQ',
  description:
    'Upload your swing video for phase-by-phase coaching, drill recommendations, and optional AI narrative — for golf, tennis, baseball, and softball.',
};

export default function VideoPage() {
  return (
    <>
      <VideoPageRouter />
    </>
  );
}
