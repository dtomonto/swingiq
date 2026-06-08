// ============================================================
// /admin/security-os/settings — securityOS settings
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = { title: 'Settings | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SecuritySettingsPage() {
  const ctx = await requireSecurityAccess();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
        <ArrowLeft className="h-3.5 w-3.5" /> securityOS
      </Link>
      <PageHeader
        title="securityOS settings"
        icon={SettingsIcon}
        description="Tune the Security Health Score weights, due-date rules, audit-log retention and AI-security strictness. Safe defaults are provided — changes are saved in your browser and recorded in the audit log."
      />

      <SettingsClient actor={ctx.email ?? 'admin'} />

      <HelpPanel>
        <p>
          <strong className="text-gray-300">Weights</strong> control how much each domain contributes to the
          overall score. They&apos;re normalized at scoring time, so they don&apos;t need to sum to 100.
        </p>
        <p>
          <strong className="text-gray-300">AI strictness</strong> set to <em>strict</em> treats partial AI
          checks as failures — useful once you&apos;re actively hardening the AI surface.
        </p>
      </HelpPanel>
    </div>
  );
}
