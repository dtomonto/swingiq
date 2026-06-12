// ============================================================
// /admin/ai-provider — AI Provider Control Center
// ------------------------------------------------------------
// One screen to see and steer the strategic AI routing: which provider + model
// handles each task (video understanding → Gemini, coach/reasoning → OpenAI,
// measurement → MediaPipe, narrative → Claude opt-in), whether each provider's
// key is configured, and a durable per-task override an operator can change
// WITHOUT a redeploy. The env-driven model config is the default; overrides
// only layer on top. Read = logs.view; changes = settings.manage.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Network, Coins, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { RecheckButton } from '@/components/admin/RecheckButton';
import { AiRoutingEditor } from '@/components/admin/AiRoutingEditor';
import { getEffectiveRouting } from '@/lib/ai/ai-ops/effective-routing';
import { getAiCallStats, getRecentAiCalls } from '@/lib/ai/ai-ops/call-log';

export const metadata: Metadata = {
  title: 'AI Provider Control Center | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export default async function AiProviderPage() {
  const [snapshot, callStats, recent] = await Promise.all([
    getEffectiveRouting('standard'),
    getAiCallStats(),
    getRecentAiCalls(12),
  ]);
  const configuredCount = snapshot.health.filter((h) => h.configured).length;
  const liveRoutes = snapshot.routes.filter((r) => r.enabled).length;
  const misrouted = snapshot.routes.filter(
    (r) => r.enabled && r.provider !== 'none' && r.provider !== 'mediapipe' && !r.providerConfigured,
  ).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="AI Provider Control Center"
        icon={Network}
        description="See and steer which provider + model handles each AI task. Gemini for video understanding, OpenAI for coaching & reasoning, MediaPipe for measurement, Claude for opt-in narrative. Change a route here — no redeploy."
        actions={<RecheckButton />}
      />

      {/* ── Headline ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Providers configured" value={`${configuredCount}/4`} hint="Keys detected" tone={configuredCount > 0 ? 'success' : 'muted'} />
        <MetricStat label="Tasks routed" value={String(snapshot.routes.length)} hint={`${liveRoutes} enabled`} tone="muted" />
        <MetricStat
          label="Misrouted tasks"
          value={String(misrouted)}
          hint={misrouted > 0 ? 'Pointed at a provider with no key' : 'All routes have a key'}
          tone={misrouted > 0 ? 'warning' : 'success'}
        />
        <MetricStat
          label="Override store"
          value={snapshot.source === 'upstash' ? 'Durable' : 'In-memory'}
          hint={snapshot.source === 'upstash' ? 'Upstash, fleet-wide' : 'This instance only'}
          tone={snapshot.source === 'upstash' ? 'success' : 'muted'}
        />
      </div>

      {/* ── Provider health ──────────────────────────────── */}
      <SectionCard
        title="Provider health"
        description="Whether each provider can actually run. A route pointed at an unconfigured provider falls back to the keyless/data-grounded path until a key is set on the Integrations page."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {snapshot.health.map((h) => (
            <div key={h.provider} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {h.configured ? (
                    <ShieldCheck className="h-4 w-4 shrink-0 text-success-text" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 shrink-0 text-warning-text" />
                  )}
                  <span className="text-sm font-medium text-foreground">{h.label}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{h.detail}</p>
              </div>
              <StatusBadge tone={h.configured ? 'healthy' : 'warning'}>
                {h.configured ? 'Ready' : 'No key'}
              </StatusBadge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Routing table (editable) ─────────────────────── */}
      <SectionCard
        title="Task routing"
        description="Each AI task and the provider + model that handles it. Edit a route to override the default; reset any time. Measurement is locked to the on-device CV layer by design."
      >
        <AiRoutingEditor initialRoutes={snapshot.routes} source={snapshot.source} />
      </SectionCard>

      {/* ── Observability ────────────────────────────────── */}
      <SectionCard
        title="Recent AI activity"
        description="Sanitized metadata for the most recent AI calls — provider, model, latency, success/fallback, structured-output health. No prompts, responses, or PII are ever logged."
      >
        {callStats.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No AI calls recorded yet. Activity appears here once a provider key is set and the app makes its first
            coaching or video call.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricStat label="Calls logged" value={String(callStats.total)} hint="Recent window" tone="muted" />
              <MetricStat label="Success rate" value={pct(callStats.okRate)} hint={`${pct(callStats.fallbackRate)} fell back`} tone={callStats.okRate >= 0.9 ? 'success' : callStats.okRate >= 0.6 ? 'warning' : 'muted'} />
              <MetricStat label="Avg latency" value={callStats.avgLatencyMs == null ? '—' : `${callStats.avgLatencyMs} ms`} hint="Across providers" tone="muted" />
              <MetricStat label="Schema failures" value={pct(callStats.schemaFailureRate)} hint="Of structured calls" tone={callStats.schemaFailureRate > 0.1 ? 'warning' : 'success'} />
            </div>

            {callStats.byProvider.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">By provider</p>
                <ul className="divide-y divide-border">
                  {callStats.byProvider.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
                      <span className="font-medium text-foreground">{p.provider}</span>
                      <span className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                        <span>{p.calls} call{p.calls === 1 ? '' : 's'}</span>
                        <span>{p.avgLatencyMs == null ? '—' : `${p.avgLatencyMs} ms`}</span>
                        {p.fallbackCalls > 0 && <span className="text-warning-text">{p.fallbackCalls} fallback</span>}
                        {p.schemaFailures > 0 && <span className="text-warning-text">{p.schemaFailures} schema-fail</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> Latest calls
              </p>
              <ul className="space-y-1">
                {recent.calls.map((c, i) => (
                  <li key={`${c.at}-${i}`} className="flex items-center justify-between gap-2 rounded border border-border bg-background px-2.5 py-1.5 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.ok ? 'bg-success' : 'bg-warning'}`} />
                      <span className="font-medium text-foreground">{c.op}</span>
                      <span className="truncate text-muted-foreground">{c.provider}{c.model ? ` · ${c.model}` : ''}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">
                      {c.latencyMs != null && <span>{c.latencyMs} ms</span>}
                      <span>{c.ok ? 'ok' : (c.fallback ?? 'fail')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              Source: {callStats.source === 'upstash' ? 'shared across instances (Upstash).' : 'per-instance memory — set Upstash for fleet-wide history.'}{' '}
              Cost shown elsewhere on <Link className="text-success-text hover:underline" href="/admin/ai-usage">AI Usage &amp; Billing</Link>.
            </p>
          </div>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The strategic routing layer: the best provider
          for each job, not one provider for everything. Defaults follow each provider&apos;s strengths — Gemini for
          video understanding, OpenAI for coaching/reasoning + structured plans, MediaPipe for objective
          biomechanics, Claude for optional narrative polish.
        </p>
        <p>
          <strong className="text-foreground">Defaults vs. overrides.</strong> Model IDs and provider choices come
          from env (<code className="rounded bg-muted px-1 text-foreground">GEMINI_VIDEO_*</code>,{' '}
          <code className="rounded bg-muted px-1 text-foreground">OPENAI_COACH_*</code>, …). An override set here
          layers on top and persists{' '}
          {snapshot.source === 'upstash' ? 'fleet-wide via Upstash' : 'on this instance until restart'}. Leaving a
          model blank uses the provider&apos;s tier default.
        </p>
        <p>
          <strong className="text-foreground">Structured report (orchestrator).</strong> On the video-analysis path
          the frame vision is bridged into normalized evidence and turned into a structured{' '}
          <em>one fix / one plan / one retest</em> report. The OpenAI{' '}
          <code className="rounded bg-muted px-1 text-foreground">coach_synthesis</code> step is opt-in — set{' '}
          <code className="rounded bg-muted px-1 text-foreground">ENABLE_AIO_COACH_SYNTHESIS=true</code> to run it
          (one extra call per analysis, budget-gated). When off, a deterministic vision-derived report is returned at
          no extra cost. Privacy is unchanged: only frames + numeric pose proxies are ever sent — never the video.
        </p>
        <p>
          <strong className="text-foreground">Spend &amp; keys.</strong> Track cost and caps on{' '}
          <Link className="text-success-text hover:underline" href="/admin/ai-usage">AI Usage &amp; Billing</Link>{' '}
          <Coins className="inline h-3 w-3" />, and add provider keys on{' '}
          <Link className="text-success-text hover:underline" href="/admin/integrations">Integrations</Link>.
        </p>
      </HelpPanel>
    </div>
  );
}
