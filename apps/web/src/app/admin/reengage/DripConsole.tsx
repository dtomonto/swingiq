'use client';

// ============================================================
// Drip Marketing Console — client UI over lib/reengage.
// Three views: Drip Cycle (lifecycle timeline), Campaigns (per-campaign
// breakdown + inline strategy editing), Strategy (analysis + health).
// All edits are local-first (strategy-store) and draft-first.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Mail, Bell, Smartphone, Clock, Zap, AlertTriangle, CheckCircle2, Copy, RotateCcw,
  Route, Gauge, Power, Pencil, ArrowRight, Info,
} from 'lucide-react';
import {
  useReengageStrategy, campaignPayloads, exportStrategyJson, DRIP_STAGES,
  type DripCampaign, type StrategyHealth,
} from '@/lib/reengage';
import type { NudgeChannel } from '@/lib/reengage';

const CHANNEL_META: Record<NudgeChannel, { label: string; Icon: typeof Mail }> = {
  in_app: { label: 'In-app', Icon: Smartphone },
  push: { label: 'Push', Icon: Bell },
  email: { label: 'Email', Icon: Mail },
};
const ALL_CHANNELS: NudgeChannel[] = ['in_app', 'push', 'email'];

type Tab = 'cycle' | 'campaigns' | 'strategy';

