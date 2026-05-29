// ============================================================
// /admin/research — Research & Benchmark Admin Page
// Server component shell — client logic lives in ResearchAdminContent.tsx
// ============================================================

import type { Metadata } from 'next';
import { ResearchAdminContent } from './ResearchAdminContent';

export const metadata: Metadata = {
  title: 'Research Admin | SwingIQ',
  robots: 'noindex, nofollow',
};

export default function ResearchAdminPage() {
  return <ResearchAdminContent />;
}
