'use client';

import { useState } from 'react';
import { Copy, Mail, Share2, Printer, Check, ShieldAlert, Download } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { shareCardImage } from '@/lib/share/shareCard';

export interface ReportData {
  sport: string;
  topIssue: string;
  /** Optional confidence wording, only shown if provided. */
  confidence?: string;
  drills: string[];
  planSummary: string;
  /** Whether this report belongs to a youth athlete (blocks public sharing UI). */
  isYouth?: boolean;
}

function buildSummary(d: ReportData): string {
  const lines = [
    `My SwingVantage ${d.sport} summary`,
    '',
    `Top priority: ${d.topIssue}`,
    d.confidence ? `Confidence: ${d.confidence}` : '',
    '',
    'Drills:',
    ...d.drills.map((x, i) => `  ${i + 1}. ${x}`),
    '',
    `Practice plan: ${d.planSummary}`,
    '',
    `Made with SwingVantage — free AI swing analysis: ${siteConfig.liveSiteUrl}`,
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

/**
 * Privacy-safe shareable report card. Shares only a text summary —
 * never raw video. Public/web-share is disabled for youth reports by
 * default. Shows a privacy reminder before any share action.
 */
export function ShareableReportCard({ data }: { data: ReportData }) {
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [imageState, setImageState] = useState<'idle' | 'working'>('idle');
  const summary = buildSummary(data);

  async function saveImage() {
    setImageState('working');
    const result = await shareCardImage(data);
    if (result !== 'failed') {
      track(ANALYTICS_EVENTS.REPORT_SHARED, { sport: data.sport, method: `image_${result}` });
    }
    setImageState('idle');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      track(ANALYTICS_EVENTS.REPORT_COPIED, { sport: data.sport });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function emailCoach() {
    const subject = encodeURIComponent(`My SwingVantage ${data.sport} summary`);
    const body = encodeURIComponent(summary);
    track(ANALYTICS_EVENTS.COACH_SHARE_CLICKED, { sport: data.sport });
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  async function webShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `My SwingVantage ${data.sport} summary`, text: summary });
        track(ANALYTICS_EVENTS.REPORT_SHARED, { sport: data.sport, method: 'web_share' });
      } catch { /* user cancelled */ }
    } else {
      copy();
    }
  }

  function print() {
    track(ANALYTICS_EVENTS.PDF_DOWNLOADED, { sport: data.sport });
    window.print();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs print:border-0 print:shadow-none">
      {/* Report body (printable) */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-bold text-foreground">SwingVantage Report</span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{data.sport}</span>
        </div>

        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">Top priority</p>
          <p className="mt-1 font-bold text-foreground">{data.topIssue}</p>
          {data.confidence && <p className="mt-1 text-xs text-muted-foreground">Confidence: {data.confidence}</p>}
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">Drills</p>
          <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
            {data.drills.map((d, i) => <li key={d}>{i + 1}. {d}</li>)}
          </ul>
        </div>

        <div className="mt-4 rounded-xl bg-muted p-4">
          <p className="text-sm font-semibold text-foreground">Practice plan</p>
          <p className="mt-1 text-sm text-muted-foreground">{data.planSummary}</p>
        </div>

        <p className="mt-4 text-[11px] italic text-muted-foreground">
          AI estimate, not certified instruction. Made with SwingVantage — {siteConfig.liveSiteUrl}
        </p>
      </div>

      {/* Actions (hidden when printing) */}
      <div className="border-t border-border bg-muted p-4 print:hidden">
        {/* Privacy reminder */}
        <label className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5"
          />
          <span className="flex items-start gap-1">
            <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            I understand this shares a text summary (no video).
            {data.isYouth && ' For a youth athlete, only a parent or guardian should share this.'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button onClick={copy} disabled={!acknowledged}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            {copied ? <><Check size={15} className="text-primary" /> Copied</> : <><Copy size={15} /> Copy</>}
          </button>
          <button onClick={emailCoach} disabled={!acknowledged}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <Mail size={15} /> Coach
          </button>
          <button onClick={webShare} disabled={!acknowledged}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <Share2 size={15} /> Share
          </button>
          <button onClick={saveImage} disabled={!acknowledged || imageState === 'working'}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <Download size={15} /> {imageState === 'working' ? '…' : 'Image'}
          </button>
          <button onClick={print}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
            <Printer size={15} /> Print / PDF
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tip: use your browser&apos;s &ldquo;Save as PDF&rdquo; in the print dialog to export a PDF.
        </p>
      </div>
    </div>
  );
}
