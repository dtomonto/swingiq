// ============================================================
// /admin/signal-radar — SignalRadar OS command center
// ------------------------------------------------------------
// SwingVantage's internal radar for public digital signals: who is
// talking about us, what the market is asking for, where the SEO /
// backlink / partnership / reputation opportunities are. Generation of
// adapter status + demo data is server-side (lib/signal-radar); operator
// signal data persists in the browser so it works in production's
// read-only filesystem (same model as securityOS / reliabilityOS).
// ============================================================

import type { Metadata } from 'next';
import { Radar } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireSignalRadarAccess } from '@/lib/signal-radar/access.server';
import { generateSignalRadarData } from '@/lib/signal-radar/generate.server';
import { SignalRadarApp } from './SignalRadarApp';

export const metadata: Metadata = { title: 'SignalRadar OS | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function SignalRadarPage() {
  const ctx = await requireSignalRadarAccess();
  const data = await generateSignalRadarData();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="SignalRadar OS"
        icon={Radar}
        description="Detect, classify and score who is talking about SwingVantage and what the market is asking for — then turn the strongest signals into content, product, partnership and reputation actions. Keyless-first: add or import signals today; every label and score traces to a real rule, and demo data is clearly marked."
        actions={
          <StatusBadge tone="success">{data.adapterSummary.live} live sources</StatusBadge>
        }
      />

      <SignalRadarApp
        actor={ctx.email ?? 'admin'}
        adapters={data.adapters}
        adapterSummary={data.adapterSummary}
        sampleSignals={data.sampleSignals}
        ingestedSignals={data.ingestedSignals}
        ingestEnabled={data.ingestEnabled}
        automation={data.automation}
        generatedAt={data.generatedAt}
      />

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A brand-intelligence command center: a Signal
          Inbox, sentiment / intent / sport / priority scoring, a Mention Map, competitor watch, AI answer-engine
          visibility, and one-click conversion of signals into content ideas, product feedback, partnership leads
          and reputation risks. Every signal answers “why does this matter, and what should we do next?”.
        </p>
        <p>
          <strong className="text-foreground">How it collects (safely).</strong> Keyless-first and ToS-safe — add a
          signal manually, or paste a Google Alerts digest, an RSS/Atom feed, or a CSV export. Automated adapters
          (Reddit, YouTube, Search Console, backlinks) are <em>scaffolded</em> and stay honest: they show as
          placeholders until credentials exist and never pretend to be collecting. No scraping, no robots.txt
          violations, no secrets in the UI.
        </p>
        <p>
          <strong className="text-foreground">How it’s honest.</strong> Classification is rules-based and explainable
          (open a signal to see why it was labelled). Priority is a transparent weighted sum you can tune in
          Settings. Demo signals are flagged “Sample” and excluded from anything implying a real mention.
        </p>
        <p>
          <strong className="text-foreground">How your work is saved.</strong> Collected signals, triage, notes,
          conversions and settings live in your browser, so this works in production and survives reloads.
        </p>
      </HelpPanel>
    </div>
  );
}
