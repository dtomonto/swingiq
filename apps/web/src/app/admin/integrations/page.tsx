// ============================================================
// /admin/integrations — connected services & safe configuration
// ------------------------------------------------------------
// Shows every integration's connection state and the env var NAMES an
// operator would set to connect it. SECURITY: secret VALUES are never
// read or rendered here — only whether a key is present.
// ============================================================

import type { Metadata } from 'next';
import { Plug, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import { KeysManager } from '@/components/admin/KeysManager';
import { getSystemStatus } from '@/lib/admin/data/system';

export const metadata: Metadata = { title: 'Integrations | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function IntegrationsPage() {
  const { integrations, connectedCount, totalCount } = getSystemStatus();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Integrations"
        icon={Plug}
        description="Every external service SwingVantage can use. Each is keyless-first: with no key set the product still works in a safe fallback mode. Connect a key to unlock the upgrade."
        actions={<RecheckButton label="Test connections" />}
      />

      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-sm text-emerald-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>
          {connectedCount} of {totalCount} connected. This page shows only whether a key is present — never
          its value.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {integrations.map((i) => (
          <SectionCard key={i.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-100">{i.name}</p>
                <p className="text-[11px] uppercase tracking-wide text-gray-600">{i.category}</p>
              </div>
              <StatusBadge tone={i.connected ? 'success' : 'neutral'}>
                {i.connected ? 'Connected' : 'Not connected'}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm text-gray-400">{i.detail}</p>
            {i.envVars.length > 0 && (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-gray-600">Configure with</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {i.envVars.map((v) => (
                    <code key={v} className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px] text-gray-300">
                      {v}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        ))}
      </div>

      <div className="border-t border-gray-800 pt-6">
        <KeysManager />
      </div>

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> The connection status of every third-party
          service. Keys are set as environment variables (in <code>.env.local</code> for development or in
          your host&apos;s dashboard for production), then the app picks them up on the next deploy/restart.
        </p>
        <p>
          <strong className="text-gray-300">Security.</strong> Secrets are never displayed or sent to the
          browser — only the boolean &ldquo;is it configured&rdquo; is. <em>Test connections</em> re-reads the
          server&apos;s view of which keys are present.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> For full admin functionality, connect
          Supabase and set <code>SUPABASE_SERVICE_ROLE_KEY</code> so cross-user sections (Users, Athletes,
          Media, AI Analyses) can load real data.
        </p>
      </HelpPanel>
    </div>
  );
}
