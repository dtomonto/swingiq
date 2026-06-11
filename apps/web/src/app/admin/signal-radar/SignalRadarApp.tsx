'use client';

// SignalRadar OS — client app shell. Owns tab state + the detail drawer +
// the add/import modal, and derives the dashboard / competitor insights
// from the PURE engine. Operator data comes from useSignalRadar
// (localStorage); when there is none yet, server-provided sample signals
// are shown read-only behind a clearly-labelled banner.

import { useMemo, useState, useCallback } from 'react';
import { LayoutGrid, Inbox, Map, Swords, Bot, SlidersHorizontal, Plus, Info, Trophy, Sparkles, Zap } from 'lucide-react';
import type { AdapterStatus, Signal, ConversionKind, AutomationStatus } from '@/lib/signal-radar/types';
import type { AdapterHealthSummary } from '@/lib/signal-radar/adapters';
import { useSignalRadar } from '@/lib/signal-radar/useSignalRadar';
import { useSupport } from '@/lib/admin/stores/support';
import { buildDashboard } from '@/lib/signal-radar/engine';
import { buildCompetitorInsights } from '@/lib/signal-radar/competitors';
import { buildStrategyBrief } from '@/lib/signal-radar/strategy';
import { applyAlertRules } from '@/lib/signal-radar/alerts';
import { mergeIngested } from '@/lib/signal-radar/ingest';
import { Btn } from './components/ui';
import { Overview } from './components/Overview';
import { SignalInbox } from './components/SignalInbox';
import { SignalDetail } from './components/SignalDetail';
import { AddSignal } from './components/AddSignal';
import { MentionMap } from './components/MentionMap';
import { CompetitorWatch } from './components/CompetitorWatch';
import { AiVisibility } from './components/AiVisibility';
import { SettingsPanel } from './components/SettingsPanel';
import { SportIntelligence } from './components/SportIntelligence';
import { StrategyBrief } from './components/StrategyBrief';
import { Automation } from './components/Automation';

export interface SignalRadarAppProps {
  actor: string;
  adapters: AdapterStatus[];
  adapterSummary: AdapterHealthSummary;
  sampleSignals: Signal[];
  ingestedSignals: Signal[];
  ingestEnabled: boolean;
  automation: AutomationStatus;
  generatedAt: string;
}

type Tab = 'overview' | 'inbox' | 'sports' | 'map' | 'competitors' | 'ai' | 'brief' | 'automation' | 'settings';

const TABS: { id: Tab; label: string; icon: typeof Inbox }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'inbox', label: 'Signal Inbox', icon: Inbox },
  { id: 'sports', label: 'Sport Intel', icon: Trophy },
  { id: 'map', label: 'Mention Map', icon: Map },
  { id: 'competitors', label: 'Competitors', icon: Swords },
  { id: 'ai', label: 'AI Visibility', icon: Bot },
  { id: 'brief', label: 'Strategy Brief', icon: Sparkles },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal },
];

