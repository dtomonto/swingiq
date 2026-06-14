'use client';

// ============================================================
// SearchIntelligenceOS — Content Brief generator (client)
// ------------------------------------------------------------
// Deterministic, keyless brief — runs `generateBrief` in the browser (it's a
// pure function). Never auto-publishes; the no-fabrication warning is always
// shown. Imports the generator directly (not the engine index) to keep the
// client bundle light.
// ============================================================

import { useMemo, useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { generateBrief } from '@/lib/growth/search-intelligence/briefs';
import type { ContentBrief, LinkIntent, LinkSport } from '@/lib/growth/search-intelligence/types';

const SPORTS: LinkSport[] = ['multi', 'golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball'];
const INTENTS: LinkIntent[] = ['informational', 'commercial', 'transactional', 'navigational'];

export function BriefGenerator({ initial }: { initial: { topic?: string; sport?: LinkSport; intent?: LinkIntent } }) {
  const [topic, setTopic] = useState(initial.topic ?? '');
  const [keyword, setKeyword] = useState(initial.topic ?? '');
  const [sport, setSport] = useState<LinkSport>(initial.sport ?? 'multi');
  const [intent, setIntent] = useState<LinkIntent>(initial.intent ?? 'informational');
  const [submitted, setSubmitted] = useState(Boolean(initial.topic));
  const [copied, setCopied] = useState(false);

  const brief = useMemo<ContentBrief | null>(() => {
    if (!submitted || !topic.trim()) return null;
    return generateBrief({ topic: topic.trim(), targetKeyword: keyword.trim() || undefined, sport, intent });
  }, [submitted, topic, keyword, sport, intent]);

  function copy() {
    if (!brief) return;
    navigator.clipboard.writeText(JSON.stringify(brief, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      {/* Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
        className="rounded-xl border border-border bg-card p-4 grid sm:grid-cols-2 gap-3"
      >
        <Field label="Topic">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. fix golf slice" className={inputCls} />
        </Field>
        <Field label="Target keyword (optional)">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="defaults to topic" className={inputCls} />
        </Field>
        <Field label="Sport">
          <select value={sport} onChange={(e) => setSport(e.target.value as LinkSport)} className={inputCls}>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Intent">
          <select value={intent} onChange={(e) => setIntent(e.target.value as LinkIntent)} className={inputCls}>
            {INTENTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-success hover:bg-success text-white text-sm font-semibold px-4 py-2">
            <Sparkles className="w-4 h-4" /> Generate brief
          </button>
        </div>
      </form>

      {/* Brief */}
      {brief ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <h2 className="text-sm font-semibold text-foreground">{brief.h1}</h2>
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              {copied ? <Check className="w-3.5 h-3.5 text-success-text" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <Block label="Objective">{brief.objective}</Block>
            <div className="grid sm:grid-cols-2 gap-4">
              <Block label="Primary keyword">{brief.primaryKeyword}</Block>
              <Block label="Search intent">{brief.searchIntent}</Block>
              <Block label="Proposed slug"><span className="font-mono text-xs">/{brief.proposedSlug}</span></Block>
              <Block label="Audience">{brief.audience}</Block>
            </div>
            <ListBlock label="Title options" items={brief.titleOptions} />
            <ListBlock label="Meta description options" items={brief.metaDescriptionOptions} />
            <div>
              <Label>Outline</Label>
              <ul className="space-y-1.5">
                {brief.outline.map((s, i) => (
                  <li key={i} className="text-foreground">
                    <span className="font-medium">{s.heading}</span>
                    <span className="text-muted-foreground text-xs"> — {s.subpoints.join('; ')}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Block label="Direct-answer block"><span className="text-muted-foreground italic">{brief.directAnswerBlock}</span></Block>
            <div>
              <Label>FAQs</Label>
              <ul className="space-y-1.5">
                {brief.faqs.map((f, i) => <li key={i} className="text-foreground"><span className="font-medium">{f.question}</span> <span className="text-muted-foreground text-xs">— {f.answer}</span></li>)}
              </ul>
            </div>
            {brief.howToSteps.length > 0 ? <ListBlock label="How-to steps" items={brief.howToSteps} ordered /> : null}
            <div className="grid sm:grid-cols-2 gap-4">
              <ListBlock label="Schema" items={brief.schemaRecommendations} />
              <ListBlock label="Internal links to add" items={brief.internalLinksToAdd} />
              <ListBlock label="Quality checklist" items={brief.qualityChecklist} />
              <ListBlock label="AEO/GEO checklist" items={brief.aeoGeoChecklist} />
            </div>
            <Block label="Differentiation angle">{brief.differentiationAngle}</Block>
            <Block label="CTA">{brief.cta}</Block>
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-xs text-error-text">
              <strong>No fabrication:</strong> {brief.noFabricationWarning}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Enter a topic and generate a production-ready brief. It never auto-publishes.</p>
      )}
    </div>
  );
}

const inputCls = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-hidden focus:ring-1 focus:ring-success';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{children}</p>;
}
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label><p className="text-foreground">{children}</p></div>;
}
function ListBlock({ label, items, ordered }: { label: string; items: string[]; ordered?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <ul className="space-y-0.5">
        {items.map((it, i) => <li key={i} className="text-foreground text-xs">{ordered ? `${i + 1}. ` : '• '}{it}</li>)}
      </ul>
    </div>
  );
}
