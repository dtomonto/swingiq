'use client';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingVantageStore } from '@/store';
import { useState } from 'react';
import { CheckCircle, Trash2, HardDrive, HelpCircle, Database } from 'lucide-react';
import Link from 'next/link';
import { useTutorial } from '@/hooks/useTutorial';
import { useSport } from '@/contexts/SportContext';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { CoachingToneSelector } from '@/components/settings/CoachingToneSelector';
import { AccountSyncCard } from '@/components/sync/AccountSyncCard';
import { PrivacyControls } from '@/components/founding/PrivacyControls';
import { GuardianConsentPanel } from '@/components/guardian-consent/GuardianConsentPanel';

export default function SettingsPage() {
  const { settings, updateSettings, reset } = useSwingVantageStore();
  const { activeSport } = useSport();
  const { resetAll: resetTutorials, tutorialProgress } = useTutorial();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [tutorialsReset, setTutorialsReset] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetTutorials = () => {
    resetTutorials();
    setTutorialsReset(true);
    setTimeout(() => setTutorialsReset(false), 2500);
  };


  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Customize how SwingVantage works for you.</p>
        </div>

        {/* Account & cloud sync */}
        <AccountSyncCard />

        {/* Privacy, personalization & your data (CentralIntelligenceOS) */}
        <PrivacyControls />

        {/* Display */}
        <Card>
          <CardHeader><CardTitle>Display &amp; Units</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label htmlFor="settings-units" className="text-sm font-medium text-foreground block mb-1">Distance Units</label>
              <select
                id="settings-units"
                value={settings.units}
                onChange={(e) => updateSettings({ units: e.target.value as 'yards' | 'meters' })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden bg-card text-foreground"
              >
                <option value="yards">Yards (US / UK)</option>
                <option value="meters">Meters</option>
              </select>
            </div>
            <ThemeSelector activeSport={activeSport} />
          </CardBody>
        </Card>

        {/* Coaching */}
        <Card>
          <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <CoachingToneSelector />
            <div>
              <label htmlFor="settings-coaching-style" className="text-sm font-medium text-foreground block mb-1">Coaching Style</label>
              <select
                id="settings-coaching-style"
                value={settings.coaching_style}
                onChange={(e) => updateSettings({ coaching_style: e.target.value as 'detailed' | 'concise' | 'encouragement' | 'balanced' })}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden bg-card text-foreground"
              >
                <option value="detailed">Detailed — I want all the information</option>
                <option value="concise">Concise — Keep it short and actionable</option>
                <option value="balanced">Balanced — Mix of data and encouragement</option>
                <option value="encouragement">Encouragement-focused — Build my confidence</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Show &quot;Estimated&quot; Warnings</p>
                <p className="text-xs text-muted-foreground">Show disclaimers when data is heuristically estimated</p>
              </div>
              <button
                onClick={() => updateSettings({ show_estimated_warnings: !settings.show_estimated_warnings })}
                className={`w-11 h-6 rounded-full transition-colors ${settings.show_estimated_warnings ? 'bg-success' : 'bg-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform ${settings.show_estimated_warnings ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Allow cross-sport recommendations</p>
                <p className="text-xs text-muted-foreground">
                  Off by default — Athlete GI stays focused on your active sport. Turn on to let it
                  point out skills that carry over between your sports.
                </p>
              </div>
              <button
                onClick={() => updateSettings({ allow_cross_sport: !settings.allow_cross_sport })}
                role="switch"
                aria-checked={!!settings.allow_cross_sport}
                aria-label="Allow cross-sport recommendations"
                className={`w-11 h-6 rounded-full transition-colors ${settings.allow_cross_sport ? 'bg-success' : 'bg-muted'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform ${settings.allow_cross_sport ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </CardBody>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Data Center</p>
                <p className="text-xs text-muted-foreground">Export, import, and restore your full SwingVantage data</p>
              </div>
              <Link href="/data">
                <Button variant="outline" size="sm">
                  <Database size={14} /> Open
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-foreground">Backup &amp; Restore</p>
                <p className="text-xs text-muted-foreground">Full backup including all sports, profiles, sessions, badges, and analyses</p>
              </div>
              <Link href="/settings/backup">
                <Button variant="outline" size="sm">
                  <HardDrive size={14} /> Backup
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-foreground">In-App Guides</p>
                <p className="text-xs text-muted-foreground">
                  {tutorialProgress.completed.length} guide{tutorialProgress.completed.length !== 1 ? 's' : ''} completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                {tutorialsReset && (
                  <span className="text-xs text-success font-medium">Reset!</span>
                )}
                <Button variant="outline" size="sm" onClick={handleResetTutorials}>
                  <HelpCircle size={14} /> Reset Guides
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-error">Reset All Data</p>
                <p className="text-xs text-muted-foreground">Permanently delete your profile, clubs, and all sessions</p>
              </div>
              {!confirmReset ? (
                <Button variant="outline" size="sm" className="text-error border-error/40 hover:bg-error/10" onClick={() => setConfirmReset(true)}>
                  <Trash2 size={14} /> Reset
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
                  <Button size="sm" className="bg-error text-error-foreground hover:bg-error/90" onClick={() => { reset(); setConfirmReset(false); }}>
                    Yes, Delete Everything
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Usage Category */}
        <Card>
          <CardHeader><CardTitle>Usage Category</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-muted-foreground">
              This setting controls youth safety messaging. Saved with your private settings.
            </p>
            <select
              value={settings.usage_category ?? ''}
              onChange={(e) => updateSettings({ usage_category: (e.target.value || null) as typeof settings.usage_category })}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring outline-hidden bg-card text-foreground"
            >
              <option value="">Not set</option>
              <option value="adult">Adult athlete (18+)</option>
              <option value="parent_guardian">Parent or guardian</option>
              <option value="coach">Coach or instructor</option>
              <option value="minor_13_17">Young athlete (13–17)</option>
            </select>
          </CardBody>
        </Card>

        {/* Youth athlete & guardian consent */}
        <GuardianConsentPanel />

        {/* About */}
        <Card>
          <CardHeader><CardTitle>About SwingVantage</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold">Version:</span> 1.1.0</p>
            <p><span className="font-semibold">Sports:</span> Golf · Tennis · Baseball · Slow-Pitch Softball · Fast-Pitch Softball</p>
            <p><span className="font-semibold">Data storage:</span> Signed in, your data is saved to your private account and synced across your devices. Without an account, it stays in this browser.</p>
            <p className="text-xs text-gray-400 pt-2">
              Swing analysis results are heuristic estimates — not measured from actual video pixels or sensor data. All detections are labeled accordingly.
            </p>
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} size="lg">Save Settings</Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle size={16} /> Saved!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
