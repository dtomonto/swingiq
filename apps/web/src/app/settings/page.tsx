'use client';

import { AppShell } from '@/components/layout/AppShell';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSwingIQStore } from '@/store';
import { useState } from 'react';
import { CheckCircle, Trash2, HardDrive } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { settings, updateSettings, reset } = useSwingIQStore();
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };


  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Customize how SwingIQ works for you.</p>
        </div>

        {/* Display */}
        <Card>
          <CardHeader><CardTitle>Display &amp; Units</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Distance Units</label>
              <select
                value={settings.units}
                onChange={(e) => updateSettings({ units: e.target.value as 'yards' | 'meters' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="yards">Yards (US / UK)</option>
                <option value="meters">Meters</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">App Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => updateSettings({ theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark (coming soon)</option>
                <option value="system">System default</option>
              </select>
            </div>
          </CardBody>
        </Card>

        {/* Coaching */}
        <Card>
          <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Coaching Style</label>
              <select
                value={settings.coaching_style}
                onChange={(e) => updateSettings({ coaching_style: e.target.value as 'detailed' | 'concise' | 'encouragement' | 'balanced' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                <option value="detailed">Detailed — I want all the information</option>
                <option value="concise">Concise — Keep it short and actionable</option>
                <option value="balanced">Balanced — Mix of data and encouragement</option>
                <option value="encouragement">Encouragement-focused — Build my confidence</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Show &quot;Estimated&quot; Warnings</p>
                <p className="text-xs text-gray-500">Show disclaimers when data is heuristically estimated</p>
              </div>
              <button
                onClick={() => updateSettings({ show_estimated_warnings: !settings.show_estimated_warnings })}
                className={`w-11 h-6 rounded-full transition-colors ${settings.show_estimated_warnings ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${settings.show_estimated_warnings ? 'translate-x-5' : 'translate-x-0'}`} />
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
                <p className="text-sm font-medium text-gray-700">Backup &amp; Restore</p>
                <p className="text-xs text-gray-500">Full backup including all sports, profiles, sessions, and analyses</p>
              </div>
              <Link href="/settings/backup">
                <Button variant="outline" size="sm">
                  <HardDrive size={14} /> Backup
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="text-sm font-medium text-red-700">Reset All Data</p>
                <p className="text-xs text-gray-500">Permanently delete your profile, clubs, and all sessions</p>
              </div>
              {!confirmReset ? (
                <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setConfirmReset(true)}>
                  <Trash2 size={14} /> Reset
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => { reset(); setConfirmReset(false); }}>
                    Yes, Delete Everything
                  </Button>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* About */}
        <Card>
          <CardHeader><CardTitle>About SwingIQ</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold">Version:</span> 1.0.0</p>
            <p><span className="font-semibold">Sports:</span> Golf · Tennis · Baseball · Slow-Pitch Softball · Fast-Pitch Softball</p>
            <p><span className="font-semibold">Data storage:</span> All data stored locally in your browser. No account required until Supabase sync is enabled.</p>
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
    </AppShell>
  );
}
