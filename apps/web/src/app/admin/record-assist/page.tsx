// ============================================================
// /admin/record-assist — RecordAssist Vision management console
// ------------------------------------------------------------
// Admin-guarded by app/admin/layout (ADMIN_EMAILS allowlist / ADMIN_SECRET).
// RecordAssist is pure + local-first, so this hands off to a client console
// that drives the REAL engines (preset catalog, voice catalog, readiness
// thresholds, and a no-camera QA simulator). No network round-trip.
// ============================================================

import type { Metadata } from 'next';
import { Video } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { RecordAssistAdminDashboard } from './RecordAssistAdminDashboard';

export const metadata: Metadata = {
  title: 'RecordAssist | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

export default function RecordAssistAdminPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="RecordAssist Vision"
        icon={Video}
        description="Manage the guided on-device self-recording system: sport/action presets, the Frame Readiness scoring model, the voice-guidance catalog, device-compatibility tiers, and a camera-free QA simulator that runs the real engines. Toggle the feature itself from Feature Flags (record_assist.enabled)."
      />
      <RecordAssistAdminDashboard />
    </div>
  );
}
