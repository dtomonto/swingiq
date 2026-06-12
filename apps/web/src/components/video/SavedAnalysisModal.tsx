'use client';

// ============================================================
// SwingVantage — Saved Analysis Viewer (modal)
// ------------------------------------------------------------
// Re-opens a previously saved video analysis from swing history so
// the user can read the AI's full review again AND replay the original
// clip. The clip is kept on-device in IndexedDB (see clip-store) and
// loaded lazily here; if it was evicted (we keep only the most recent
// few) or storage is unavailable, we fall back to an honest note and
// still show the saved text analysis. Purely presentational — the
// parent owns which record (if any) is open.
// ============================================================

import { useEffect, useState } from 'react';
import { X, Download, Film, CalendarDays, Loader2 } from 'lucide-react';
import { AIVisualAnalysisPanel } from './AIVisualAnalysisPanel';
import { SwingVideoPlayer } from './SwingVideoPlayer';
import { getClipBlob } from '@/lib/video/clip-store';
import type { SavedVideoAnalysis } from '@/lib/video/history';

function confidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 0.66) return 'High';
  if (score >= 0.4) return 'Medium';
  return 'Low';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

interface SavedAnalysisModalProps {
  record: SavedVideoAnalysis | null;
  onClose: () => void;
  onExport: (record: SavedVideoAnalysis) => void;
}

type ClipState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'missing' };

export function SavedAnalysisModal({ record, onClose, onExport }: SavedAnalysisModalProps) {
  const [clip, setClip] = useState<ClipState>({ status: 'loading' });

  // Close on Escape. The effect is always declared (stable hook order) and
  // simply no-ops when nothing is open.
  useEffect(() => {
    if (!record) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [record, onClose]);

  // Load the on-device clip for the open record. Revokes the object URL on
  // close / record change so we never leak blobs.
  useEffect(() => {
    if (!record) {
      setClip({ status: 'loading' });
      return undefined;
    }
    let cancelled = false;
    let url: string | null = null;
    setClip({ status: 'loading' });
    getClipBlob(record.id)
      .then((blob) => {
        if (cancelled) return;
        if (blob) {
          url = URL.createObjectURL(blob);
          setClip({ status: 'ready', url });
        } else {
          setClip({ status: 'missing' });
        }
      })
      .catch(() => {
        if (!cancelled) setClip({ status: 'missing' });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [record]);

  if (!record) return null;

  return (
    <div
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs px-0 sm:px-4 py-0 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-analysis-title"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-start gap-3">
          <span className="text-2xl shrink-0" aria-hidden>
            {record.emoji ?? '🎯'}
          </span>
          <div className="flex-1 min-w-0">
            <h2 id="saved-analysis-title" className="text-base font-bold text-foreground truncate">
              {record.topFocus}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDate(record.createdAt)} · {record.sportLabel} ·{' '}
              {confidenceLabel(record.overallConfidence)} confidence
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label="Close saved analysis"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Clip replay — loaded from on-device storage. */}
          {clip.status === 'loading' && (
            <div className="rounded-xl border border-border bg-muted flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading your saved clip…
            </div>
          )}

          {clip.status === 'ready' && (
            <div className="rounded-xl overflow-hidden bg-black">
              <SwingVideoPlayer objectUrl={clip.url} />
            </div>
          )}

          {clip.status === 'missing' && (
            <div className="rounded-xl border border-border bg-muted p-3 flex items-start gap-2">
              <Film className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                The clip for this swing isn&apos;t available to replay — clips are kept on your device
                for your most recent swings only, and this one has since been cleared. Your saved AI
                analysis is shown below.
              </p>
            </div>
          )}

          <AIVisualAnalysisPanel analysis={record.analysis} />

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onExport(record)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Export as JSON
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
