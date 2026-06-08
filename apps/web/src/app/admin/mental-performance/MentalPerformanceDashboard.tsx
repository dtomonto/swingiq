'use client';

// ============================================================
// /admin/mental-performance — management console (client)
// Reads the pure Mental Performance lib (routines, plans, vocabularies) and
// the CentralIntelligenceOS / GrowthOS layers. Deterministic + keyless: the
// intelligence panels run off the anonymized aggregate SEAM (seed data this
// pass — honestly labelled). Editing source = editing the lib data files.
// ============================================================

import { useMemo, useState } from 'react';
import {
  BookOpen, CalendarRange, Brain, Sparkles, TrendingUp, ShieldCheck, Copy, AlertTriangle, Film,
} from 'lucide-react';
import { MENTAL_ROUTINES } from '@/lib/mental-performance/routines';
import { planCatalog } from '@/lib/mental-performance/plans';
import { generateMeditationScript, generateRoutineVideoBrief } from '@/lib/mental-performance/scripts';
import {
  EMOTIONAL_STATES, MISTAKE_CATEGORIES, CRISIS_RESOURCES,
  NON_MEDICAL_DISCLAIMER, CRISIS_NOTE, PROFESSIONAL_NOTE,
} from '@/lib/mental-performance/constants';
import {
  generateMentalInsights, generateMentalRecommendations, getMentalSignals,
  aggregateMentalSignals, MENTAL_K,
} from '@/lib/mental-performance/intelligence';
import { generateMentalOpportunities, routineCoverageGaps } from '@/lib/mental-performance/growth';
import { read as readMentalStore } from '@/lib/mental-performance/store';

type Tab = 'library' | 'plans' | 'config' | 'intelligence' | 'growth' | 'media' | 'safety';

const TABS: Array<{ id: Tab; label: string; icon: typeof Brain }> = [
  { id: 'library', label: 'Routine Library', icon: BookOpen },
  { id: 'plans', label: 'Plans', icon: CalendarRange },
  { id: 'config', label: 'Coach Config', icon: Brain },
  { id: 'intelligence', label: 'Intelligence', icon: Sparkles },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'media', label: 'Guided Media', icon: Film },
  { id: 'safety', label: 'Safety', icon: ShieldCheck },
];

function CopyButton({ data, label }: { data: unknown; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
        setDone(true); setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:border-primary"
    >
      <Copy size={14} /> {done ? 'Copied' : label}
    </button>
  );
}

function SeedBanner() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <span>
        These panels run on the anonymized aggregate <strong>seam</strong> with deterministic seed/sample
        data (k-anonymity ≥ {MENTAL_K} enforced). Wire a real privacy-protected aggregate backend via{' '}
        <code className="rounded bg-muted px-1">setMentalSource()</code> to make them live.
      </span>
    </div>
  );
}

function SourceToggle({ source, onChange }: { source: 'seed' | 'mine'; onChange: (s: 'seed' | 'mine') => void }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Signal source:</span>
      {(['seed', 'mine'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`rounded-full border px-3 py-1 transition-colors ${
            source === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'
          }`}
        >
          {s === 'seed' ? 'Seed sample' : 'My logs (this device)'}
        </button>
      ))}
    </div>
  );
}

