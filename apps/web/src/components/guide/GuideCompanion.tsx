'use client';

// ============================================================
// SwingVantage — Guide Companion ("the genie")
// ------------------------------------------------------------
// A persistent, friendly floating guide that overlays the whole
// app. Proactive (Clippy-style): on a page you haven't seen, its
// tip bubble opens on its own and shows:
//   • where you are in the Today → Share journey,
//   • what to do / where to stand on THIS screen,
//   • your single next best step (from the agent layer).
//
// Humane-by-design: it auto-opens only ONCE per page (so it never
// nags), can be re-summoned any time, and has a one-tap
// "turn off auto-tips" switch. All preferences live in their own
// localStorage key — they never touch the store or backups.
//
// Positioning is owned by <FloatingDock>: this guide is a dock child,
// stacked in the shared bottom-right corner ABOVE the AI Coach, with
// spacing/z-index/safe-area handled centrally. The dock also enforces
// "one floating panel open at a time", so the guide bubble and the
// coach chat can never overlap. See components/layout/FloatingDock.tsx.
// ============================================================

import { useEffect, useCallback, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronRight, Lightbulb, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentInsights } from '@/hooks/useAgentInsights';
import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import { getGuideScript } from '@/lib/guide/script';
import { JOURNEY_STEPS, stageIndex } from '@/lib/guide/journey';
import { loadGuideState, patchGuideState, markPageSeen } from '@/lib/guide/storage';
import { useFloatingDock } from '@/components/layout/FloatingDock';
import { GuideMascot } from './GuideMascot';

