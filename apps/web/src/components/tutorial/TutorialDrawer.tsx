'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TutorialContent } from '@/lib/tutorial/types';

interface TutorialDrawerProps {
  tutorial: TutorialContent;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  onDismiss: () => void;
  /** Whether the user has previously completed this tutorial */
  alreadyCompleted?: boolean;
}

export function TutorialDrawer({
  tutorial,
  open,
  onClose,
  onComplete,
  onDismiss,
  alreadyCompleted = false,
}: TutorialDrawerProps) {
  const [step, setStep] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const totalSteps = tutorial.steps.length;
  const isFirstStep = step === 0;
  const isLastStep = step === totalSteps - 1;

  // Reset to first step when tutorial changes or drawer opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open, tutorial.id]);

  // Trap focus inside drawer when open
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onDismiss();
      }
      if (e.key === 'ArrowRight' && !isLastStep) {
        setStep((s) => s + 1);
      }
      if (e.key === 'ArrowLeft' && !isFirstStep) {
        setStep((s) => s - 1);
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, isFirstStep, isLastStep, onDismiss]);

  const handleComplete = useCallback(() => {
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  if (!open) return null;

  const currentStep = tutorial.steps[step];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent"
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Help: ${tutorial.pageTitle}`}
        className={cn(
          'fixed z-50 bg-card shadow-2xl flex flex-col',
          'bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]',
          'lg:bottom-auto lg:top-20 lg:right-4 lg:left-auto lg:w-96 lg:rounded-2xl lg:max-h-[calc(100vh-6rem)]',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary uppercase tracking-wide">Guide</p>
              <h2 className="text-base font-bold text-foreground truncate">{tutorial.pageTitle}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onDismiss}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 ml-2"
            aria-label="Close guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Intro (only on first step) */}
          {isFirstStep && (
            <p className="text-sm text-muted-foreground leading-relaxed">{tutorial.intro}</p>
          )}

          {/* Step content */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
              Step {step + 1} of {totalSteps}
            </p>
            <h3 className="text-sm font-bold text-foreground">{currentStep.title}</h3>
            <p className="text-sm text-foreground leading-relaxed">{currentStep.body}</p>
          </div>

          {/* Step progress dots */}
          {totalSteps > 1 && (
            <div className="flex justify-center gap-1.5 py-1" aria-label={`Step ${step + 1} of ${totalSteps}`}>
              {tutorial.steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i === step ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground',
                  )}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === step ? 'step' : undefined}
                />
              ))}
            </div>
          )}

          {alreadyCompleted && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
              <CheckCircle size={14} aria-hidden="true" />
              <span>You have already completed this guide.</span>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex gap-3">
          {!isFirstStep && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              aria-label="Previous step"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Back
            </button>
          )}

          {isFirstStep && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Not now
            </button>
          )}

          <div className="flex-1" />

          {!isLastStep ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary transition-colors"
              aria-label="Next step"
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary transition-colors"
            >
              <CheckCircle size={16} aria-hidden="true" />
              Got it
            </button>
          )}
        </div>
      </div>
    </>
  );
}
