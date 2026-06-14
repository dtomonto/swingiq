'use client';

// ============================================================
// SwingVantage — AGI: Shareable report card
// ------------------------------------------------------------
// Copy / email-coach / web-share / print the Athlete General Intelligence
// report. Mirrors the app's ShareableReportCard pattern (privacy ack, analytics,
// youth-safe) but for the richer cross-sport report. Shares TEXT only — never
// video or raw pose. Print opens a clean, self-contained window (no app chrome).
// ============================================================

import { useState } from 'react';
import { Copy, Mail, Share2, Printer, Check, ShieldAlert } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { useSwingVantageStore } from '@/store';
import { buildAgiReportText, buildAgiReportHtml, type AthleteGIResult } from '@/lib/agi';
import { Card, CardBody } from '@/components/ui/Card';

export function AgiReportCard({ result }: { result: AthleteGIResult }) {
  const usage = useSwingVantageStore((s) => s.settings.usage_category);
  const isYouth = usage === 'minor_13_17' || usage === 'minor_under_13';
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);

  const text = buildAgiReportText(result, { siteUrl: siteConfig.liveSiteUrl });

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track(ANALYTICS_EVENTS.REPORT_COPIED, { sport: 'multi' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function emailCoach() {
    const subject = encodeURIComponent('My SwingVantage — Athlete General Intelligence');
    track(ANALYTICS_EVENTS.COACH_SHARE_CLICKED, { sport: 'multi' });
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(text)}`;
  }

  async function webShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My SwingVantage Athlete GI', text });
        track(ANALYTICS_EVENTS.REPORT_SHARED, { sport: 'multi', method: 'web_share' });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  function print() {
    // Render the (HTML-escaped) report into a hidden iframe and print it — avoids
    // pop-up blockers and the deprecated document.write, with no app chrome.
    const html = buildAgiReportHtml(result, { siteUrl: siteConfig.liveSiteUrl });
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    iframe.srcdoc = html;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        /* printing unavailable */
      }
      setTimeout(() => iframe.remove(), 1000);
    };
    document.body.appendChild(iframe);
    track(ANALYTICS_EVENTS.PDF_DOWNLOADED, { sport: 'multi' });
  }

  const btn =
    'flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <Card>
      <CardBody className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Share this report</h2>
          <p className="text-xs text-muted-foreground">
            Send your cross-sport summary to a coach, or save it as a PDF. Text only — no video.
          </p>
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
          <span className="flex items-start gap-1">
            <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
            I understand this shares a text summary (no video).
            {isYouth && ' For a youth athlete, only a parent or guardian should share this.'}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button onClick={copy} disabled={!ack} className={btn}>
            {copied ? (
              <>
                <Check size={15} className="text-primary" /> Copied
              </>
            ) : (
              <>
                <Copy size={15} /> Copy
              </>
            )}
          </button>
          <button onClick={emailCoach} disabled={!ack} className={btn}>
            <Mail size={15} /> Coach
          </button>
          <button onClick={webShare} disabled={!ack} className={btn}>
            <Share2 size={15} /> Share
          </button>
          <button onClick={print} className={btn}>
            <Printer size={15} /> Print / PDF
          </button>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
            Preview the text
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-2xs leading-relaxed text-foreground">
            {text}
          </pre>
        </details>
      </CardBody>
    </Card>
  );
}
