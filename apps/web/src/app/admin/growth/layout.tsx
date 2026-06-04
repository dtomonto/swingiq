// ============================================================
// /admin/growth — GrowthOS layout
// ------------------------------------------------------------
// Wraps every GrowthOS page in the navigation shell. Access control is
// inherited from the parent app/admin/layout.tsx (ADMIN_SECRET guard) —
// GrowthOS is admin-only and noindex.
// ============================================================

import type { Metadata } from 'next';
import { GrowthShell } from './_components/GrowthShell';

export const metadata: Metadata = {
  title: 'GrowthOS | SwingIQ',
  robots: 'noindex, nofollow',
};

export default function GrowthLayout({ children }: { children: React.ReactNode }) {
  return <GrowthShell>{children}</GrowthShell>;
}
