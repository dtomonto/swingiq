'use client';

// ============================================================
// Today's Command Center — client island
// ------------------------------------------------------------
// Renders the executive summary, the single "do this first" focus, the
// prioritized to-do list (with filters + section tabs), per-card actions,
// the manual Intelligence Scan, and engine settings. Recommendations come
// from the server (props); owner state + settings persist in the browser
// via useCommandCenter. Pure helpers from overrides.ts do the bucketing.
// ============================================================

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RefreshCw, Target, AlertTriangle, CheckCircle2, Clock, XCircle, PlayCircle,
  ChevronDown, Sliders, Database, Sparkles, TrendingUp, Info,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { applyOverrides, summarize, pickDailyFocus, sectionsFor, type SectionId } from '@/lib/command-center/overrides';
import { explainScore } from '@/lib/command-center/scoring';
import {
  TYPE_LABELS, BAND_LABELS,
  type Recommendation, type RecommendationView, type PriorityBand, type RecommendationType,
} from '@/lib/command-center/types';
import { useCommandCenter } from '@/lib/command-center/useCommandCenter';

const BAND_TONE: Record<PriorityBand, BadgeTone> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'critical', label: 'Critical' },
  { id: 'data', label: 'Data Needed' },
  { id: 'ai', label: 'AI Quality' },
  { id: 'growth', label: 'Growth / SEO' },
  { id: 'content', label: 'Content' },
  { id: 'product', label: 'Product' },
  { id: 'completed', label: 'Completed' },
  { id: 'snoozed', label: 'Snoozed' },
  { id: 'dismissed', label: 'Dismissed' },
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

function dueLabel(view: RecommendationView): { text: string; tone: BadgeTone } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(view.dueDate);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { text: `Overdue ${Math.abs(days)}d`, tone: 'danger' };
  if (days === 0) return { text: 'Due today', tone: 'warning' };
  if (days <= 2) return { text: `Due in ${days}d`, tone: 'warning' };
  return { text: `Due ${fmtDate(view.dueDate)}`, tone: 'neutral' };
}

export interface CommandCenterClientProps {
  recommendations: Recommendation[];
  generatedAt: string;
  totals: { features: number; sports: number; drills: number };
  analyticsConfigured: boolean;
}