export function SignalRadarApp(props: SignalRadarAppProps) {
  const sr = useSignalRadar(props.actor);
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Operator's local signals merged with durable webhook-ingested ones
  // (dedup by fingerprint, local wins). Ingested-only entries are flagged
  // for read-only display until adopted.
  const realSignals = useMemo(
    () => mergeIngested(sr.signals, props.ingestedSignals),
    [sr.signals, props.ingestedSignals],
  );
  const hasReal = realSignals.length > 0;
  const usingSample = sr.ready && !hasReal;
  const signals = hasReal ? realSignals : props.sampleSignals;

  const dashboard = useMemo(() => buildDashboard(signals, sr.config), [signals, sr.config]);
  const competitorInsights = useMemo(
    () => buildCompetitorInsights(signals, sr.competitors),
    [signals, sr.competitors],
  );
  const brief = useMemo(
    () => buildStrategyBrief(signals, dashboard, competitorInsights),
    [signals, dashboard, competitorInsights],
  );
  const activeAlerts = useMemo(
    () => applyAlertRules(dashboard.notifications, sr.config).filter((n) => !sr.dismissedAlertIds.includes(n.id)),
    [dashboard.notifications, sr.config, sr.dismissedAlertIds],
  );

  const selected = signals.find((s) => s.id === selectedId) ?? null;
  const conversionsForSelected = selected
    ? sr.conversions.filter((c) => c.signalId === selected.id)
    : [];

  // Convert a signal AND route it into the matching existing pipeline:
  // product feedback → the admin Feedback store (local), content idea →
  // a PublishingOS draft (server). Both are best-effort; the SignalRadar
  // conversion record is created regardless.
  const addFeedback = useSupport((s) => s.addFeedback);
  const handleConvert = useCallback(
    (id: string, kind: ConversionKind) => {
      const conv = sr.convertSignal(id, kind);
      if (!conv) return null;
      const sig = signals.find((s) => s.id === id);
      if (kind === 'product_feedback' && sig) {
        const type = sig.classification.intent === 'bug_report' ? 'bug'
          : sig.classification.intent === 'feature_request' ? 'feature' : 'ux';
        addFeedback({ type, summary: `[SignalRadar] ${conv.signalSummary}`, source: 'SignalRadar' });
      } else if (kind === 'content_idea') {
        void fetch('/api/signal-radar/convert-content', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ conversionId: conv.id, title: conv.fields.suggestedTitle || conv.signalSummary, summary: conv.signalSummary }),
        }).catch(() => { /* best-effort handoff */ });
      }
      return conv;
    },
    [sr, signals, addFeedback],
  );

  return (
    <div className="space-y-4">
      {/* Tab bar + primary action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-primary/15 text-link' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>
        <Btn tone="primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add / import signals
        </Btn>
      </div>

      {usingSample && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-link">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Showing <strong>sample data</strong> so you can see how SignalRadar works. These are not real mentions.
            Add or import your first real signal to replace this preview — your data then persists in this browser.
          </p>
        </div>
      )}

      {tab === 'overview' && (
        <Overview
          dashboard={dashboard}
          alerts={activeAlerts}
          adapters={props.adapters}
          adapterSummary={props.adapterSummary}
          usingSample={usingSample}
          onOpenSignal={setSelectedId}
          onDismissAlert={sr.dismissAlert}
          onAdd={() => setAddOpen(true)}
          onGoTab={(t) => setTab(t)}
        />
      )}
      {tab === 'inbox' && (
        <SignalInbox signals={signals} onOpenSignal={setSelectedId} onAdd={() => setAddOpen(true)} />
      )}
      {tab === 'sports' && (
        <SportIntelligence
          signals={signals}
          config={sr.config}
          competitors={sr.competitors}
          onOpenSignal={setSelectedId}
        />
      )}
      {tab === 'map' && <MentionMap dashboard={dashboard} onOpenSignal={setSelectedId} />}
      {tab === 'brief' && <StrategyBrief brief={brief} onOpenSignal={setSelectedId} />}
      {tab === 'competitors' && (
        <CompetitorWatch
          insights={competitorInsights}
          competitors={sr.competitors}
          onSave={sr.setCompetitors}
          disabled={usingSample}
        />
      )}
      {tab === 'ai' && (
        <AiVisibility tests={sr.aiTests} onUpsert={sr.upsertAiTest} onRemove={sr.removeAiTest} />
      )}
      {tab === 'automation' && (
        <Automation automation={props.automation} config={sr.config} onUpdate={sr.updateConfig} />
      )}
      {tab === 'settings' && (
        <SettingsPanel
          config={sr.config}
          adapters={props.adapters}
          onUpdate={sr.updateConfig}
          onReset={sr.resetConfig}
          onReprocess={sr.reprocessAll}
        />
      )}

      {selected && (
        <SignalDetail
          signal={selected}
          conversions={conversionsForSelected}
          readOnly={Boolean(selected.isSeed)}
          ingested={Boolean(selected.ingested)}
          actor={sr.actor}
          onClose={() => setSelectedId(null)}
          onSetStatus={sr.setStatus}
          onAddNote={sr.addNote}
          onOverride={sr.overrideClassification}
          onConvert={handleConvert}
          onRemove={(id) => { sr.removeSignal(id); setSelectedId(null); }}
          onAdopt={(s) => sr.adoptSignal(s)}
        />
      )}

      {addOpen && (
        <AddSignal
          onClose={() => setAddOpen(false)}
          onAddManual={sr.addManualSignal}
          onImport={sr.importSignals}
        />
      )}
    </div>
  );
}
