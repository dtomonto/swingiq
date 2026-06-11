// ============================================================
// /admin/setup — Setup & Next Steps
// ------------------------------------------------------------
// The beginner's control panel: every manual thing the owner might need to
// do (add a key, run a database file, verify DNS) laid out as plain-English
// cards with exact copy-paste values and a live "Done / Action needed"
// status. New items appear on their own — env/key tasks are detected from
// the live environment, and database files + `Setup:` commit trailers are
// auto-discovered by scripts/scan-setup.mjs.
// ============================================================

import type { Metadata } from 'next';
import { Rocket } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SetupBoard } from '@/components/admin/setup/SetupBoard';
import { loadAllSetupTasks } from '@/lib/admin/setup';
import { getSetupSignal } from '@/lib/admin/setup/status';

export const metadata: Metadata = { title: 'Setup & Next Steps | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function AdminSetupPage() {
  const tasks = loadAllSetupTasks();
  const signal = getSetupSignal(tasks);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Setup & Next Steps"
        icon={Rocket}
        description="Everything you might need to set up — in plain English, with the exact values to copy and where to paste them. Anything we can detect (a connected key, a live integration) shows a green ‘Done’ automatically; the rest you tick off as you go."
        actions={<StatusBadge tone="accent">Beginner-friendly</StatusBadge>}
      />

      <SetupBoard tasks={tasks} signal={signal} />

      <HelpPanel title="How this page works (and stays up to date)">
        <p>
          <strong className="text-foreground">Read top to bottom.</strong> Cards are sorted so the
          things that need action come first, with the most important ones (Required, then
          Recommended) at the top. Each card explains what it is, why it matters, the exact steps,
          and every value to copy.
        </p>
        <p>
          <strong className="text-foreground">Two kinds of ‘Done’.</strong> For anything we can see —
          a key you added, an integration that&apos;s connected — the card flips to{' '}
          <span className="text-success-text">Done</span> on its own and is marked “detected
          automatically”. For things we genuinely can&apos;t see from here (a database file you
          pasted into Supabase, a DNS record), use the <em>I&apos;ve done this</em> button to tick
          it off — that&apos;s remembered on this browser.
        </p>
        <p>
          <strong className="text-foreground">New items appear by themselves.</strong> Add a database
          file (<code>supabase-*.sql</code>) or ship a feature with a{' '}
          <code>Setup:</code> note in its commit, and a matching card shows up here automatically —
          no one has to remember to add it. Keys and integrations are read live every time you open
          this page.
        </p>
        <p>
          Most settings are entered in your hosting dashboard (<strong className="text-foreground">Vercel
          → Settings → Environment Variables</strong>) and take effect on the next deploy. Database
          files are pasted into <strong className="text-foreground">Supabase → SQL Editor</strong> and
          take effect immediately.
        </p>
      </HelpPanel>
    </div>
  );
}
