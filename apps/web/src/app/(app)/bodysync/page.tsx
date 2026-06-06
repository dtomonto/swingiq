'use client';

// ============================================================
// SwingVantage — BodySync · Performance Pulse
// The health-performance intelligence dashboard. Consent-gated, mobile-first.
// ============================================================

import { useState } from 'react';
import { HeartPulse, Download, Trash2, Settings2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBodySync, CATEGORY_META } from '@/lib/bodysync';
import type { HealthCategory } from '@/lib/bodysync';
import { HealthConsentGate } from '@/components/bodysync/HealthConsentGate';
import { ReadinessScoreCard } from '@/components/bodysync/ReadinessScoreCard';
import { PracticeAdjustmentCard } from '@/components/bodysync/PracticeAdjustmentCard';
import { FatigueRiskBanner } from '@/components/bodysync/FatigueRiskBanner';
import { WellnessCheckInForm } from '@/components/bodysync/WellnessCheckInForm';
import { BodySyncInsightFeed } from '@/components/bodysync/BodySyncInsightFeed';
import { HealthConnectionCenter } from '@/components/bodysync/HealthConnectionCenter';
import { AppleHealthImport } from '@/components/bodysync/AppleHealthImport';
import { NonMedicalDisclaimer } from '@/components/bodysync/NonMedicalDisclaimer';

const CATEGORY_ORDER: HealthCategory[] = ['wellness', 'recovery', 'cardio', 'activity', 'mobility'];

export default function BodySyncPage() {
  const bs = useBodySync();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showData, setShowData] = useState(false);

  // ── Consent gate ──
  if (!bs.consented || !bs.enabled) {
    return (
      <div className="p-6">
        <HealthConsentGate
          permissions={bs.state.permissions}
          onSetPermissions={bs.setPermissions}
          onConsent={bs.consent}
        />
      </div>
    );
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(bs.exportBodySync(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swingvantage-bodysync-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HeartPulse size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">BodySync</h1>
          <p className="text-xs text-muted-foreground">Performance Pulse — your daily readiness & recovery</p>
        </div>
      </div>

      {/* Fatigue / injury banner */}
      {bs.assessment && <FatigueRiskBanner risk={bs.assessment.injuryRisk} />}

      {/* Readiness */}
      {bs.assessment ? (
        <ReadinessScoreCard assessment={bs.assessment} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
          <p className="text-sm font-medium text-foreground">Do today&apos;s check-in to see your readiness</p>
          <p className="mt-1 text-xs text-muted-foreground">It takes about 30 seconds.</p>
        </div>
      )}

      {/* Recommendation */}
      {bs.recommendation && <PracticeAdjustmentCard rec={bs.recommendation} />}

      {/* Daily check-in */}
      <WellnessCheckInForm today={bs.today} />

      {/* Insights */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-foreground">Insights</h2>
        <BodySyncInsightFeed insights={bs.insights} />
      </div>

      {/* Connect a device */}
      <AppleHealthImport />
      <HealthConnectionCenter />

      {/* Privacy & data controls */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <button
          onClick={() => setShowData((v) => !v)}
          className="flex w-full items-center gap-2 text-sm font-bold text-foreground"
          aria-expanded={showData}
        >
          <Settings2 size={16} aria-hidden="true" /> Privacy & data
        </button>

        {showData && (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What we may use</p>
              <div className="mt-2 space-y-1.5">
                {CATEGORY_ORDER.map((cat) => (
                  <label key={cat} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{CATEGORY_META[cat].label}</span>
                    <input
                      type="checkbox"
                      checked={bs.state.permissions[cat]}
                      onChange={(e) => bs.setPermissions({ [cat]: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">Share readiness with my coach</span>
              <input
                type="checkbox"
                checked={bs.state.settings.shareReadinessWithCoach}
                onChange={(e) => bs.setSettings({ shareReadinessWithCoach: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button size="sm" variant="outline" onClick={exportData}>
                <Download size={14} /> Export my data
              </Button>
              {!confirmDelete ? (
                <Button size="sm" variant="outline" className="text-error border-error/40 hover:bg-error/10" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Delete all health data
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    className="bg-error text-error-foreground hover:bg-error/90"
                    onClick={() => { bs.clearAllHealthData(); setConfirmDelete(false); }}
                  >
                    <Check size={14} /> Erase everything
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deleting erases your check-ins, baselines, connections and consent from this device and your account.
            </p>
          </div>
        )}
      </div>

      <NonMedicalDisclaimer />
    </div>
  );
}
