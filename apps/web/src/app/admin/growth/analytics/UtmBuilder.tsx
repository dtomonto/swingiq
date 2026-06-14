'use client';

import { useState, useCallback } from 'react';
import { Link2, Copy, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildUtmUrl, UTM_PRESETS } from '@/lib/growth/utm';
import type { UTMLink } from '@/lib/growth/types';
import { SectionCard } from '../_components/ui';

interface Props {
  savedLinks: UTMLink[];
}

function useCopyButton() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      /* clipboard blocked — no-op */
    }
  }, []);

  return { copiedId, copy };
}

function CopyButton({
  text,
  id,
  copiedId,
  onCopy,
  className,
}: {
  text: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  className?: string;
}) {
  const copied = copiedId === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(text, id)}
      title="Copy to clipboard"
      className={cn(
        'inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all shrink-0',
        copied
          ? 'bg-success/15 border-success/40 text-success-text'
          : 'bg-muted border-border text-muted-foreground hover:border-border hover:text-foreground',
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function UtmBuilder({ savedLinks }: Props) {
  const [baseUrl, setBaseUrl] = useState('https://swingiq.app/');
  const [source, setSource] = useState('');
  const [medium, setMedium] = useState('');
  const [campaign, setCampaign] = useState('');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');

  const { copiedId, copy } = useCopyButton();

  const generatedUrl =
    source.trim() && medium.trim() && campaign.trim()
      ? buildUtmUrl({ baseUrl, source, medium, campaign, term, content })
      : '';

  const missingBaseUrl = !baseUrl.trim();
  const missingRequired = !source.trim() || !medium.trim() || !campaign.trim();

  return (
    <SectionCard title="UTM builder" icon={Link2}>
      <div className="space-y-5">
        {/* Preset buttons */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-success-text" />
            Quick presets — sets source &amp; medium
          </p>
          <div className="flex flex-wrap gap-1.5">
            {UTM_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSource(preset.source);
                  setMedium(preset.medium);
                }}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-lg border transition-all',
                  source === preset.source && medium === preset.medium
                    ? 'bg-success/20 border-success/50 text-success-text'
                    : 'bg-muted border-border text-muted-foreground hover:border-border hover:text-foreground',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form fields */}
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Base URL — full width */}
          <div className="sm:col-span-2">
            <label htmlFor="utm-base-url" className="block text-xs font-medium text-muted-foreground mb-1">
              Base URL <span className="text-error-text">*</span>
            </label>
            <input
              id="utm-base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://swingiq.app/"
              className={cn(
                'w-full rounded-lg border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70',
                'focus:outline-none focus:ring-1 focus:ring-success transition-colors',
                missingBaseUrl ? 'border-primary/60' : 'border-border',
              )}
            />
            {missingBaseUrl && (
              <p className="text-2xs text-link mt-0.5">Enter a base URL to generate a link.</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="utm-source" className="block text-xs font-medium text-muted-foreground mb-1">
              utm_source <span className="text-error-text">*</span>
              <span className="text-muted-foreground/70 font-normal ml-1">e.g. google, newsletter</span>
            </label>
            <input
              id="utm-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="google"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-success transition-colors"
            />
          </div>

          {/* Medium */}
          <div>
            <label htmlFor="utm-medium" className="block text-xs font-medium text-muted-foreground mb-1">
              utm_medium <span className="text-error-text">*</span>
              <span className="text-muted-foreground/70 font-normal ml-1">e.g. cpc, email, social</span>
            </label>
            <input
              id="utm-medium"
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="cpc"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-success transition-colors"
            />
          </div>

          {/* Campaign */}
          <div>
            <label htmlFor="utm-campaign" className="block text-xs font-medium text-muted-foreground mb-1">
              utm_campaign <span className="text-error-text">*</span>
              <span className="text-muted-foreground/70 font-normal ml-1">e.g. summer-launch</span>
            </label>
            <input
              id="utm-campaign"
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="summer-launch"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-success transition-colors"
            />
          </div>

          {/* Term (optional) */}
          <div>
            <label htmlFor="utm-term" className="block text-xs font-medium text-muted-foreground mb-1">
              utm_term
              <span className="text-muted-foreground/70 font-normal ml-1">optional · paid keyword</span>
            </label>
            <input
              id="utm-term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="golf swing app"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-success transition-colors"
            />
          </div>

          {/* Content (optional) — full width */}
          <div className="sm:col-span-2">
            <label htmlFor="utm-content" className="block text-xs font-medium text-muted-foreground mb-1">
              utm_content
              <span className="text-muted-foreground/70 font-normal ml-1">optional · ad variant or creative ID</span>
            </label>
            <input
              id="utm-content"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="hero-cta-v2"
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-success transition-colors"
            />
          </div>
        </div>

        {/* Generated URL output */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Generated URL</p>
          {missingRequired ? (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground/70">
              Fill in source, medium, and campaign to generate the URL.
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <code className="flex-1 min-w-0 block rounded-lg border border-success/30 bg-success/5 px-3 py-2.5 text-xs text-success-text break-all leading-relaxed">
                {generatedUrl}
              </code>
              <CopyButton
                text={generatedUrl}
                id="generated"
                copiedId={copiedId}
                onCopy={copy}
                className="mt-0.5"
              />
            </div>
          )}
        </div>

        {/* Saved links */}
        {savedLinks.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 pt-1 border-t border-border">
              Saved links ({savedLinks.length})
            </p>
            <div className="space-y-2">
              {savedLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{link.name}</p>
                    <p className="text-2xs text-muted-foreground mt-0.5 break-all leading-relaxed">
                      {link.generatedUrl}
                    </p>
                  </div>
                  <CopyButton
                    text={link.generatedUrl}
                    id={`saved-${link.id}`}
                    copiedId={copiedId}
                    onCopy={copy}
                    className="shrink-0 mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
