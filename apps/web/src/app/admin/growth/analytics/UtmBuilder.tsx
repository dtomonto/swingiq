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
          ? 'bg-green-500/15 border-green-500/40 text-green-400'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200',
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
          <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-green-400" />
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
                    ? 'bg-green-600/20 border-green-500/50 text-green-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200',
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
            <label htmlFor="utm-base-url" className="block text-xs font-medium text-gray-400 mb-1">
              Base URL <span className="text-red-400">*</span>
            </label>
            <input
              id="utm-base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://swingiq.app/"
              className={cn(
                'w-full rounded-lg border bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600',
                'focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors',
                missingBaseUrl ? 'border-amber-500/60' : 'border-gray-700',
              )}
            />
            {missingBaseUrl && (
              <p className="text-[11px] text-amber-400 mt-0.5">Enter a base URL to generate a link.</p>
            )}
          </div>

          {/* Source */}
          <div>
            <label htmlFor="utm-source" className="block text-xs font-medium text-gray-400 mb-1">
              utm_source <span className="text-red-400">*</span>
              <span className="text-gray-600 font-normal ml-1">e.g. google, newsletter</span>
            </label>
            <input
              id="utm-source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="google"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>

          {/* Medium */}
          <div>
            <label htmlFor="utm-medium" className="block text-xs font-medium text-gray-400 mb-1">
              utm_medium <span className="text-red-400">*</span>
              <span className="text-gray-600 font-normal ml-1">e.g. cpc, email, social</span>
            </label>
            <input
              id="utm-medium"
              type="text"
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              placeholder="cpc"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>

          {/* Campaign */}
          <div>
            <label htmlFor="utm-campaign" className="block text-xs font-medium text-gray-400 mb-1">
              utm_campaign <span className="text-red-400">*</span>
              <span className="text-gray-600 font-normal ml-1">e.g. summer-launch</span>
            </label>
            <input
              id="utm-campaign"
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="summer-launch"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>

          {/* Term (optional) */}
          <div>
            <label htmlFor="utm-term" className="block text-xs font-medium text-gray-400 mb-1">
              utm_term
              <span className="text-gray-600 font-normal ml-1">optional · paid keyword</span>
            </label>
            <input
              id="utm-term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="golf swing app"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>

          {/* Content (optional) — full width */}
          <div className="sm:col-span-2">
            <label htmlFor="utm-content" className="block text-xs font-medium text-gray-400 mb-1">
              utm_content
              <span className="text-gray-600 font-normal ml-1">optional · ad variant or creative ID</span>
            </label>
            <input
              id="utm-content"
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="hero-cta-v2"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Generated URL output */}
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Generated URL</p>
          {missingRequired ? (
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-xs text-gray-600">
              Fill in source, medium, and campaign to generate the URL.
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <code className="flex-1 min-w-0 block rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2.5 text-xs text-green-300 break-all leading-relaxed">
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
            <p className="text-xs font-semibold text-gray-400 mb-2 pt-1 border-t border-gray-800">
              Saved links ({savedLinks.length})
            </p>
            <div className="space-y-2">
              {savedLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2.5 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-300 truncate">{link.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 break-all leading-relaxed">
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
