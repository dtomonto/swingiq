'use client';

// ============================================================
// SwingIQ — Non-Golf Session Log
// Manual session entry for tennis, baseball, and softball
// players who don't have launch monitor CSV data.
// ============================================================

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Video } from 'lucide-react';
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SportId } from '@swingiq/core';

const inputClass = 'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const selectClass = `${inputClass} bg-card`;

function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const SPORT_SESSION_LABELS: Record<Exclude<SportId, 'golf'>, {
  session_type_label: string;
  session_types: Array<{ value: string; label: string }>;
  metrics_label: string;
  metrics_hint: string;
  primary_issue_label: string;
  primary_issue_hint: string;
}> = {
  tennis: {
    session_type_label: 'Practice Type',
    session_types: [
      { value: 'groundstrokes', label: 'Groundstroke Practice' },
      { value: 'serve_return', label: 'Serve & Return' },
      { value: 'match_play', label: 'Match Play' },
      { value: 'drills', label: 'Drills & Technique' },
      { value: 'fitness', label: 'Footwork / Fitness' },
      { value: 'video_review', label: 'Video Review Session' },
    ],
    metrics_label: 'Approximate Balls Hit',
    metrics_hint: 'Optional. How many balls did you hit in this session?',
    primary_issue_label: 'Main Focus / Issue Worked On',
    primary_issue_hint: 'What were you working on or what kept going wrong?',
  },
  baseball: {
    session_type_label: 'Session Type',
    session_types: [
      { value: 'tee_work', label: 'Tee Work' },
      { value: 'soft_toss', label: 'Soft Toss' },
      { value: 'cage_bp', label: 'Cage / Batting Practice' },
      { value: 'live_bp', label: 'Live BP / Pitching Machine' },
      { value: 'game', label: 'Game At-Bats' },
      { value: 'film_review', label: 'Film / Video Review' },
    ],
    metrics_label: 'Swings Taken',
    metrics_hint: 'Optional. How many swings did you take?',
    primary_issue_label: 'Main Focus / Issue Worked On',
    primary_issue_hint: 'What were you working on or what issue came up?',
  },
  softball_slow: {
    session_type_label: 'Session Type',
    session_types: [
      { value: 'tee_work', label: 'Tee Work' },
      { value: 'soft_toss', label: 'Soft Toss / Underhand Toss' },
      { value: 'batting_practice', label: 'Batting Practice (Arc)' },
      { value: 'game', label: 'Game At-Bats' },
      { value: 'film_review', label: 'Film / Video Review' },
    ],
    metrics_label: 'Swings Taken',
    metrics_hint: 'Optional. How many swings did you take?',
    primary_issue_label: 'Main Focus / Issue Worked On',
    primary_issue_hint: 'What were you working on or what issue came up?',
  },
  softball_fast: {
    session_type_label: 'Session Type',
    session_types: [
      { value: 'tee_work', label: 'Tee Work' },
      { value: 'soft_toss', label: 'Soft Toss / Front Toss' },
      { value: 'batting_practice', label: 'Live Batting Practice' },
      { value: 'pitching_machine', label: 'Pitching Machine' },
      { value: 'game', label: 'Game At-Bats' },
      { value: 'film_review', label: 'Film / Video Review' },
    ],
    metrics_label: 'Swings Taken',
    metrics_hint: 'Optional. How many swings did you take?',
    primary_issue_label: 'Main Focus / Issue Worked On',
    primary_issue_hint: 'What were you working on or what issue came up?',
  },
};