export function DripConsole({ emailConfigured }: { emailConfigured: boolean }) {
  const ctx = useMemo(() => ({ emailConfigured }), [emailConfigured]);
  const s = useReengageStrategy(ctx);
  const [tab, setTab] = useState<Tab>('cycle');

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Drip Marketing</h1>
          <HealthPill health={s.analysis.health} />
        </div>
        <p className="text-sm text-muted-foreground">
          The full re-engagement drip cycle — every lifecycle campaign, its audience, cadence and copy.{' '}
          <span className="text-link">Draft-first: nothing sends from this screen.</span> Tune the
          strategy here, then export it to commit into the engine.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Stat label="Campaigns" value={`${s.analysis.enabledCampaigns}/${s.analysis.totalCampaigns} active`} />
          <Stat label="Customized" value={`${s.customizedCount}`} />
          <Stat
            label="Email delivery"
            value={emailConfigured ? 'Configured' : 'Not configured'}
            tone={emailConfigured ? 'good' : 'warn'}
          />
        </div>
      </header>

      <nav className="flex gap-1 border-b border-border">
        {([['cycle', 'Drip Cycle'], ['campaigns', 'Campaigns'], ['strategy', 'Strategy']] as [Tab, string][]).map(
          ([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-success text-success-text'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </nav>

      {tab === 'cycle' && <CycleView campaigns={s.campaigns} />}
      {tab === 'campaigns' && (
        <CampaignsView
          campaigns={s.campaigns}
          emailConfigured={emailConfigured}
          setOverride={s.setOverride}
          resetOverride={s.resetOverride}
        />
      )}
      {tab === 'strategy' && (
        <StrategyView
          analysis={s.analysis}
          settings={s.settings}
          customizedCount={s.customizedCount}
          overrides={s.overrides}
          setSettings={s.setSettings}
          resetAll={s.resetAll}
        />
      )}
    </div>
  );
}

// ── Shared bits ──────────────────────────────────────────────

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' }) {
  const color =
    tone === 'good' ? 'text-success-text' : tone === 'warn' ? 'text-link' : 'text-foreground';
  return (
    <span className="rounded-lg border border-border bg-card px-3 py-1.5">
      <span className="text-muted-foreground">{label}: </span>
      <span className={`font-medium ${color}`}>{value}</span>
    </span>
  );
}

function bandColor(band: StrategyHealth['band']): string {
  return band === 'excellent'
    ? 'text-success-text'
    : band === 'good'
      ? 'text-success-text'
      : band === 'fair'
        ? 'text-link'
        : 'text-error-text';
}

function HealthPill({ health }: { health: StrategyHealth }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
      <Gauge className={`h-4 w-4 ${bandColor(health.band)}`} />
      <span className={`text-lg font-bold ${bandColor(health.band)}`}>{health.score}</span>
      <span className="text-xs text-muted-foreground">/100 · {health.band.replace('-', ' ')}</span>
    </div>
  );
}

function ChannelChips({ channels }: { channels: NudgeChannel[] }) {
  if (channels.length === 0) {
    return <span className="text-[11px] text-error-text">no channels</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {channels.map((c) => {
        const { label, Icon } = CHANNEL_META[c];
        return (
          <span
            key={c}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground"
          >
            <Icon className="h-3 w-3" /> {label}
          </span>
        );
      })}
    </div>
  );
}

// ── View 1: Drip Cycle (lifecycle timeline) ──────────────────

function CycleView({ campaigns }: { campaigns: DripCampaign[] }) {
  const timeline = [...campaigns]
    .filter((c) => c.kind === 'timeline')
    .sort((a, b) => (a.dayThreshold ?? 0) - (b.dayThreshold ?? 0));
  const events = campaigns.filter((c) => c.kind === 'event');

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
        <Route className="mt-0.5 h-4 w-4 shrink-0 text-success-text" />
        <p>
          As a player goes quiet, the engine escalates along this timeline (by days since last activity).
          It delivers <strong className="text-foreground">at most one</strong> nudge at a time — the highest-priority
          one that applies. Event-based campaigns fire on a behaviour rather than a day count.
        </p>
      </div>

      {/* Timeline rail */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Lifecycle timeline</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {timeline.map((c, i) => (
            <div key={c.triggerId} className="relative">
              {i < timeline.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-8 z-10 hidden h-4 w-4 text-muted-foreground/60 lg:block" />
              )}
              <TimelineCard campaign={c} />
            </div>
          ))}
        </div>
      </div>

      {/* Event-based */}
      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Zap className="h-4 w-4 text-link" /> Event-based campaigns
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {events.map((c) => (
            <TimelineCard key={c.triggerId} campaign={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineCard({ campaign: c }: { campaign: DripCampaign }) {
  const stageLabel = DRIP_STAGES.find((s) => s.id === c.stage)?.label ?? c.stage;
  return (
    <div
      className={`flex h-full flex-col rounded-xl border bg-card p-4 ${
        c.enabled ? 'border-border' : 'border-border/50 opacity-60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success-text">
          {c.kind === 'timeline' && c.dayThreshold != null ? `Day ${c.dayThreshold}+` : stageLabel}
        </span>
        {!c.enabled && <span className="text-[10px] font-medium text-muted-foreground">off</span>}
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{c.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{c.cohortDescription}</p>
      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">“{c.message.title}”</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <ChannelChips channels={c.channels} />
        <span className="shrink-0 text-[10px] text-muted-foreground/70">P{c.priority}</span>
      </div>
    </div>
  );
}

// ── View 2: Campaigns (breakdown + editing) ──────────────────

function CampaignsView({
  campaigns,
  emailConfigured,
  setOverride,
  resetOverride,
}: {
  campaigns: DripCampaign[];
  emailConfigured: boolean;
  setOverride: ReturnType<typeof useReengageStrategy>['setOverride'];
  resetOverride: ReturnType<typeof useReengageStrategy>['resetOverride'];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <CampaignCard
          key={c.triggerId}
          campaign={c}
          open={openId === c.triggerId}
          onToggleOpen={() => setOpenId((cur) => (cur === c.triggerId ? null : c.triggerId))}
          emailConfigured={emailConfigured}
          setOverride={setOverride}
          resetOverride={resetOverride}
        />
      ))}
    </div>
  );
}

function CampaignCard({
  campaign: c,
  open,
  onToggleOpen,
  emailConfigured,
  setOverride,
  resetOverride,
}: {
  campaign: DripCampaign;
  open: boolean;
  onToggleOpen: () => void;
  emailConfigured: boolean;
  setOverride: ReturnType<typeof useReengageStrategy>['setOverride'];
  resetOverride: ReturnType<typeof useReengageStrategy>['resetOverride'];
}) {
  const id = c.triggerId;
  const payloads = campaignPayloads(c);

  const toggleChannel = (ch: NudgeChannel) => {
    const next = c.channels.includes(ch) ? c.channels.filter((x) => x !== ch) : [...c.channels, ch];
    setOverride(id, { channels: next });
  };

  return (
    <section
      className={`rounded-xl border bg-card ${c.enabled ? 'border-border' : 'border-border/50'}`}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOverride(id, { enabled: !c.enabled })}
          aria-pressed={c.enabled}
          aria-label={`${c.enabled ? 'Disable' : 'Enable'} ${c.label}`}
          className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold ${
            c.enabled ? 'bg-success/20 text-success-text' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Power className="h-3 w-3" /> {c.enabled ? 'On' : 'Off'}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{c.label}</p>
            {c.customized && (
              <span className="rounded-sm bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                customized
              </span>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{c.condition}</p>
        </div>
        <ChannelChips channels={c.channels} />
        <button
          type="button"
          onClick={onToggleOpen}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" /> {open ? 'Close' : 'Edit'}
        </button>
      </div>

      {/* Breakdown grid (always visible) */}
      <div className="grid gap-3 border-t border-border px-4 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Audience" value={c.cohortDescription} />
        <Field label="Priority" value={`${c.priority} (higher wins)`} />
        <Field label="Cooldown" value={`${c.cooldownDays} day${c.cooldownDays === 1 ? '' : 's'}`} />
        <Field label="Tone" value={c.tone} />
      </div>

      {/* Editor + preview */}
      {open && (
        <div className="space-y-4 border-t border-border p-4">
          {/* Strategy controls */}
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id={`${id}-priority`}
              label="Priority"
              hint="Higher fires first when several apply"
              value={c.priority}
              onChange={(v) => setOverride(id, { priority: v })}
            />
            <NumberField
              id={`${id}-cooldown`}
              label="Cooldown (days)"
              hint="Min days before this repeats"
              value={c.cooldownDays}
              min={0}
              onChange={(v) => setOverride(id, { cooldownDays: v })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Channels</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CHANNELS.map((ch) => {
                const on = c.channels.includes(ch);
                const { label, Icon } = CHANNEL_META[ch];
                const blocked = ch === 'email' && !emailConfigured;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      on
                        ? 'border-success/50 bg-success/15 text-success-text'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                    {on && blocked && <span className="text-link">(no provider)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copy editors */}
          <div className="grid gap-3">
            <TextField id={`${id}-title`} label="Title / headline" value={c.message.title}
              onChange={(v) => setOverride(id, { title: v || undefined })} />
            <TextArea id={`${id}-body`} label="Body" value={c.message.body}
              onChange={(v) => setOverride(id, { body: v || undefined })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id={`${id}-cta`} label="CTA label" value={c.message.cta.label}
                onChange={(v) => setOverride(id, { ctaLabel: v || undefined })} />
              <TextField id={`${id}-href`} label="CTA link" value={c.message.cta.href}
                onChange={(v) => setOverride(id, { ctaHref: v || undefined })} />
            </div>
            <TextField id={`${id}-subject`} label="Email subject" value={c.message.emailSubject}
              onChange={(v) => setOverride(id, { emailSubject: v || undefined })} />
          </div>

          {/* Live preview */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Email draft</p>
              <p className="mt-1 text-sm font-medium text-foreground">Subject: {payloads.email.subject}</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{payloads.email.heading}</p>
              <p className="mt-1 text-sm text-muted-foreground">{payloads.email.body}</p>
              <p className="mt-2 text-sm text-success-text">
                {payloads.email.cta.label} → <span className="text-muted-foreground">{payloads.email.cta.url}</span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">In-app / Push</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{payloads.in_app.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{payloads.in_app.body}</p>
              <p className="mt-2 text-sm text-success-text">
                {payloads.in_app.cta.label} → <span className="text-muted-foreground">{payloads.push.url}</span>
              </p>
            </div>
          </div>

          {c.customized && (
            <button
              type="button"
              onClick={() => resetOverride(id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Revert to code default
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="mt-0.5 text-foreground">{value}</p>
    </div>
  );
}

function NumberField({
  id, label, hint, value, min, onChange,
}: { id: string; label: string; hint?: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-success"
      />
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function TextField({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-success"
      />
    </div>
  );
}

function TextArea({
  id, label, value, onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-success"
      />
    </div>
  );
}

// ── View 3: Strategy analysis ────────────────────────────────

function StrategyView({
  analysis: a,
  settings,
  customizedCount,
  overrides,
  setSettings,
  resetAll,
}: {
  analysis: ReturnType<typeof useReengageStrategy>['analysis'];
  settings: ReturnType<typeof useReengageStrategy>['settings'];
  customizedCount: number;
  overrides: ReturnType<typeof useReengageStrategy>['overrides'];
  setSettings: ReturnType<typeof useReengageStrategy>['setSettings'];
  resetAll: ReturnType<typeof useReengageStrategy>['resetAll'];
}) {
  const [copied, setCopied] = useState(false);
  const maxChannel = Math.max(1, ...a.channelMix.map((c) => c.count));

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportStrategyJson(overrides, settings));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-6">
      {/* Health battery */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Strategy health</h2>
          <HealthPill health={a.health} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {a.health.factors.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">{f.label}</span>
                <span className="font-medium text-muted-foreground">{f.score}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    f.score >= 70 ? 'bg-success' : f.score >= 50 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/70">{f.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Warnings + recommendations */}
      {(a.warnings.length > 0 || a.coverageGaps.length > 0 || a.recommendations.length > 0) && (
        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-link">
              <AlertTriangle className="h-4 w-4" /> Watch-outs
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {[...a.warnings, ...a.coverageGaps].map((w, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-link">•</span> {w}
                </li>
              ))}
              {a.warnings.length === 0 && a.coverageGaps.length === 0 && (
                <li className="flex items-center gap-1.5 text-success-text">
                  <CheckCircle2 className="h-3.5 w-3.5" /> No issues detected.
                </li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-success-text">
              <Info className="h-4 w-4" /> Recommendations
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              {a.recommendations.length === 0 ? (
                <li>Address the watch-outs to raise the health score.</li>
              ) : (
                a.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-success-text">•</span> {r}
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Priority resolution */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Priority resolution</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          When several campaigns apply at once, the engine delivers the highest priority. {a.cadenceNote}
        </p>
        <div className="mt-3 space-y-1.5">
          {a.priorityOrder.map((p) => (
            <div
              key={p.triggerId}
              className={`flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-xs ${
                p.enabled ? '' : 'opacity-50'
              }`}
            >
              <span className="w-8 shrink-0 font-mono text-muted-foreground">P{p.priority}</span>
              <span className="flex-1 font-medium text-foreground">{p.label}</span>
              <span className="text-muted-foreground/70">
                {p.suppresses.length > 0 ? `suppresses ${p.suppresses.length}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Channel mix + deliverability */}
      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Channel mix</h2>
          <div className="mt-3 space-y-2.5">
            {a.channelMix.map((c) => {
              const { label, Icon } = CHANNEL_META[c.channel];
              return (
                <div key={c.channel}>
                  <div className="flex items-center gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 text-foreground">{label}</span>
                    <span className="text-muted-foreground">{c.count} campaigns</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${(c.count / maxChannel) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Deliverability</h2>
          <div className="mt-3 space-y-2">
            {a.deliverability.map((d) => {
              const { label, Icon } = CHANNEL_META[d.channel];
              return (
                <div key={d.channel} className="flex items-start gap-2 text-xs">
                  <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{label}</span>
                    <p className="text-muted-foreground">{d.note}</p>
                  </div>
                  {d.ready ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-text" />
                  ) : (
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-link" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Engine settings + export */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Engine settings</h2>
        <div className="mt-3 max-w-xs">
          <NumberField
            id="global-daily-cap"
            label="Global daily cap"
            hint="Max nudges of any kind per user per day"
            value={settings.globalDailyCap}
            min={0}
            onChange={(v) => setSettings({ globalDailyCap: v })}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={copyJson}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-xs font-medium text-white hover:bg-success"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Export strategy as JSON'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset all campaign overrides and settings to the shipped defaults?')) resetAll();
            }}
            disabled={customizedCount === 0 && settings.globalDailyCap === 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset all
          </button>
          <p className="text-[11px] text-muted-foreground/70">
            Export captures your tweaks; commit them into <code className="text-muted-foreground">lib/reengage/triggers.ts</code> to ship globally.
          </p>
        </div>
      </section>
    </div>
  );
}
