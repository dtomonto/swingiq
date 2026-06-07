'use client';

// ============================================================
// SwingVantage — Continue Progress banner
//
// Shown when auto-restore found a newer backup in the user's chosen
// folder AND there is already local data (so we must NOT overwrite
// without asking). When the device is empty, the provider continues
// automatically and this banner never appears.
// ============================================================

import { useAutoSync } from '@/lib/backup/autosync/auto-sync-provider';
import { Button } from '@/components/ui/Button';
import { History, X, Layers, RotateCcw } from 'lucide-react';

export function ContinueProgressBanner() {
  const { continuePrompt, applyContinue, dismissContinue } = useAutoSync();
  if (!continuePrompt) return null;

  const { preview, fileName } = continuePrompt;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="dialog"
      aria-label="Continue your progress"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-border bg-card shadow-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2 text-primary">
            <History size={18} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Continue where you left off?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Found a more recent backup on your device
              <span className="text-foreground"> ({fileName})</span>.
            </p>
            <p className="text-xs text-primary font-medium mt-1">{preview.summary}</p>
          </div>
          <button
            onClick={dismissContinue}
            className="shrink-0 text-muted-foreground hover:text-foreground p-1 -m-1"
            aria-label="Not now"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => applyContinue('merge')} className="w-full">
            <Layers size={15} aria-hidden="true" />
            Add to my data
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyContinue('replace')}
            className="w-full text-error border-error/40 hover:bg-error/10"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Replace all
          </Button>
        </div>
        <p className="text-[11px] leading-snug text-muted-foreground">
          <strong className="text-foreground">Add</strong> keeps everything you already have and brings in
          anything new. <strong className="text-foreground">Replace</strong> swaps your current data for the
          backup. Nothing changes until you choose.
        </p>
      </div>
    </div>
  );
}