export default function LogSessionPage() {
  const { activeSport, isGolf, sportEmoji, sportName } = useSport();
  const { addSession, recordPractice } = useSwingIQStore();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    session_type: '',
    duration_minutes: '',
    swings_taken: '',
    primary_issue: '',
    outcome: '',
    notes: '',
    felt_rating: '3',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Redirect golf users to import page
  if (isGolf) {
    return (
      <>
        <div className="p-6 max-w-2xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-4">Golf sessions use CSV import from your launch monitor.</p>
          <Link href="/sessions/import"><Button>Import Launch Monitor Data</Button></Link>
        </div>
      </>
    );
  }

  const sport = activeSport as Exclude<SportId, 'golf'>;
  const labels = SPORT_SESSION_LABELS[sport];

  const handleSave = () => {
    if (!form.name.trim()) return;

    addSession({
      name: form.name || `${sportName} Session`,
      date: new Date().toISOString(),
      sport: activeSport,
      club_name: '',
      club_category: '',
      launch_monitor: 'manual',
      indoor_outdoor: 'outdoor',
      mat_or_grass: 'mat',
      notes: [
        form.session_type && `Type: ${form.session_type}`,
        form.swings_taken && `Swings: ${form.swings_taken}`,
        form.duration_minutes && `Duration: ${form.duration_minutes} min`,
        form.primary_issue && `Focus: ${form.primary_issue}`,
        form.outcome && `Outcome: ${form.outcome}`,
        form.notes && `Notes: ${form.notes}`,
        `Felt: ${form.felt_rating}/5`,
      ].filter(Boolean).join(' · '),
      shot_count: form.swings_taken ? parseInt(form.swings_taken, 10) : 0,
      shots: [],
      diagnoses: [],
      swing_score: null,
    });

    recordPractice();
    setSaved(true);
    setTimeout(() => router.push('/sessions'), 1500);
  };

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/sessions" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-2">
            ← Back to Sessions
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} Log {sportName} Session
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Record what you worked on to track your development over time.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle>Session Details</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <FormField label="Session Name *" hint="Give this session a name so you can find it later.">
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputClass}
                placeholder={`e.g. Tuesday ${sportName} Practice`}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label={labels.session_type_label}>
                <select value={form.session_type} onChange={(e) => set('session_type', e.target.value)} className={selectClass}>
                  <option value="">Select type…</option>
                  {labels.session_types.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Duration (minutes)">
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => set('duration_minutes', e.target.value)}
                  className={inputClass}
                  placeholder="45"
                />
              </FormField>
            </div>
            <FormField label={labels.metrics_label} hint={labels.metrics_hint}>
              <input
                type="number"
                value={form.swings_taken}
                onChange={(e) => set('swings_taken', e.target.value)}
                className={inputClass}
                placeholder="50"
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>What You Worked On</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <FormField label={labels.primary_issue_label} hint={labels.primary_issue_hint}>
              <input
                value={form.primary_issue}
                onChange={(e) => set('primary_issue', e.target.value)}
                className={inputClass}
                placeholder="e.g. Late contact on forehand, casting hands…"
              />
            </FormField>
            <FormField label="Session Outcome" hint="How did it go? What improved?">
              <input
                value={form.outcome}
                onChange={(e) => set('outcome', e.target.value)}
                className={inputClass}
                placeholder="e.g. Contact felt better, still pulling off the ball…"
              />
            </FormField>
            <FormField label="Additional Notes">
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Anything else worth noting about this session…"
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>How Did It Feel?</CardTitle></CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => set('felt_rating', String(n))}
                  className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                    form.felt_rating === String(n)
                      ? 'bg-primary text-white shadow-md scale-110'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
              <p className="text-sm text-muted-foreground ml-2">
                {['', 'Rough', 'Below average', 'Average', 'Good', 'Great'][parseInt(form.felt_rating)] ?? ''}
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Analyze video CTA */}
        <Card className="border-accent-secondary/25 bg-accent-secondary/10">
          <CardBody className="flex items-center gap-3">
            <Video size={18} className="text-accent-secondary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Have video from this session?</p>
              <p className="text-xs text-accent-secondary">Upload it for phase-by-phase analysis and drill recommendations.</p>
            </div>
            <Link href="/video">
              <Button size="sm" className="bg-accent-secondary hover:bg-accent-secondary/90 text-white whitespace-nowrap">
                Analyze Video
              </Button>
            </Link>
          </CardBody>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            size="lg"
            disabled={!form.name.trim() || saved}
          >
            {saved ? '✓ Saved!' : 'Log Session'}
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
              <CheckCircle size={16} /> Session logged! Redirecting…
            </div>
          )}
        </div>
      </div>
    </>
  );
}