export function MentalPerformanceDashboard() {
  const [tab, setTab] = useState<Tab>('library');
  const [source, setSource] = useState<'seed' | 'mine'>('seed');
  const signals = useMemo(
    () => (source === 'mine' ? aggregateMentalSignals(readMentalStore().logs) : getMentalSignals()),
    [source],
  );
  const insights = useMemo(() => generateMentalInsights(signals), [signals]);
  const recs = useMemo(() => generateMentalRecommendations(signals), [signals]);
  const opportunities = useMemo(() => generateMentalOpportunities(signals), [signals]);
  const gaps = useMemo(() => routineCoverageGaps(), []);

  return (
    <div className="space-y-5">
      {/* Status & next steps */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles size={15} className="text-primary" aria-hidden="true" /> Status: live &amp; keyless — nothing required to run
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Live for all 7 sports + universal — coach, journal, plans and routines work with no AI cost.</li>
          <li>
            <span className="text-foreground">Done:</span> real log aggregator, CIOS recommendation feed, /fix reset surface, parent/coach mode, meditation-script generator, on-device spoken routines (Web Speech), Guided Media briefs, and an opt-in anonymized telemetry pipe (off by default).
          </li>
          <li>
            <span className="text-foreground">Next (optional):</span> enable AI polish (<code className="rounded bg-muted px-1">MENTAL_AI_ENABLED</code>, off by default); connect an events-collection backend (PostHog / Supabase) so the telemetry becomes real cross-user intelligence; render audio/video via Video Studio. Owner steps live in{' '}
            <a href="/admin/setup" className="text-primary hover:underline">Setup &amp; Next Steps</a>.
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={15} aria-hidden="true" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Library */}
      {tab === 'library' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{MENTAL_ROUTINES.length} routines. Source of truth: <code className="rounded bg-muted px-1">lib/mental-performance/routines.ts</code>.</p>
            <CopyButton data={MENTAL_ROUTINES} label="Copy library JSON" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Routine</th><th className="px-3 py-2">Sports</th>
                  <th className="px-3 py-2">Type</th><th className="px-3 py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                {MENTAL_ROUTINES.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2"><div className="font-medium text-foreground">{r.title}</div><div className="text-xs text-muted-foreground">{r.situation}</div></td>
                    <td className="px-3 py-2 text-muted-foreground">{r.sports.join(', ')}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.routineType}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.durationSeconds}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plans */}
      {tab === 'plans' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {planCatalog().map((p) => (
            <div key={p.slug} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.durationDays > 0 ? `${p.durationDays}d` : 'session'}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.goal}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.summary}</p>
            </div>
          ))}
        </div>
      )}

      {/* Coach Config (vocabularies) */}
      {tab === 'config' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground">Emotional states ({EMOTIONAL_STATES.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {EMOTIONAL_STATES.map((e) => (
                <li key={e.id} className="flex items-center justify-between">
                  <span className="text-foreground">{e.emoji} {e.label}</span>
                  <span className="text-xs text-muted-foreground">{e.family} · {e.needs}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground">Mistake categories ({MISTAKE_CATEGORIES.length})</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {MISTAKE_CATEGORIES.map((m) => (
                <li key={m.id} className="flex items-center justify-between">
                  <span className="text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.sportFamily} · {m.errorClass} → {m.routineSlug}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground lg:col-span-2">Add states/categories in <code className="rounded bg-muted px-1">lib/mental-performance/constants.ts</code>.</p>
        </div>
      )}

      {/* Intelligence (CIOS) */}
      {tab === 'intelligence' && (
        <div className="space-y-4">
          <SourceToggle source={source} onChange={setSource} />
          {source === 'seed' && <SeedBanner />}
          <div>
            <h3 className="font-semibold text-foreground">Insights</h3>
            <div className="mt-2 grid gap-2">
              {insights.map((i) => (
                <div key={i.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{i.title}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{i.kind} · {(i.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{i.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Recommendations (feed CentralIntelligenceOS)</h3>
            <div className="mt-2 grid gap-2">
              {recs.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{r.title}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{r.priority}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{r.rationale}</p>
                  <p className="mt-1 text-xs text-muted-foreground"><strong>How:</strong> {r.suggestedImplementation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Growth (GrowthOS) */}
      {tab === 'growth' && (
        <div className="space-y-3">
          <SourceToggle source={source} onChange={setSource} />
          {source === 'seed' && <SeedBanner />}
          {gaps.length > 0 && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
              Sports with no dedicated routine yet: {gaps.join(', ')}.
            </div>
          )}
          <div className="grid gap-2">
            {opportunities.map((o) => (
              <div key={o.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{o.recommendedAsset}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{o.opportunityType} · {o.priorityScore}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{o.rationale}</p>
                <p className="mt-1 text-xs text-muted-foreground">Cluster: {o.keywordCluster} · {o.sport}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guided Media (Phase 4) */}
      {tab === 'media' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">
            <Film size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Every routine deterministically generates a narrated <strong>meditation script</strong> and a
              Video Studio <strong>brief</strong> (keyless). Athletes already hear routines via on-device
              speech in the player; these scripts/briefs are the hand-off for rendered audio/video through the
              existing Video Studio pipeline. Copy a brief to seed a video job.
            </span>
          </div>
          {MENTAL_ROUTINES.map((r) => {
            const script = generateMeditationScript(r);
            const brief = generateRoutineVideoBrief(r);
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.sports.join(', ')} · {script.durationSeconds}s · {script.wordCount} words
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CopyButton data={script.voiceover} label="Copy script" />
                    <CopyButton data={brief} label="Copy brief" />
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{script.intro}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety */}
      {tab === 'safety' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground">Disclaimers (rendered on every surface)</h3>
            <p className="mt-2 text-sm text-foreground">{NON_MEDICAL_DISCLAIMER}</p>
            <p className="mt-2 text-sm text-foreground">{PROFESSIONAL_NOTE}</p>
            <p className="mt-2 text-sm text-foreground">{CRISIS_NOTE}</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold text-foreground">Crisis resources</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {CRISIS_RESOURCES.map((r) => (
                <li key={r.label}>
                  <span className="font-medium text-foreground">{r.label}</span>
                  <span className="text-muted-foreground"> — {r.detail} ({r.contact})</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            The coach screens free text for crisis / self-harm / medical-advice language and short-circuits
            to these resources — it never attempts therapy. Lexicon: <code className="rounded bg-muted px-1">lib/mental-performance/crisis.ts</code>.
          </p>
        </div>
      )}
    </div>
  );
}
