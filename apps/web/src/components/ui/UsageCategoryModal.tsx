'use client';

// ============================================================
// SwingIQ — Usage Category Onboarding Modal
// Shows once per device to capture the minimum-necessary usage
// category for youth safety and content appropriateness.
//
// This is NOT a full account signup — it only stores a local
// category flag. No PII is collected here.
// ============================================================

import { useState, useEffect } from 'react';
import { useSwingIQStore, type UsageCategory } from '@/store';
import { Shield, Users, User, GraduationCap, AlertTriangle } from 'lucide-react';

const CATEGORIES: Array<{
  value: Exclude<UsageCategory, null>;
  label: string;
  sublabel: string;
  icon: React.ElementType;
}> = [
  {
    value: 'adult',
    label: 'Adult athlete (18+)',
    sublabel: "I'm using SwingIQ for my own training",
    icon: User,
  },
  {
    value: 'parent_guardian',
    label: 'Parent or guardian',
    sublabel: "I'm helping a young athlete use SwingIQ",
    icon: Users,
  },
  {
    value: 'coach',
    label: 'Coach or instructor',
    sublabel: "I'm using SwingIQ with athletes I coach",
    icon: GraduationCap,
  },
  {
    value: 'minor_13_17',
    label: 'Young athlete (13–17)',
    sublabel: 'I am a teen athlete using SwingIQ',
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
  const { settings, updateSettings } = useSwingIQStore();
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<Exclude<UsageCategory, null> | null>(null);

  // Show the modal only after hydration and only if category not yet set
  useEffect(() => {
    if (settings.usage_category === null) {
      // Small delay so the page content renders first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [settings.usage_category]);

  function handleConfirm() {
    if (!selected) return;
    updateSettings({
      usage_category: selected,
      usage_category_set_at: new Date().toISOString(),
    });
    setVisible(false);
  }

  if (!visible) return null;

  const isUnder13 = selected === 'minor_under_13';

  return (
    <div
      className="fixed inset-0 z-200 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="usage-modal-title"
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Shield className="text-white" size={20} />
            </div>
            <div>
              <h2 id="usage-modal-title" className="text-lg font-bold text-foreground">
                Welcome to SwingIQ
              </h2>
              <p className="text-xs text-muted-foreground">One quick question before you start</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Who will be using SwingIQ on this device? This helps us apply the right safety settings.
            No personal information is collected.
          </p>
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
                className={selected === value ? 'text-primary' : 'text-muted-foreground'}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${selected === value ? 'text-primary' : 'text-foreground'}`}>
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
            <p className="text-sm font-semibold text-warning mb-1">Parent or guardian required</p>
            <p className="text-sm text-warning">
              SwingIQ is not designed for children under 13 without a parent or guardian. Please ask
              a parent or guardian to set up SwingIQ and select <strong>&quot;Parent or guardian&quot;</strong> on this screen.
            </p>
          </div>
        )}

        {/* Minor advisory */}
        {selected === 'minor_13_17' && (
          <div className="mx-6 mb-4 bg-accent-secondary/10 border border-accent-secondary/25 rounded-xl p-3">
            <p className="text-sm text-foreground">
              Welcome! For the best experience, let a parent, guardian, or coach know you&apos;re using SwingIQ.
              Always practice drills with adult supervision.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={handleConfirm}
            disabled={!selected || isUnder13}
            className="w-full bg-primary hover:bg-primary disabled:bg-muted disabled:text-muted-foreground text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continue to SwingIQ
          </button>
          <p className="text-center text-xs text-muted-foreground">
            This is stored only on your device. You can change it anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