export function CommandCenterClient(props: CommandCenterClientProps) {
  const router = useRouter();
  const [isScanning, startScan] = useTransition();
  const cc = useCommandCenter();
  const [section, setSection] = useState<SectionId>('today');
  const [bandFilter, setBandFilter] = useState<'all' | PriorityBand>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | RecommendationType>('all');
  const [sportFilter, setSportFilter] = useState<'all' | string>('all');
  const [showSettings, setShowSettings] = useState(false);

  const nowIso = new Date().toISOString();

  // Server recs filtered by settings (baseline + disabled types), then overlaid.
  const views = useMemo(() => {
    const filtered = props.recommendations.filter((r) => {
      if (!cc.settings.includeBaseline && r.isSeed) return false;
      if (cc.settings.disabledTypes.includes(r.recommendationType)) return false;
      return true;
    });
    return applyOverrides(filtered, cc.overrides, nowIso);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.recommendations, cc.overrides, cc.settings]);

  const summary = useMemo(() => summarize(views), [views]);
  const focus = useMemo(() => pickDailyFocus(views), [views]);

  const sports = useMemo(
    () => Array.from(new Set(props.recommendations.map((r) => r.relatedSport).filter(Boolean))) as string[],
    [props.recommendations],
  );

  const visible = useMemo(() => {
    let list = views.filter((v) => sectionsFor(v).includes(section));
    if (bandFilter !== 'all') list = list.filter((v) => v.priorityBand === bandFilter);
    if (typeFilter !== 'all') list = list.filter((v) => v.recommendationType === typeFilter);
    if (sportFilter !== 'all') list = list.filter((v) => v.relatedSport === sportFilter);
    if (section === 'today') {
      if (cc.settings.hideLowPriority) list = list.filter((v) => v.priorityBand !== 'low');
      list = list.sort((a, b) => b.priorityScore - a.priorityScore);
    }
    return list;
  }, [views, section, bandFilter, typeFilter, sportFilter, cc.settings.hideLowPriority]);

  const todayCount = views.filter((v) => sectionsFor(v).includes('today')).length;
  const cappedToday = section === 'today' ? visible.slice(0, cc.settings.maxPerDay) : visible;
  const hiddenByCap = section === 'today' ? Math.max(0, visible.length - cappedToday.length) : 0;

  return (
    <div className="space-y-6">
      {/* Executive summary */}
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-300">Daily executive summary</h2>
          <button
            onClick={() => startScan(() => router.refresh())}
            disabled={isScanning}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning…' : 'Run Intelligence Scan'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricStat label="Needs attention" value={String(summary.needsAttention)} hint="actionable today" tone={summary.needsAttention > 0 ? 'default' : 'muted'} />
          <MetricStat label="Critical" value={String(summary.critical)} hint="do these first" tone={summary.critical > 0 ? 'warning' : 'muted'} icon={AlertTriangle} />
          <MetricStat label="High priority" value={String(summary.high)} hint="this week" tone={summary.high > 0 ? 'default' : 'muted'} />
          <MetricStat label="Completed" value={String(summary.completed)} hint="tracked done" tone="muted" icon={CheckCircle2} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <BriefingTile icon={Database} label="Biggest data gap" value={summary.biggestDataGap} />
          <BriefingTile icon={TrendingUp} label="Biggest growth opportunity" value={summary.biggestGrowthOpportunity} />
          <BriefingTile icon={Sparkles} label="Biggest AI-quality risk" value={summary.biggestAiRisk} />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Last scan {fmtDate(props.generatedAt)} · {props.totals.drills} drills across {props.totals.sports} sports ·
          analytics {props.analyticsConfigured ? 'connected' : 'not connected'}.
          {!cc.ready && ' Loading your saved progress…'}
        </p>
      </section>

      {/* Daily focus — do this first */}
      {focus ? (
        <SectionCard className="border-amber-500/30 bg-amber-500/[0.04]">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 rounded-lg bg-amber-500/15 p-2 text-amber-400">
              <Target className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">Do this first today</span>
                <StatusBadge tone={BAND_TONE[focus.priorityBand]}>{BAND_LABELS[focus.priorityBand]} · {focus.priorityScore}</StatusBadge>
              </div>
              <h3 className="mt-1 font-semibold text-gray-100">{focus.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{focus.summary}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ActionButtons view={focus} cc={cc} />
              </div>
            </div>
          </div>
        </SectionCard>
      ) : (
        <SectionCard className="border-emerald-500/30 bg-emerald-500/[0.04]">
          <div className="flex items-center gap-3 py-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">No urgent actions today.</p>
              <p className="text-xs text-emerald-200/70">
                Run an Intelligence Scan to re-check, or review completed and snoozed items below.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-800 pb-2">
        {SECTIONS.map((s) => {
          const count = views.filter((v) => sectionsFor(v).includes(s.id)).length;
          if (count === 0 && s.id !== 'today') return null;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                section === s.id ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {s.label}
              <span className="ml-1.5 text-[10px] text-gray-500">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <FilterGroup label="Priority" value={bandFilter} onChange={(v) => setBandFilter(v as typeof bandFilter)}
          options={[['all', 'All'], ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'], ['low', 'Low']]} />
        <FilterSelect label="Type" value={typeFilter} onChange={(v) => setTypeFilter(v as typeof typeFilter)}
          options={[['all', 'All types'], ...(Object.entries(TYPE_LABELS) as [string, string][])]} />
        {sports.length > 0 && (
          <FilterSelect label="Sport" value={sportFilter} onChange={(v) => setSportFilter(v)}
            options={[['all', 'All sports'], ...sports.map((s) => [s, s] as [string, string])]} />
        )}
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1 text-gray-300 hover:bg-gray-800"
        >
          <Sliders className="h-3.5 w-3.5" /> Settings
        </button>
      </div>

      {showSettings && <SettingsPanel cc={cc} />}

      {/* The list */}
      {cappedToday.length === 0 ? (
        <EmptyState section={section} onScan={() => startScan(() => router.refresh())} scanning={isScanning} />
      ) : (
        <ul className="space-y-3">
          {cappedToday.map((v) => (
            <RecommendationCard key={v.id} view={v} cc={cc} />
          ))}
        </ul>
      )}
      {hiddenByCap > 0 && (
        <p className="text-center text-xs text-gray-500">
          {hiddenByCap} more lower-priority item{hiddenByCap === 1 ? '' : 's'} hidden by your “{cc.settings.maxPerDay}/day” cap.{' '}
          <button className="text-amber-400 hover:underline" onClick={() => cc.updateSettings({ maxPerDay: cc.settings.maxPerDay + 12 })}>
            Show more
          </button>
        </p>
      )}
      {section === 'today' && (
        <p className="text-center text-[11px] text-gray-600">
          Showing {Math.min(cappedToday.length, todayCount)} of {todayCount} actionable. Items you complete, snooze or
          dismiss move to their tabs and survive the next scan.
        </p>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BriefingTile({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1.5 text-sm text-gray-200">{value ?? <span className="text-gray-500">Nothing flagged 🎉</span>}</p>
    </div>
  );
}

type CC = ReturnType<typeof useCommandCenter>;

function ActionButtons({ view, cc }: { view: RecommendationView; cc: CC }) {
  const s = view.status;
  const btn = 'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors';
  return (
    <>
      {s !== 'in_progress' && s !== 'completed' && (
        <button className={`${btn} border-sky-500/40 text-sky-300 hover:bg-sky-500/10`} onClick={() => cc.setInProgress(view.id, view.priorityScore)}>
          <PlayCircle className="h-3.5 w-3.5" /> In progress
        </button>
      )}
      {s !== 'completed' && (
        <button className={`${btn} border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10`} onClick={() => cc.complete(view.id, view.priorityScore)}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
        </button>
      )}
      {s !== 'snoozed' && s !== 'completed' && (
        <button className={`${btn} border-gray-700 text-gray-300 hover:bg-gray-800`} onClick={() => cc.snooze(view.id, view.priorityScore)}>
          <Clock className="h-3.5 w-3.5" /> Snooze
        </button>
      )}
      {s !== 'dismissed' && s !== 'completed' && (
        <button className={`${btn} border-gray-700 text-gray-400 hover:bg-gray-800`} onClick={() => cc.dismiss(view.id, view.priorityScore)}>
          <XCircle className="h-3.5 w-3.5" /> Dismiss
        </button>
      )}
      {(s === 'completed' || s === 'dismissed' || s === 'snoozed') && (
        <button className={`${btn} border-gray-700 text-gray-300 hover:bg-gray-800`} onClick={() => cc.reactivate(view.id)}>
          <RefreshCw className="h-3.5 w-3.5" /> Reactivate
        </button>
      )}
      {view.relatedLinks[0] && (
        <Link href={view.relatedLinks[0].href} className={`${btn} border-amber-500/40 text-amber-300 hover:bg-amber-500/10`}>
          Open {view.relatedLinks[0].label}
        </Link>
      )}
    </>
  );
}

function RecommendationCard({ view, cc }: { view: RecommendationView; cc: CC }) {
  const [open, setOpen] = useState(false);
  const due = dueLabel(view);
  return (
    <li className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={BAND_TONE[view.priorityBand]}>{BAND_LABELS[view.priorityBand]} · {view.priorityScore}</StatusBadge>
        <StatusBadge tone="neutral">{TYPE_LABELS[view.recommendationType]}</StatusBadge>
        <span className="text-xs text-gray-500">{view.category}</span>
        {view.relatedSport && <span className="text-xs text-gray-500">· {view.relatedSport}</span>}
        {view.isSeed && <StatusBadge tone="accent">Initial recommendation</StatusBadge>}
        {view.reopened && <StatusBadge tone="danger">Worsened — reopened</StatusBadge>}
        <span className="ml-auto"><StatusBadge tone={due.tone}>{due.text}</StatusBadge></span>
      </div>

      <h3 className="mt-2 font-semibold text-gray-100">{view.title}</h3>
      <p className="mt-1 text-sm text-gray-400">{view.summary}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
        <span>Effort {view.effort}</span>
        <span>· {view.confidence}% confidence</span>
        <span>· {view.impact} impact</span>
        {view.status !== 'active' && <StatusBadge tone={view.status === 'completed' ? 'success' : view.status === 'in_progress' ? 'info' : 'neutral'}>{view.status.replace('_', ' ')}</StatusBadge>}
      </div>

      {view.note && (
        <p className="mt-2 rounded-lg border border-gray-800 bg-gray-900/60 p-2 text-xs text-gray-300">
          <span className="text-gray-500">Note:</span> {view.note}
        </p>
      )}

      <button onClick={() => setOpen((o) => !o)} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:underline">
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        {open ? 'Hide details' : 'Why this matters, evidence & steps'}
      </button>

      {open && (
        <div className="mt-3 space-y-3 border-t border-gray-800 pt-3 text-sm">
          <Detail label="Why it matters">{view.reason}</Detail>
          {view.missingData && <Detail label="What data is missing">{view.missingData}</Detail>}
          {view.requiredData && view.requiredData.length > 0 && (
            <Detail label="Data to collect"><ul className="list-disc space-y-0.5 pl-4 text-gray-300">{view.requiredData.map((d, i) => <li key={i}>{d}</li>)}</ul></Detail>
          )}
          <Detail label="How to complete">{view.howToComplete}</Detail>
          <Detail label="Step by step">
            <ol className="list-decimal space-y-0.5 pl-4 text-gray-300">{view.stepByStepActions.map((a, i) => <li key={i}>{a}</li>)}</ol>
          </Detail>
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Expected outcome">{view.expectedOutcome}</Detail>
            <Detail label="Risk if ignored">{view.riskIfIgnored}</Detail>
          </div>
          <Detail label="How we'll know it's done">{view.completionCriteria}</Detail>
          <Detail label="Evidence">
            <ul className="space-y-0.5 text-gray-400">{view.evidence.map((e, i) => <li key={i}>• {e}</li>)}</ul>
          </Detail>
          <p className="flex items-start gap-1.5 text-xs text-gray-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {explainScore(view.scoreBreakdown)} Source: {view.sourceEngine}.
          </p>
          {view.relatedLinks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {view.relatedLinks.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg border border-gray-700 px-2.5 py-1 text-xs text-gray-300 hover:bg-gray-800">{l.label}</Link>
              ))}
            </div>
          )}
          <NoteEditor view={view} cc={cc} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <ActionButtons view={view} cc={cc} />
      </div>
    </li>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 text-gray-300">{children}</div>
    </div>
  );
}

function NoteEditor({ view, cc }: { view: RecommendationView; cc: CC }) {
  const [value, setValue] = useState(view.note ?? '');
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Admin note</p>
      <div className="mt-1 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add context for future-you…"
          className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-amber-500/50 focus:outline-none"
        />
        <button onClick={() => cc.addNote(view.id, value.trim())} className="rounded-lg border border-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-800">Save</button>
      </div>
    </div>
  );
}

function FilterGroup({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}:</span>
      {options.map(([val, lbl]) => (
        <button key={val} onClick={() => onChange(val)}
          className={`rounded-full px-2 py-0.5 ${value === val ? 'bg-amber-500/20 text-amber-300' : 'text-gray-400 hover:text-gray-200'}`}>
          {lbl}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-gray-500">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-700 bg-gray-950 px-2 py-1 text-xs text-gray-200 focus:border-amber-500/50 focus:outline-none">
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </label>
  );
}

function SettingsPanel({ cc }: { cc: CC }) {
  const s = cc.settings;
  return (
    <SectionCard title="Engine settings" description="Tune what the Command Center surfaces. Saved in your browser.">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-gray-300">
          Max items per day: <span className="font-semibold text-gray-100">{s.maxPerDay}</span>
          <input type="range" min={4} max={40} step={2} value={s.maxPerDay} onChange={(e) => cc.updateSettings({ maxPerDay: Number(e.target.value) })} className="mt-1 w-full accent-amber-500" />
        </label>
        <label className="text-sm text-gray-300">
          Default snooze: <span className="font-semibold text-gray-100">{s.defaultSnoozeDays}d</span>
          <input type="range" min={1} max={30} value={s.defaultSnoozeDays} onChange={(e) => cc.updateSettings({ defaultSnoozeDays: Number(e.target.value) })} className="mt-1 w-full accent-amber-500" />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={s.hideLowPriority} onChange={(e) => cc.updateSettings({ hideLowPriority: e.target.checked })} className="accent-amber-500" />
          Hide low-priority items from Today
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={s.includeBaseline} onChange={(e) => cc.updateSettings({ includeBaseline: e.target.checked })} className="accent-amber-500" />
          Include baseline / best-practice recommendations
        </label>
      </div>
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Categories</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(TYPE_LABELS) as [RecommendationType, string][]).map(([type, label]) => {
            const off = s.disabledTypes.includes(type);
            return (
              <button key={type} onClick={() => cc.toggleType(type)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] ${off ? 'border-gray-800 text-gray-600 line-through' : 'border-amber-500/40 text-amber-300'}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={cc.resetSettings} className="mt-4 text-xs text-gray-400 hover:text-gray-200 hover:underline">Reset to defaults</button>
    </SectionCard>
  );
}

function EmptyState({ section, onScan, scanning }: { section: SectionId; onScan: () => void; scanning: boolean }) {
  if (section === 'today') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
        <p className="text-sm font-medium text-gray-300">No urgent actions today.</p>
        <p className="max-w-md text-xs text-gray-500">
          Proactive checks you can still run: review sport-by-sport drill coverage, confirm analytics is wired,
          and approve any pending learning drafts.
        </p>
        <button onClick={onScan} disabled={scanning} className="mt-1 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">
          <RefreshCw className={`h-3.5 w-3.5 ${scanning ? 'animate-spin' : ''}`} /> Run Intelligence Scan
        </button>
      </div>
    );
  }
  return <p className="rounded-xl border border-gray-800 bg-gray-900/60 py-8 text-center text-sm text-gray-500">Nothing here right now.</p>;
}