export function GuideCompanion() {
  const pathname = usePathname();
  const { nextBestAction, ready } = useAgentInsights();

  // First-run sequencing: a brand-new athlete must first clear the mandatory
  // youth-safety / identity gate (UsageCategoryModal). Until that's resolved we
  // hold back the proactive tip so the guide bubble and that full-screen modal
  // don't both open over a fresh profile's first page and stack. `hasIdentity`
  // is the same durable, data-derived signal the gate itself uses, so returning
  // users (already identified) are never delayed; once identity is recorded this
  // effect re-runs and the guide resumes on the next unseen page.
  const { ready: identityReady, hasIdentity } = useOnboarding();
  const identityResolved = identityReady && hasIdentity;

  // Open state is owned by the dock (so the guide bubble and the AI Coach
  // chat are mutually exclusive — only one floating panel shows at a time).
  const { isOpen: open, open: openDock, close: closeDock, toggle: toggleDock } =
    useFloatingDock('guide');
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [pageSeen, setPageSeen] = useState(true);

  const script = useMemo(() => getGuideScript(pathname), [pathname]);

  // Hydrate from localStorage after mount (keeps SSR markup stable).
  useEffect(() => setMounted(true), []);

  // Proactive open whenever the user lands on a page they haven't
  // acknowledged yet. Re-runs on every route change (and when identity is
  // resolved, so the first-run tip appears right after the safety gate).
  useEffect(() => {
    if (!mounted) return;
    const s = loadGuideState();
    const seen = s.seenPages.includes(pathname);
    setHidden(s.hidden);
    setPageSeen(seen);
    if (!s.hidden && s.autoOpen && !seen && identityResolved) openDock();
    else closeDock();
  }, [pathname, mounted, identityResolved, openDock, closeDock]);

  const remember = useCallback(() => {
    markPageSeen(pathname);
    setPageSeen(true);
  }, [pathname]);

  const closeAndRemember = useCallback(() => {
    closeDock();
    remember();
  }, [closeDock, remember]);

  const toggle = useCallback(() => {
    if (open) remember();
    toggleDock();
  }, [open, remember, toggleDock]);

  const turnOffTips = useCallback(() => {
    patchGuideState({ autoOpen: false });
    closeAndRemember();
  }, [closeAndRemember]);

  // Esc closes the bubble.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAndRemember();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, closeAndRemember]);

  if (!mounted || hidden) return null;

  const currentStage = stageIndex(script.stage);

  return (
    <>
      {/* Speech bubble — anchored above the dock cluster by `.floating-panel`.
          Full-width on phones, a tidy card on the right from sm up. */}
      {open && (
        <div
          role="dialog"
          aria-label="Your SwingVantage guide"
          data-testid="help-panel-secondary"
          className="floating-panel no-print left-4 sm:left-auto sm:w-80 bg-card text-foreground rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-golf-dark">
            <div className="flex items-center gap-2 min-w-0">
              <GuideMascot size={26} />
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold leading-tight">Your guide</p>
                <p className="text-white/80 text-[11px] leading-tight">Here to show you the way</p>
              </div>
            </div>
            <button
              onClick={closeAndRemember}
              aria-label="Close guide"
              className="text-white/80 hover:text-white shrink-0 p-1 -m-1"
            >
              <X size={16} />
            </button>
          </div>

          {/* Journey stepper — the "clear path". Each stop is also a shortcut. */}
          {currentStage && (
            <nav aria-label="Your journey" className="flex items-stretch gap-1.5 px-4 pt-3">
              {JOURNEY_STEPS.map((step, i) => {
                const active = i + 1 === currentStage;
                const done = i + 1 < currentStage;
                return (
                  <Link
                    key={step.stage}
                    href={step.href}
                    onClick={closeAndRemember}
                    className="group flex-1 flex flex-col items-center gap-1"
                    aria-current={active ? 'step' : undefined}
                    title={`Go to ${step.label}`}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-full rounded-full transition-colors',
                        active ? 'bg-primary' : done ? 'bg-primary/50' : 'bg-muted group-hover:bg-muted-foreground/40',
                      )}
                    />
                    <span
                      className={cn(
                        'text-[10px] leading-none',
                        active ? 'text-primary font-semibold' : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Body */}
          <div className="px-4 py-3 space-y-2.5" aria-live="polite">
            <h2 className="text-sm font-bold text-foreground">{script.title}</h2>

            <ul className="space-y-1.5">
              {script.lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground/90">
                  <ChevronRight size={13} className="mt-0.5 text-primary shrink-0" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            {script.tip && (
              <div className="flex items-start gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 text-[12px] text-foreground/90">
                <Lightbulb size={13} className="mt-0.5 text-primary shrink-0" aria-hidden="true" />
                <span>{script.tip}</span>
              </div>
            )}

            {/* The single next best step, straight from the agent layer. */}
            {ready && nextBestAction && (
              <Link
                href={nextBestAction.href}
                onClick={closeAndRemember}
                className="group mt-0.5 flex items-center justify-between gap-2 rounded-xl bg-golf-dark text-white px-3.5 py-2.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] text-white/80 font-medium group-hover:text-primary-foreground/80">Your next best step</span>
                  <span className="block text-sm font-semibold truncate">{nextBestAction.label}</span>
                </span>
                <ChevronRight size={16} className="shrink-0" aria-hidden="true" />
              </Link>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border bg-muted/40">
            <button
              onClick={turnOffTips}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <BellOff size={12} aria-hidden="true" />
              Turn off auto-tips
            </button>
            <button
              onClick={closeAndRemember}
              className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold px-3.5 py-1.5 hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Mascot launcher — the dock owns its position/spacing/z-index; it sits
          stacked just above the AI Coach launcher in the shared dock. */}
      <button
        onClick={toggle}
        data-testid="help-tool-secondary"
        aria-label={open ? 'Close your guide' : 'Open your guide'}
        aria-expanded={open}
        className="no-print flex items-center justify-center rounded-full bg-card border border-border shadow-lg w-14 h-14 hover:shadow-xl transition-shadow motion-safe:animate-guide-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <GuideMascot size={40} />
        {/* "I have a tip" dot — shown when collapsed on a page you haven't seen. */}
        {!open && !pageSeen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full rounded-full bg-golf-gold opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-golf-gold border-2 border-card" />
          </span>
        )}
      </button>
    </>
  );
}
