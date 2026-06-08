// ============================================================
// /admin/security-os/findings/[id] — finding detail + workflow
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireSecurityAccess } from '@/lib/security-os/access.server';
import { runSecurityScan } from '@/lib/security-os/generate.server';
import { FindingDetailClient } from './FindingDetailClient';

export const metadata: Metadata = { title: 'Finding | securityOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSecurityAccess();
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const scan = runSecurityScan();
  const finding = scan.findings.find((f) => f.id === decoded);
  if (!finding) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Link href="/admin/security-os/findings" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
        <ArrowLeft className="h-3.5 w-3.5" /> All findings
      </Link>
      <FindingDetailClient actor={ctx.email ?? 'admin'} finding={finding} generatedAt={scan.generatedAt} />
    </div>
  );
}
