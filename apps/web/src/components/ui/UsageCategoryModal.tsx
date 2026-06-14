'use client';

// ============================================================
// SwingVantage — Usage Category Onboarding Modal
// Shows once per device to capture the minimum-necessary usage
// category for youth safety and content appropriateness.
//
// This is NOT a full account signup — it only stores a local
// category flag. No PII is collected here.
//
// Built on the shared <Dialog> primitive (Radix) for focus-trap, scroll-lock
// and modal semantics. It's a MUST-ANSWER step, so ESC / outside-click closing
// is prevented and there's no close affordance — it dismisses only via the
// Continue action once a category is chosen.
// ============================================================

import { useState, useEffect } from 'react';
import { useSwingVantageStore, type UsageCategory } from '@/store';
import { Shield, Users, User, GraduationCap, AlertTriangle } from 'lucide-react';
import { useOnboarding } from '@/lib/onboarding/useOnboarding';
import type { OnboardingRole } from '@/lib/onboarding/state';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

// Map the safety usage-category to the onboarding role so the onboarding
// state machine (the single source of truth) records who the athlete is and
// advances past "new_user" — the same identity is never asked for again.
const CATEGORY_TO_ROLE: Record<Exclude<UsageCategory, null>, OnboardingRole> = {
  adult: 'athlete',
  parent_guardian: 'parent',
  coach: 'coach',
  minor_13_17: 'athlete',
  minor_under_13: 'parent',
};

const CATEGORIES: Array<{
  value: Exclude<UsageCategory, null>;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}> = [
  {
    value: 'adult',
    label: 'Adult athlete (18+)',
    sublabel: "I'm using SwingVantage for my own training",
    icon: User,
  },
  {
    value: 'parent_guardian',
    label: 'Parent or guardian',
    sublabel: "I'm helping a young athlete use SwingVantage",
    icon: Users,
  },
  {
    value: 'coach',
    label: 'Coach or instructor',
    sublabel: "I'm using SwingVantage with athletes I coach",
    icon: GraduationCap,
  },
  {
    value: 'minor_13_17',
    label: 'Young athlete (13–17)',
    sublabel: 'I am a teen athlete using SwingVantage',
    icon: User,
  },
  {
    value: 'minor_under_13',
    label: 'Under 13',
    sublabel: 'I need a parent or guardian to set this up',
    icon: AlertTriangle,
  },
];

export function UsageCategoryModal() {
  const { updateSettings, advanceOnboarding, setOnboardingRole } = useSwingVantageStore();
  // `ready` = the persisted store has hydrated (so we never flash before the
  // saved answer loads). `hasIdentity` = the DURABLE, data-derived signal that
  // the athlete already told us who they are — profile / sport / role / usage
  // category, synced via the onboarding marker. Once true it never regresses, so
  // a returning user (even on a fresh device once signed in) is never re-asked.
  const { ready, hasIdentity } = useOnboarding();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Exclude<UsageCategory, null> | null>(null);

  // Show ONCE, only for a brand-new athlete who hasn't been identified yet.
  // The render is also gated on `hasIdentity` below, so it disappears the moment
  // identity is known (here or anywhere else) without a setState-in-effect.
  useEffect(() => {
    if (!ready || hasIdentity) return undefined;
    // Small delay so the page content renders first.
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [ready, hasIdentity]);

  function handleConfirm() {
    if (!selected) return;
    updateSettings({
      usage_category: selected,
      usage_category_set_at: new Date().toISOString(),
    });
    // Feed the canonical onboarding machine: record the role and advance past
    // new_user so identity is never re-asked (never regresses — see
    // lib/onboarding/state.ts).
    setOnboardingRole(CATEGORY_TO_ROLE[selected]);
    advanceOnboarding('identity_completed');
    setVisible(false);
  }

  if (!visible || hasIdentity) return null;

  const isUnder13 = selected === 'minor_under_13';

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        // Must-answer: ignore close requests; only handleConfirm dismisses it.
        if (open) setVisible(true);
      }}
    >
      <DialogContent
        hideClose
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Reset the primitive's padding/grid so the existing per-section layout
        // is preserved; card surface + scrollable for long content.
        className="block max-h-[90vh] max-w-md gap-0 overflow-y-auto rounded-2xl bg-card p-0"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Shield className="text-primary-foreground" size={20} aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Welcome to SwingVantage
              </DialogTitle>
              <p className="text-xs text-muted-foreground">One quick question before you start</p>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Who will be using SwingVantage on this device? This helps us apply the right safety settings.
            No personal information is collected.
          </DialogDescription>
        </div>

        {/* Options */}
        <div className="px-6 space-y-2 pb-4">
          {CATEGORIES.map(({ value, label, sublabel, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                selected === value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border bg-card'
              }`}
            >
              <Icon
                size={18}
                className={selected === value ? 'text-link' : 'text-muted-foreground'}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${selected === value ? 'text-link' : 'text-foreground'}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{sublabel}</p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  selected === value ? 'border-primary bg-primary' : 'border-border'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Under-13 warning */}
        {isUnder13 && (
          <div className="mx-6 mb-4 bg-warning/10 border border-warning/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-warning-text mb-1">Parent or guardian required</p>
            <p className="text-sm text-warning-text">
              SwingVantage is not designed for children under 13 without a parent or guardian. Please ask
              a parent or guardian to set up SwingVantage and select <strong>&quot;Parent or guardian&quot;</strong> on this screen.
            </p>
          </div>
        )}

        {/* Minor advisory */}
        {selected === 'minor_13_17' && (
          <div className="mx-6 mb-4 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-3">
            <p className="text-sm text-foreground">
              Welcome! For the best experience, let a parent, guardian, or coach know you&apos;re using SwingVantage.
              Always practice drills with adult supervision.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <Button onClick={handleConfirm} disabled={!selected || isUnder13} className="w-full">
            Continue to SwingVantage
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            This is a private setting. You can change it anytime in Settings.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
