// ============================================================
// /admin/settings — site settings overview
// ------------------------------------------------------------
// Honest map of how SwingVantage is configured. Most settings are
// env/code-driven (versioned, testable), so this page shows the
// current values and where each lives rather than faking editable
// fields. Secrets are never shown — only whether they're set.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Settings as SettingsIcon } from 'lucide-react';
import { getServerCapabilities } from '@/lib/capabilities';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';

export const metadata: Metadata = { title: 'Settings | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

function Row({ label, value, where }: { label: string; value: React.ReactNode; where?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {where && <p className="mt-0.5 font-mono text-2xs text-muted-foreground/70">{where}</p>}
      </div>
      <div className="shrink-0 text-right text-sm text-foreground">{value}</div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const caps = getServerCapabilities();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Settings"
        icon={SettingsIcon}
        description="How SwingVantage is configured. Most settings live in environment variables and code so they're versioned and safe; this is the operator's map of the current values and where to change them."
      />

      <SectionCard title="Brand & identity">
        <div className="divide-y divide-border">
          <Row label="Product name" value="SwingVantage" where="brand config" />
          <Row label="Primary domain" value="swingvantage.com" where="deployment / DNS" />
          <Row label="Supported sports" value="7 (golf, tennis, pickleball, padel, baseball, slow/fast softball)" where="@swingiq/core registry" />
          <Row label="Theme system" value="7 curated themes" where="lib/theme" />
        </div>
      </SectionCard>

      <SectionCard title="Capabilities" description="Keyless-first — each is safe-off until a key is set.">
        <div className="divide-y divide-border">
          <Row label="Accounts & cloud sync" value={<StatusBadge tone={caps.auth ? 'success' : 'neutral'}>{caps.auth ? 'On' : 'Local'}</StatusBadge>} where="NEXT_PUBLIC_SUPABASE_*" />
          <Row label="AI coaching" value={<StatusBadge tone={caps.aiCoach ? 'success' : 'neutral'}>{caps.aiCoach ? 'On' : 'Templates'}</StatusBadge>} where="AI_PROVIDER" />
          <Row label="AI vision" value={<StatusBadge tone={caps.aiVision ? 'success' : 'neutral'}>{caps.aiVision ? 'On' : 'Off'}</StatusBadge>} where="AI_VISION_PROVIDER" />
          <Row label="Email delivery" value={<StatusBadge tone={caps.email ? 'success' : 'neutral'}>{caps.email ? 'On' : 'Local'}</StatusBadge>} where="RESEND_*" />
          <Row label="Billing" value={<StatusBadge tone={caps.billing ? 'success' : 'neutral'}>{caps.billing ? 'On' : 'Waitlist'}</StatusBadge>} where="STRIPE_*" />
          <Row label="Ads" value={<StatusBadge tone={caps.ads ? 'success' : 'neutral'}>{caps.ads ? 'On' : 'House only'}</StatusBadge>} where="NEXT_PUBLIC_ADS_*" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Manage connections on the <Link href="/admin/integrations" className="text-link hover:underline">Integrations</Link> page.
        </p>
      </SectionCard>

      <SectionCard title="Where to change things">
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>• <span className="text-foreground">Keys & connections</span> → environment variables (see Integrations).</li>
          <li>• <span className="text-foreground">Sport analysis</span> → the <code className="text-muted-foreground">@swingiq/core</code> registry (see <Link href="/admin/sports" className="text-link hover:underline">Sports</Link>).</li>
          <li>• <span className="text-foreground">Content</span> → data files (see <Link href="/admin/content" className="text-link hover:underline">Content</Link>).</li>
          <li>• <span className="text-foreground">Feature toggles</span> → <Link href="/admin/feature-flags" className="text-link hover:underline">Feature Flags</Link>.</li>
          <li>• <span className="text-foreground">Legal pages</span> → <Link href="/admin/legal" className="text-link hover:underline">Legal & Privacy</Link>.</li>
        </ul>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">Why settings aren&apos;t all editable here.</strong> SwingVantage
          keeps configuration in code and environment variables so changes are reviewable and can&apos;t be
          broken by a stray click. This page is the single place to see the current state and where each
          setting lives. A no-code editor for selected settings can be layered on later.
        </p>
      </HelpPanel>
    </div>
  );
}
