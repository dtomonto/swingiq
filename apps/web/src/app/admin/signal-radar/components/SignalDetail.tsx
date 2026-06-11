'use client';

import { useState } from 'react';
import { X, ExternalLink, Trash2, FileText, Bug, Users, MessageCircle, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type {
  Signal, SignalConversion, SignalStatus, ConversionKind, SignalClassification,
  Sentiment, SignalIntent, SignalSport, Urgency,
} from '@/lib/signal-radar/types';
import {
  SENTIMENT_LABEL, INTENT_LABEL, SPORT_LABEL, URGENCY_LABEL, AUDIENCE_LABEL,
  OPPORTUNITY_LABEL, STATUS_LABEL, SOURCE_TYPE_LABEL, CONVERSION_LABEL,
} from '@/lib/signal-radar/labels';
import { Btn, INPUT_CLS, ScoreBar, SignalBadges } from './ui';

const SENTIMENTS: Sentiment[] = ['positive', 'neutral', 'negative', 'mixed', 'unknown'];
const SPORTS: SignalSport[] = ['golf', 'tennis', 'baseball', 'softball_fast', 'softball_slow', 'pickleball', 'padel', 'multi_sport', 'unknown'];
const URGENCIES: Urgency[] = ['critical', 'high', 'medium', 'low'];
const INTENTS = Object.keys(INTENT_LABEL) as SignalIntent[];

const CONVERSIONS: { kind: ConversionKind; icon: typeof FileText }[] = [
  { kind: 'content_idea', icon: FileText },
  { kind: 'product_feedback', icon: Bug },
  { kind: 'partnership_lead', icon: Users },
  { kind: 'support_response', icon: MessageCircle },
  { kind: 'reputation_risk', icon: ShieldAlert },
];

function whyItMatters(c: SignalClassification): string {
  switch (c.intent) {
    case 'reputation_risk': return 'A public negative signal about SwingVantage — left unanswered it can shape how others perceive the brand.';
    case 'bug_report': return 'A user is hitting a real defect; fixing it protects retention and trust.';
    case 'feature_request': return 'Direct demand for a capability — evidence for the roadmap.';
    case 'support_issue': return 'A user needs help now; a fast, kind reply turns frustration into loyalty.';
    case 'purchase_comparison': return 'Someone is actively choosing between tools — a chance to win the comparison.';
    case 'seo_content_opportunity':
    case 'coaching_need': return 'An unanswered market question SwingVantage can own with a page, FAQ or tool.';
    case 'backlink_opportunity': return 'A mention without a link — a low-effort authority + referral win.';
    case 'creator_opportunity':
    case 'partnership_opportunity': return 'A potential partner with an aligned audience — worth a warm outreach.';
    case 'competitive_intel': return 'Signal about how a competitor is perceived — informs positioning.';
    case 'press_media': return 'A media/press surface — potential coverage or authoritative backlink.';
    case 'brand_mention': return 'Someone is talking about SwingVantage — monitor sentiment and engage if useful.';
    default: return 'Low-signal / noise — likely safe to archive.';
  }
}

export function SignalDetail({
  signal, conversions, readOnly, actor, onClose, onSetStatus, onAddNote, onOverride, onConvert, onRemove,
}: {
  signal: Signal;
  conversions: SignalConversion[];
  readOnly: boolean;
  actor: string;
  onClose: () => void;
  onSetStatus: (id: string, status: SignalStatus, opts?: { reason?: string }) => void;
  onAddNote: (id: string, body: string) => void;
  onOverride: (id: string, patch: Partial<SignalClassification>) => void;
  onConvert: (id: string, kind: ConversionKind) => SignalConversion | null;
  onRemove: (id: string) => void;
}) {
  const [note, setNote] = useState('');
  const c = signal.classification;

  const statusBtn = (status: SignalStatus, tone: 'default' | 'primary' | 'danger' = 'default') => (
    <Btn size="sm" tone={tone} disabled={readOnly} onClick={() => onSetStatus(signal.id, status)}>{STATUS_LABEL[status]}</Btn>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-gray-800 bg-gray-950 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-800 bg-gray-950/95 p-4 backdrop-blur">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{SOURCE_TYPE_LABEL[signal.sourceType]} · {signal.sourceName}</p>
            <h3 className="mt-0.5 text-base font-semibold text-gray-100">{signal.title || 'Signal'}</h3>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-4">
          {readOnly && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              This is sample data — actions are disabled. Add a real signal to triage and convert.
            </div>
          )}

          <SignalBadges signal={signal} showStatus />

          {/* Why it matters + recommended action */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Why it matters</p>
            <p className="mt-1 text-sm text-gray-300">{whyItMatters(c)}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Recommended next action</p>
            <p className="mt-1 text-sm text-amber-300">{OPPORTUNITY_LABEL[c.opportunity]}</p>
          </div>

          {/* Full text */}
          <section>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Mention text</p>
            <p className="whitespace-pre-wrap rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm text-gray-300">{signal.cleanText}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {signal.authorName && <span>By {signal.authorName}</span>}
              {signal.publishedAt && <span>Published {fmt(signal.publishedAt)}</span>}
              <span>Discovered {fmt(signal.discoveredAt)}</span>
              {signal.sourceUrl && (
                <a href={signal.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-400 hover:underline">
                  <ExternalLink className="h-3 w-3" /> Open source
                </a>
              )}
            </div>
          </section>

          {/* Scores */}
          <section className="grid grid-cols-2 gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
            <ScoreBar label="Priority" value={signal.scores.priority} tone="red" />
            <ScoreBar label="Confidence" value={signal.scores.confidence} tone="sky" />
            <ScoreBar label="Relevance" value={signal.scores.relevance} tone="emerald" />
            <ScoreBar label="Source reliability" value={signal.scores.sourceReliability} tone="amber" />
            {signal.scores.priorityFactors.length > 0 && (
              <div className="col-span-2 mt-1 flex flex-wrap gap-1.5 border-t border-gray-800 pt-3">
                <span className="text-xs text-gray-500">Priority from:</span>
                {signal.scores.priorityFactors.map((f) => (
                  <StatusBadge key={f.label} tone="neutral">{f.label} +{f.points}</StatusBadge>
                ))}
              </div>
            )}
          </section>

          {/* Classification + reclassify */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Classification {c.method === 'manual_override' ? '(operator override)' : '(rules)'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Reclass label="Sentiment" value={c.sentiment} options={SENTIMENTS} labels={SENTIMENT_LABEL} disabled={readOnly} onChange={(v) => onOverride(signal.id, { sentiment: v })} />
              <Reclass label="Intent" value={c.intent} options={INTENTS} labels={INTENT_LABEL} disabled={readOnly} onChange={(v) => onOverride(signal.id, { intent: v })} />
              <Reclass label="Sport" value={c.sport} options={SPORTS} labels={SPORT_LABEL} disabled={readOnly} onChange={(v) => onOverride(signal.id, { sport: v })} />
              <Reclass label="Urgency" value={c.urgency} options={URGENCIES} labels={URGENCY_LABEL} disabled={readOnly} onChange={(v) => onOverride(signal.id, { urgency: v })} />
            </div>
            <p className="mt-2 text-xs text-gray-500">Audience: {AUDIENCE_LABEL[c.audience]}</p>
            {c.rationale.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-gray-600">
                {c.rationale.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </section>

          {/* Status workflow */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
            <div className="flex flex-wrap gap-2">
              {statusBtn('reviewed', 'primary')}
              {statusBtn('in_progress')}
              {statusBtn('responded')}
              {statusBtn('archived')}
              <Btn size="sm" tone="danger" disabled={readOnly} onClick={() => onSetStatus(signal.id, 'ignored', { reason: 'Marked as noise' })}>Ignore</Btn>
            </div>
          </section>

          {/* Conversions */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Convert to action</p>
            <div className="flex flex-wrap gap-2">
              {CONVERSIONS.map(({ kind, icon: Icon }) => (
                <Btn key={kind} size="sm" disabled={readOnly} onClick={() => onConvert(signal.id, kind)}>
                  <Icon className="h-3.5 w-3.5" /> {CONVERSION_LABEL[kind]}
                </Btn>
              ))}
            </div>
            {conversions.length > 0 && (
              <ul className="mt-3 space-y-2">
                {conversions.map((cv) => (
                  <li key={cv.id} className="rounded-lg border border-gray-800 bg-gray-900 p-2.5">
                    <div className="flex items-center justify-between">
                      <StatusBadge tone="accent">{CONVERSION_LABEL[cv.kind]}</StatusBadge>
                      <span className="text-xs text-gray-500">{cv.status}</span>
                    </div>
                    <dl className="mt-2 space-y-1">
                      {Object.entries(cv.fields).filter(([, v]) => v).map(([k, v]) => (
                        <div key={k} className="flex gap-2 text-xs">
                          <dt className="shrink-0 text-gray-500">{k}:</dt>
                          <dd className="text-gray-300">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
            {signal.notes.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {signal.notes.map((n) => (
                  <li key={n.id} className="rounded-lg border border-gray-800 bg-gray-900 p-2 text-xs">
                    <span className="text-gray-300">{n.body}</span>
                    <span className="mt-0.5 block text-gray-600">{n.author} · {fmt(n.at)}</span>
                  </li>
                ))}
              </ul>
            )}
            {!readOnly && (
              <div className="flex gap-2">
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={`Add a note as ${actor}…`} className={INPUT_CLS}
                  onKeyDown={(e) => { if (e.key === 'Enter' && note.trim()) { onAddNote(signal.id, note); setNote(''); } }} />
                <Btn tone="primary" disabled={!note.trim()} onClick={() => { onAddNote(signal.id, note); setNote(''); }}>Add</Btn>
              </div>
            )}
          </section>

          {!readOnly && (
            <div className="border-t border-gray-800 pt-3">
              <Btn size="sm" tone="danger" onClick={() => onRemove(signal.id)}><Trash2 className="h-3.5 w-3.5" /> Delete signal</Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Reclass<T extends string>({ label, value, options, labels, disabled, onChange }: {
  label: string; value: T; options: T[]; labels: Record<T, string>; disabled?: boolean; onChange: (v: T) => void;
}) {
  return (
    <label className="text-xs text-gray-500">
      {label}
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)} className={`${INPUT_CLS} mt-1`}>
        {options.map((o) => <option key={o} value={o}>{labels[o]}</option>)}
      </select>
    </label>
  );
}

function fmt(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
