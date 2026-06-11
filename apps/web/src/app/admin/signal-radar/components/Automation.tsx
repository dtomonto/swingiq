'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Webhook, Database, Rss, Copy, KeyRound, Send, CheckCircle2, ExternalLink, Zap } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { BadgeTone } from '@/components/admin/StatusBadge';
import type { SignalRadarConfig, AutomationStatus } from '@/lib/signal-radar/types';
import { Btn, INPUT_CLS } from './ui';
import { ScheduledCollection } from './ScheduledCollection';

/** Strong random secret (URL-safe), generated in the browser. */
function generateSecret(): string {
  const bytes = new Uint8Array(24);
  (globalThis.crypto ?? window.crypto).getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function originUrl(path: string): string {
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export function Automation({ automation, config, onUpdate }: {
  automation: AutomationStatus;
  config: SignalRadarConfig;
  onUpdate: (patch: Partial<SignalRadarConfig>) => void;
}) {
  const { storeEnabled, webhookConfigured, cronConfigured, envFeedCount } = automation;
  const hasSource = webhookConfigured || envFeedCount > 0;
  const level: 'on' | 'partial' | 'off' =
    storeEnabled && hasSource ? 'on' : (storeEnabled || hasSource) ? 'partial' : 'off';

  const LEVEL: Record<typeof level, { tone: BadgeTone; label: string; summary: string }> = {
    on: { tone: 'success', label: 'On', summary: 'Automated collection is live — new signals land in the inbox as “Ingested”.' },
    partial: { tone: 'warning', label: 'Partial', summary: 'Almost there — finish the steps below to start collecting automatically.' },
    off: { tone: 'neutral', label: 'Off', summary: 'Automated collection is off. Today, add or import signals manually; turn on automation below.' },
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title={<span className="flex items-center gap-2"><Zap className="h-4 w-4 text-link" /> Automated collection</span>}
        description="Let signals arrive on their own — pushed by your automations (webhook) or pulled from feeds on a schedule. Secrets are set in your deploy env (the dashboard can’t write them), so each step below hands you exactly what to paste."
        actions={<StatusBadge tone={LEVEL[level].tone}>{LEVEL[level].label}</StatusBadge>}
      >
        <p className="text-sm text-foreground">{LEVEL[level].summary}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <MiniStat label="Durable store" ok={storeEnabled} okText="Connected" offText="Required" />
          <MiniStat label="Webhook" ok={webhookConfigured} okText="Configured" offText="Off" />
          <MiniStat label="Scheduled feeds" ok={envFeedCount > 0} okText={`${envFeedCount} via env`} offText="Not scheduled" />
        </div>
      </SectionCard>

      {/* Step 1 — durable store (the gate) */}
      <StepCard n={1} icon={Database} title="Durable store" tone={storeEnabled ? 'success' : 'warning'}
        status={storeEnabled ? 'Connected' : 'Action needed'}>
        {storeEnabled ? (
          <p className="text-sm text-muted-foreground">Connected. Automatically-collected signals persist and appear in your inbox across sessions.</p>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Automated signals need somewhere to live. This uses your existing Supabase (service-role) — no new tables. Until it’s configured, the webhook and feed poller accept requests but persist nothing (and say so).</p>
            <Link href="/admin/setup" className="inline-flex items-center gap-1 text-link hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Open Setup to configure Supabase</Link>
          </div>
        )}
      </StepCard>

      {/* Step 2 — webhook */}
      <WebhookStep configured={webhookConfigured} />

      {/* Step 3 — scheduled feeds */}
      <FeedsStep cronConfigured={cronConfigured} envFeedCount={envFeedCount} config={config} onUpdate={onUpdate} />
    </div>
  );
}

function MiniStat({ label, ok, okText, offText }: { label: string; ok: boolean; okText: string; offText: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <StatusBadge tone={ok ? 'success' : 'neutral'}>{ok ? okText : offText}</StatusBadge>
    </div>
  );
}

function StepCard({ n, icon: Icon, title, status, tone, children }: {
  n: number; icon: typeof Database; title: string; status: string; tone: BadgeTone; children: React.ReactNode;
}) {
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">{n}</span>
          <Icon className="h-4 w-4 text-muted-foreground" /> {title}
        </span>
      }
      actions={<StatusBadge tone={tone}>{status}</StatusBadge>}
    >
      {children}
    </SectionCard>
  );
}

function CopyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try { void navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex items-stretch gap-2">
        <code className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">{value}</code>
        <Btn size="sm" onClick={copy}><Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Copy'}</Btn>
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function WebhookStep({ configured }: { configured: boolean }) {
  const [secret, setSecret] = useState('');
  const [testSecret, setTestSecret] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const test = async () => {
    if (!testSecret.trim()) { setResult('Paste the secret you set in the deploy env to test.'); return; }
    setTesting(true); setResult(null);
    try {
      const res = await fetch('/api/signal-radar/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-signalradar-secret': testSecret.trim() },
        body: JSON.stringify({ title: 'SignalRadar webhook test', text: 'SignalRadar webhook connectivity test — safe to archive.', sourceType: 'webhook' }),
      });
      if (res.status === 404) setResult('404 — SIGNALRADAR_WEBHOOK_SECRET isn’t set on the server yet. Set it + redeploy, then test again.');
      else if (res.status === 401) setResult('401 — that secret didn’t match the server’s. Double-check the deploy env value.');
      else if (res.status === 503) setResult('503 — secret matched, but the durable store (Step 1) isn’t configured, so nothing persists yet.');
      else if (res.ok) { const d = await res.json(); setResult(`✓ Working — a test signal was ingested (priority ${d.priority}). Find it in the inbox tagged “Ingested” and archive it.`); }
      else setResult(`Unexpected response (${res.status}).`);
    } catch { setResult('Network error reaching the webhook.'); }
    finally { setTesting(false); }
  };

  return (
    <StepCard n={2} icon={Webhook} title="Webhook (push from automations)" tone={configured ? 'success' : 'neutral'}
      status={configured ? 'Configured' : 'Off'}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Let Zapier, Make or your own scripts POST mentions in. {configured
            ? 'The secret is set — send mentions to the endpoint below.'
            : 'Generate a secret, set it as SIGNALRADAR_WEBHOOK_SECRET in your deploy env, then redeploy.'}
        </p>

        {!configured && (
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">1. Generate a secret</p>
              <Btn size="sm" tone="primary" onClick={() => setSecret(generateSecret())}><KeyRound className="h-3.5 w-3.5" /> Generate</Btn>
            </div>
            {secret && (
              <div className="mt-2">
                <CopyRow label="Set SIGNALRADAR_WEBHOOK_SECRET to this (then redeploy):" value={secret} />
              </div>
            )}
          </div>
        )}

        <CopyRow label="Endpoint" value={originUrl('/api/signal-radar/webhook')} hint="POST JSON { text, title?, url?, sourceType?, author? } with header  x-signalradar-secret: <your secret>" />

        <div className="rounded-lg border border-border bg-background/40 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Test the connection end-to-end</p>
          <div className="flex flex-wrap gap-2">
            <input value={testSecret} onChange={(e) => setTestSecret(e.target.value)} placeholder="Paste your secret to send a test mention" className={INPUT_CLS} type="password" />
            <Btn tone="primary" disabled={testing} onClick={test}><Send className="h-4 w-4" /> {testing ? 'Sending…' : 'Send test'}</Btn>
          </div>
          {result && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-link">
              {result.startsWith('✓') && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-text" />}{result}
            </p>
          )}
        </div>
      </div>
    </StepCard>
  );
}

function FeedsStep({ cronConfigured, envFeedCount, config, onUpdate }: {
  cronConfigured: boolean; envFeedCount: number; config: SignalRadarConfig; onUpdate: (patch: Partial<SignalRadarConfig>) => void;
}) {
  const [cronSecret, setCronSecret] = useState('');
  return (
    <StepCard n={3} icon={Rss} title="Scheduled feeds (pull on a schedule)" tone={envFeedCount > 0 ? 'success' : 'neutral'}
      status={envFeedCount > 0 ? `${envFeedCount} scheduled` : 'Not scheduled'}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Curate keyless RSS/feed URLs below and either <strong className="text-foreground">Run now</strong>, or wire a scheduler to pull them automatically:
          set <code className="rounded bg-muted px-1 text-[11px]">SIGNALRADAR_FEEDS</code> (use “Copy env”) and point any cron at the endpoint with your <code className="rounded bg-muted px-1 text-[11px]">CRON_SECRET</code>.
        </p>

        <ScheduledCollection config={config} onUpdate={onUpdate} />

        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Scheduler auth — CRON_SECRET</p>
            <StatusBadge tone={cronConfigured ? 'success' : 'neutral'}>{cronConfigured ? 'Set' : 'Not set'}</StatusBadge>
          </div>
          {!cronConfigured && (
            <div className="mt-2">
              <Btn size="sm" tone="primary" onClick={() => setCronSecret(generateSecret())}><KeyRound className="h-3.5 w-3.5" /> Generate CRON_SECRET</Btn>
              {cronSecret && <div className="mt-2"><CopyRow label="Set CRON_SECRET to this (then redeploy):" value={cronSecret} /></div>}
            </div>
          )}
          <div className="mt-3">
            <CopyRow label="Schedule this (GET, daily/hourly — Vercel Cron, GitHub Actions, cron-job.org…)" value={originUrl('/api/signal-radar/cron')} hint="Send header  Authorization: Bearer <CRON_SECRET>. It reads SIGNALRADAR_FEEDS and ingests new signals." />
          </div>
        </div>
      </div>
    </StepCard>
  );
}
