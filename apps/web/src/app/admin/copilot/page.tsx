// ============================================================
// /admin/copilot — Admin Copilot
// ------------------------------------------------------------
// A founder-facing assistant that answers questions about the platform
// from live admin data. The server builds a privacy-safe aggregate
// snapshot and a deterministic opening answer; the client console asks
// follow-ups via the read-only /api/admin/copilot endpoint.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { buildCopilotSnapshot } from '@/lib/admin/copilot/snapshot';
import { answerCopilotIntent } from '@/lib/admin/copilot/engine';
import { SUGGESTED_QUESTIONS } from '@/lib/admin/copilot/questions';
import { CopilotConsole } from './CopilotConsole';

export const metadata: Metadata = { title: 'Admin Copilot | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminCopilotPage() {
  const snapshot = await buildCopilotSnapshot();
  const initial = answerCopilotIntent(snapshot, 'next-best-action');

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Admin Copilot"
        icon={Sparkles}
        description="Ask plain-English questions about your platform — what to improve next, which sport is most active, what needs your review — and get answers computed from your live admin data. It only reads; it never publishes, emails or deletes."
        actions={
          <StatusBadge tone={snapshot.connected ? 'success' : 'warning'}>
            {snapshot.connected ? 'Live data' : 'Local mode'}
          </StatusBadge>
        }
      />

      <CopilotConsole
        initialAnswer={initial}
        suggested={SUGGESTED_QUESTIONS}
        meta={{ generatedAt: snapshot.generatedAt, connected: snapshot.connected }}
      />

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A read-only assistant for running
          SwingVantage. It composes the same honest data the rest of the dashboard uses — platform metrics,
          system health, smart alerts, the Action Center inbox and feature-education coverage — into answers
          you can act on. Every number is computed from real signals; when data is missing it tells you so
          rather than guessing.
        </p>
        <p>
          <strong className="text-foreground">Safety.</strong> The Copilot never takes destructive actions. It
          suggests next steps and links you to the tool that handles them, where you stay in control. By
          default it runs fully offline with no model calls (no AI spend). User data is used ethically to
          improve the product experience and is <em>never sold</em>.
        </p>
        <p>
          <strong className="text-foreground">Optional AI.</strong> A model layer can refine answers when an
          operator explicitly enables it (<code>ADMIN_COPILOT_AI=1</code> plus a registered adapter). When
          that happens, answers are clearly labeled <em>AI-assisted</em>. New here? Start with the{' '}
          <Link href="/admin/learning">Admin Academy</Link>.
        </p>
      </HelpPanel>
    </div>
  );
}
