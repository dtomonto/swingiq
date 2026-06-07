'use client';

// ============================================================
// SwingVantage — Sport-Specific Profile Forms
// Each non-golf sport has its own profile form.
// Golf uses the existing ProfileForm.tsx.
// ============================================================

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSwingVantageStore } from '@/store';
import type { SportId } from '@swingiq/core';

const inputClass =
  'w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden';
const selectClass = `${inputClass} bg-card`;

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

// ── Tennis Profile Form ───────────────────────────────────────

export function TennisProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.tennis ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    dominant_hand: existing.dominant_hand ?? 'right',
    backhand_style: existing.backhand_style ?? 'two_handed',
    playing_level: existing.playing_level ?? 'recreational',
    primary_strokes: existing.primary_strokes ?? '',
    common_miss: existing.common_miss ?? '',
    racquet_brand: existing.racquet_brand ?? '',
    racquet_model: existing.racquet_model ?? '',
    string_setup: existing.string_setup ?? '',
    court_surface: existing.court_surface ?? 'hard',
    practice_frequency: existing.practice_frequency ?? '2-3x/week',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setSportProfile('tennis', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Player Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Dominant Hand">
            <select value={form.dominant_hand} onChange={(e) => set('dominant_hand', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
            </select>
          </FormField>
          <FormField label="Backhand Style">
            <select value={form.backhand_style} onChange={(e) => set('backhand_style', e.target.value)} className={selectClass}>
              <option value="two_handed">Two-Handed Backhand</option>
              <option value="one_handed">One-Handed Backhand</option>
            </select>
          </FormField>
          <FormField label="Playing Level">
            <select value={form.playing_level} onChange={(e) => set('playing_level', e.target.value)} className={selectClass}>
              <option value="recreational">Recreational</option>
              <option value="club">Club / League</option>
              <option value="competitive">Competitive</option>
              <option value="tournament">Tournament</option>
              <option value="professional">Professional</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Practice Frequency">
            <select value={form.practice_frequency} onChange={(e) => set('practice_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
          <FormField label="Preferred Court Surface">
            <select value={form.court_surface} onChange={(e) => set('court_surface', e.target.value)} className={selectClass}>
              <option value="hard">Hard Court</option>
              <option value="clay">Clay</option>
              <option value="grass">Grass</option>
              <option value="indoor_hard">Indoor Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Game Profile</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Primary Goal" hint="What is the #1 thing you want to improve?">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="Improve my forehand consistency" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Primary Strokes" hint="Your strongest strokes.">
              <input value={form.primary_strokes} onChange={(e) => set('primary_strokes', e.target.value)} className={inputClass} placeholder="Forehand, serve" />
            </FormField>
            <FormField label="Common Miss" hint="Your typical error.">
              <input value={form.common_miss} onChange={(e) => set('common_miss', e.target.value)} className={inputClass} placeholder="Long on forehand, short on serve" />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Racquet Setup</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Racquet Brand">
            <input value={form.racquet_brand} onChange={(e) => set('racquet_brand', e.target.value)} className={inputClass} placeholder="Wilson, Babolat, Head…" />
          </FormField>
          <FormField label="Racquet Model">
            <input value={form.racquet_model} onChange={(e) => set('racquet_model', e.target.value)} className={inputClass} placeholder="Pro Staff 97, Pure Aero…" />
          </FormField>
          <FormField label="String Setup" hint="String type and tension (optional).">
            <input value={form.string_setup} onChange={(e) => set('string_setup', e.target.value)} className={inputClass} placeholder="RPM Blast 16, 55 lbs" />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First (show me the analysis)</option>
              <option value="feel_first">Feel-First (keep it simple)</option>
              <option value="balanced">Balanced (mix of both)</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional. Helps tailor drill recommendations.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="e.g. Right shoulder — avoid overhead drills" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Tennis Profile</Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
            <CheckCircle size={16} /> Profile saved!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Baseball Profile Form ─────────────────────────────────────

export function BaseballProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.baseball ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    batting_side: existing.batting_side ?? 'right',
    throwing_hand: existing.throwing_hand ?? 'right',
    position: existing.position ?? '',
    competition_level: existing.competition_level ?? 'adult_rec',
    bat_brand: existing.bat_brand ?? '',
    bat_model: existing.bat_model ?? '',
    common_hitting_result: existing.common_hitting_result ?? '',
    common_miss: existing.common_miss ?? '',
    timing_tendency: existing.timing_tendency ?? 'inconsistent',
    training_frequency: existing.training_frequency ?? 'weekly',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setSportProfile('baseball', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Hitter Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Batting Side">
            <select value={form.batting_side} onChange={(e) => set('batting_side', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
              <option value="switch">Switch Hitter</option>
            </select>
          </FormField>
          <FormField label="Throwing Hand">
            <select value={form.throwing_hand} onChange={(e) => set('throwing_hand', e.target.value)} className={selectClass}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </FormField>
          <FormField label="Position">
            <input value={form.position} onChange={(e) => set('position', e.target.value)} className={inputClass} placeholder="Outfield, shortstop, DH…" />
          </FormField>
          <FormField label="Competition Level">
            <select value={form.competition_level} onChange={(e) => set('competition_level', e.target.value)} className={selectClass}>
              <option value="youth">Youth (8–14)</option>
              <option value="high_school">High School</option>
              <option value="college">College</option>
              <option value="adult_rec">Adult Recreational</option>
              <option value="semi_pro">Semi-Pro</option>
              <option value="professional">Professional</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Training Frequency">
            <select value={form.training_frequency} onChange={(e) => set('training_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hitting Profile</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Primary Goal" hint="What is the #1 thing you want to improve at the plate?">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="Hit for more power, improve contact rate…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Common Hitting Result" hint="What do you typically do when things go wrong?">
              <input value={form.common_hitting_result} onChange={(e) => set('common_hitting_result', e.target.value)} className={inputClass} placeholder="Weak grounders to second, pop ups…" />
            </FormField>
            <FormField label="Common Miss" hint="Your typical bad swing.">
              <input value={form.common_miss} onChange={(e) => set('common_miss', e.target.value)} className={inputClass} placeholder="Casting, rolling over…" />
            </FormField>
            <FormField label="Timing Tendency">
              <select value={form.timing_tendency} onChange={(e) => set('timing_tendency', e.target.value)} className={selectClass}>
                <option value="early">Early (out front)</option>
                <option value="on_time">On Time</option>
                <option value="late">Late (jammed/weak)</option>
                <option value="inconsistent">Inconsistent</option>
              </select>
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bat Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Bat Brand">
            <input value={form.bat_brand} onChange={(e) => set('bat_brand', e.target.value)} className={inputClass} placeholder="Louisville Slugger, Marucci…" />
          </FormField>
          <FormField label="Bat Model">
            <input value={form.bat_model} onChange={(e) => set('bat_model', e.target.value)} className={inputClass} placeholder="Meta, Select PWR…" />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First</option>
              <option value="feel_first">Feel-First</option>
              <option value="balanced">Balanced</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="e.g. Right elbow — avoid heavy tee work" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Baseball Profile</Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
            <CheckCircle size={16} /> Profile saved!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Slow Pitch Softball Profile Form ─────────────────────────

export function SlowPitchProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.softball_slow ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    batting_side: existing.batting_side ?? 'right',
    throwing_hand: existing.throwing_hand ?? 'right',
    position: existing.position ?? '',
    league_type: existing.league_type ?? 'recreational',
    bat_brand: existing.bat_brand ?? '',
    bat_model: existing.bat_model ?? '',
    bat_certification: existing.bat_certification ?? '',
    typical_hitting_result: existing.typical_hitting_result ?? '',
    desired_hitting_style: existing.desired_hitting_style ?? 'mixed',
    common_miss: existing.common_miss ?? '',
    timing_tendency: existing.timing_tendency ?? 'inconsistent',
    training_frequency: existing.training_frequency ?? 'weekly',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setSportProfile('softball_slow', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Player Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Batting Side">
            <select value={form.batting_side} onChange={(e) => set('batting_side', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
              <option value="switch">Switch Hitter</option>
            </select>
          </FormField>
          <FormField label="Throwing Hand">
            <select value={form.throwing_hand} onChange={(e) => set('throwing_hand', e.target.value)} className={selectClass}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </FormField>
          <FormField label="Position">
            <input value={form.position} onChange={(e) => set('position', e.target.value)} className={inputClass} placeholder="Outfield, pitcher, shortstop…" />
          </FormField>
          <FormField label="League Type">
            <select value={form.league_type} onChange={(e) => set('league_type', e.target.value)} className={selectClass}>
              <option value="recreational">Recreational</option>
              <option value="church">Church League</option>
              <option value="corporate">Corporate League</option>
              <option value="competitive">Competitive</option>
              <option value="tournament">Tournament</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Training Frequency">
            <select value={form.training_frequency} onChange={(e) => set('training_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hitting Profile</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Primary Goal">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="Hit for more power, improve line drives…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Desired Hitting Style">
              <select value={form.desired_hitting_style} onChange={(e) => set('desired_hitting_style', e.target.value)} className={selectClass}>
                <option value="power">Power (home run threat)</option>
                <option value="contact">Contact (put it in play)</option>
                <option value="gap_to_gap">Gap-to-Gap</option>
                <option value="mixed">Mixed</option>
              </select>
            </FormField>
            <FormField label="Common Miss">
              <input value={form.common_miss} onChange={(e) => set('common_miss', e.target.value)} className={inputClass} placeholder="Pop ups, weak grounders…" />
            </FormField>
            <FormField label="Timing Tendency">
              <select value={form.timing_tendency} onChange={(e) => set('timing_tendency', e.target.value)} className={selectClass}>
                <option value="early">Early</option>
                <option value="on_time">On Time</option>
                <option value="late">Late</option>
                <option value="inconsistent">Inconsistent</option>
              </select>
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bat Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Bat Brand">
            <input value={form.bat_brand} onChange={(e) => set('bat_brand', e.target.value)} className={inputClass} placeholder="DeMarini, Easton, Louisville…" />
          </FormField>
          <FormField label="Bat Model">
            <input value={form.bat_model} onChange={(e) => set('bat_model', e.target.value)} className={inputClass} placeholder="Juggernaut, Salvo, Monsta…" />
          </FormField>
          <FormField label="Bat Certification" hint="e.g. USSSA, ASA, NSA (optional)">
            <input value={form.bat_certification} onChange={(e) => set('bat_certification', e.target.value)} className={inputClass} placeholder="USSSA, ASA, NSA…" />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First</option>
              <option value="feel_first">Feel-First</option>
              <option value="balanced">Balanced</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Optional injury or mobility notes…" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Slow Pitch Profile</Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
            <CheckCircle size={16} /> Profile saved!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fast Pitch Softball Profile Form ─────────────────────────

export function FastPitchProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.softball_fast ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    batting_side: existing.batting_side ?? 'right',
    throwing_hand: existing.throwing_hand ?? 'right',
    position: existing.position ?? '',
    competition_level: existing.competition_level ?? 'high_school',
    bat_brand: existing.bat_brand ?? '',
    bat_model: existing.bat_model ?? '',
    pitch_speed_range_mph: existing.pitch_speed_range_mph ?? '',
    common_hitting_result: existing.common_hitting_result ?? '',
    timing_tendency: existing.timing_tendency ?? 'inconsistent',
    contact_point_tendency: existing.contact_point_tendency ?? 'inconsistent',
    training_frequency: existing.training_frequency ?? 'weekly',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setSportProfile('softball_fast', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Hitter Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Batting Side">
            <select value={form.batting_side} onChange={(e) => set('batting_side', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
              <option value="switch">Switch Hitter</option>
            </select>
          </FormField>
          <FormField label="Throwing Hand">
            <select value={form.throwing_hand} onChange={(e) => set('throwing_hand', e.target.value)} className={selectClass}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </FormField>
          <FormField label="Position">
            <input value={form.position} onChange={(e) => set('position', e.target.value)} className={inputClass} placeholder="Shortstop, center field, catcher…" />
          </FormField>
          <FormField label="Competition Level">
            <select value={form.competition_level} onChange={(e) => set('competition_level', e.target.value)} className={selectClass}>
              <option value="youth">Youth (8U–12U)</option>
              <option value="high_school">High School (14U–18U / HS)</option>
              <option value="college">College</option>
              <option value="adult_rec">Adult Recreational</option>
              <option value="semi_pro">Semi-Pro</option>
              <option value="professional">Professional</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Training Frequency">
            <select value={form.training_frequency} onChange={(e) => set('training_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hitting Profile</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Primary Goal">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="Improve timing, increase contact rate…" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pitch Speed Range" hint="Typical pitching speeds you face.">
              <input value={form.pitch_speed_range_mph} onChange={(e) => set('pitch_speed_range_mph', e.target.value)} className={inputClass} placeholder="55–65 mph, 60–70 mph…" />
            </FormField>
            <FormField label="Common Hitting Result">
              <input value={form.common_hitting_result} onChange={(e) => set('common_hitting_result', e.target.value)} className={inputClass} placeholder="Weak contact to pull side, pop ups…" />
            </FormField>
            <FormField label="Timing Tendency">
              <select value={form.timing_tendency} onChange={(e) => set('timing_tendency', e.target.value)} className={selectClass}>
                <option value="early">Early</option>
                <option value="on_time">On Time</option>
                <option value="late">Late</option>
                <option value="inconsistent">Inconsistent</option>
              </select>
            </FormField>
            <FormField label="Contact Point Tendency">
              <select value={form.contact_point_tendency} onChange={(e) => set('contact_point_tendency', e.target.value)} className={selectClass}>
                <option value="out_front">Out Front (early)</option>
                <option value="ideal">Ideal Zone</option>
                <option value="too_deep">Too Deep (late/jammed)</option>
                <option value="inconsistent">Inconsistent</option>
              </select>
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bat Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Bat Brand">
            <input value={form.bat_brand} onChange={(e) => set('bat_brand', e.target.value)} className={inputClass} placeholder="DeMarini, Louisville, Easton…" />
          </FormField>
          <FormField label="Bat Model">
            <input value={form.bat_model} onChange={(e) => set('bat_model', e.target.value)} className={inputClass} placeholder="CF Zen, LXT, Ghost…" />
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Coaching Preferences</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First</option>
              <option value="feel_first">Feel-First</option>
              <option value="balanced">Balanced</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Optional injury or mobility notes…" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Fast Pitch Profile</Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-primary text-sm font-medium">
            <CheckCircle size={16} /> Profile saved!
          </div>
        )}
      </div>
    </div>
  );
}

// ── Pickleball Profile Form ───────────────────────────────────

export function PickleballProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.pickleball ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    dominant_hand: existing.dominant_hand ?? 'right',
    paddle_hand: existing.paddle_hand ?? 'right',
    dupr_rating: existing.dupr_rating ?? '',
    self_rating: existing.self_rating ?? '',
    format_preference: existing.format_preference ?? 'doubles',
    doubles_court_side: existing.doubles_court_side ?? 'flexible',
    preferred_style: existing.preferred_style ?? 'all_court',
    common_miss: existing.common_miss ?? 'other',
    paddle_brand: existing.paddle_brand ?? '',
    paddle_model: existing.paddle_model ?? '',
    play_frequency: existing.play_frequency ?? '2-3x/week',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const handleSave = () => {
    setSportProfile('pickleball', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Player Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Dominant Hand">
            <select value={form.dominant_hand} onChange={(e) => set('dominant_hand', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
            </select>
          </FormField>
          <FormField label="Paddle Hand">
            <select value={form.paddle_hand} onChange={(e) => set('paddle_hand', e.target.value)} className={selectClass}>
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="two_handed_backhand">Two-Handed Backhand</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Self-Rating" hint="Optional (2.0–5.0+ ladder).">
            <select value={form.self_rating} onChange={(e) => set('self_rating', e.target.value)} className={selectClass}>
              <option value="">Prefer not to say</option>
              <option value="2.0">2.0</option>
              <option value="2.5">2.5</option>
              <option value="3.0">3.0</option>
              <option value="3.5">3.5</option>
              <option value="4.0">4.0</option>
              <option value="4.5">4.5</option>
              <option value="5.0+">5.0+</option>
            </select>
          </FormField>
          <FormField label="DUPR Rating" hint="Optional (1.0–8.0).">
            <input value={form.dupr_rating} onChange={(e) => set('dupr_rating', e.target.value)} className={inputClass} placeholder="e.g. 3.75" inputMode="decimal" />
          </FormField>
          <FormField label="Format Preference">
            <select value={form.format_preference} onChange={(e) => set('format_preference', e.target.value)} className={selectClass}>
              <option value="doubles">Doubles</option>
              <option value="singles">Singles</option>
              <option value="both">Both</option>
            </select>
          </FormField>
          <FormField label="Doubles Court Side">
            <select value={form.doubles_court_side} onChange={(e) => set('doubles_court_side', e.target.value)} className={selectClass}>
              <option value="flexible">Flexible</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </FormField>
          <FormField label="Play Frequency">
            <select value={form.play_frequency} onChange={(e) => set('play_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Style & Goals</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Preferred Style">
            <select value={form.preferred_style} onChange={(e) => set('preferred_style', e.target.value)} className={selectClass}>
              <option value="all_court">All-Court</option>
              <option value="control">Control</option>
              <option value="power">Power</option>
              <option value="counterpuncher">Counterpuncher</option>
              <option value="dinker_reset">Dinker / Reset Specialist</option>
              <option value="aggressive_net">Aggressive Net Player</option>
            </select>
          </FormField>
          <FormField label="Most Common Miss">
            <select value={form.common_miss} onChange={(e) => set('common_miss', e.target.value)} className={selectClass}>
              <option value="popping_up_dinks">Popping up dinks</option>
              <option value="netting_third_drops">Netting third-shot drops</option>
              <option value="driving_long">Driving long</option>
              <option value="missing_returns">Missing returns</option>
              <option value="late_volleys">Late volleys</option>
              <option value="poor_resets">Poor resets</option>
              <option value="speed_up_errors">Speed-up errors</option>
              <option value="kitchen_foot_faults">Foot faults near the kitchen</option>
              <option value="other">Other / Not sure</option>
            </select>
          </FormField>
          <FormField label="Paddle Brand"><input value={form.paddle_brand} onChange={(e) => set('paddle_brand', e.target.value)} className={inputClass} placeholder="e.g. Selkirk" /></FormField>
          <FormField label="Paddle Model"><input value={form.paddle_model} onChange={(e) => set('paddle_model', e.target.value)} className={inputClass} placeholder="e.g. Vanguard Power Air" /></FormField>
          <FormField label="Primary Goal" hint="What do you most want to improve?">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="e.g. Reliable third-shot drop" />
          </FormField>
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First</option>
              <option value="feel_first">Feel-First</option>
              <option value="balanced">Balanced</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Optional injury or mobility notes…" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Pickleball Profile</Button>
        {saved && (<div className="flex items-center gap-1.5 text-primary text-sm font-medium"><CheckCircle size={16} /> Profile saved!</div>)}
      </div>
    </div>
  );
}

// ── Padel Profile Form ────────────────────────────────────────

export function PadelProfileForm() {
  const { sportProfiles, setSportProfile } = useSwingVantageStore();
  const existing = (sportProfiles?.padel ?? {}) as Record<string, string>;
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    dominant_hand: existing.dominant_hand ?? 'right',
    racket_hand: existing.racket_hand ?? 'right',
    club_rating: existing.club_rating ?? '',
    playing_level: existing.playing_level ?? 'intermediate',
    court_side: existing.court_side ?? 'flexible',
    preferred_style: existing.preferred_style ?? 'all_court',
    common_miss: existing.common_miss ?? 'other',
    racket_brand: existing.racket_brand ?? '',
    racket_model: existing.racket_model ?? '',
    play_frequency: existing.play_frequency ?? '2-3x/week',
    primary_goal: existing.primary_goal ?? '',
    skill_level: existing.skill_level ?? 'intermediate',
    injury_notes: existing.injury_notes ?? '',
    coaching_style: existing.coaching_style ?? 'balanced',
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const handleSave = () => {
    setSportProfile('padel', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Player Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Dominant Hand">
            <select value={form.dominant_hand} onChange={(e) => set('dominant_hand', e.target.value)} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
            </select>
          </FormField>
          <FormField label="Racket Hand">
            <select value={form.racket_hand} onChange={(e) => set('racket_hand', e.target.value)} className={selectClass}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </FormField>
          <FormField label="Playing Level">
            <select value={form.playing_level} onChange={(e) => set('playing_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="competitive">Competitive</option>
            </select>
          </FormField>
          <FormField label="Skill Level">
            <select value={form.skill_level} onChange={(e) => set('skill_level', e.target.value)} className={selectClass}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
            </select>
          </FormField>
          <FormField label="Court Side">
            <select value={form.court_side} onChange={(e) => set('court_side', e.target.value)} className={selectClass}>
              <option value="flexible">Flexible</option>
              <option value="right_deuce">Right (Deuce)</option>
              <option value="left_advantage">Left (Advantage)</option>
            </select>
          </FormField>
          <FormField label="Club / League Rating" hint="Optional (scales vary by country).">
            <input value={form.club_rating} onChange={(e) => set('club_rating', e.target.value)} className={inputClass} placeholder="e.g. 3rd category" />
          </FormField>
          <FormField label="Play Frequency">
            <select value={form.play_frequency} onChange={(e) => set('play_frequency', e.target.value)} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Style & Goals</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Preferred Style">
            <select value={form.preferred_style} onChange={(e) => set('preferred_style', e.target.value)} className={selectClass}>
              <option value="all_court">All-Court</option>
              <option value="defensive_wall">Defensive Wall Player</option>
              <option value="net_attacker">Net Attacker</option>
              <option value="lob_strategist">Lob-Heavy Strategist</option>
              <option value="power_smasher">Power Smasher</option>
              <option value="bandeja_specialist">Bandeja Specialist</option>
            </select>
          </FormField>
          <FormField label="Most Common Miss">
            <select value={form.common_miss} onChange={(e) => set('common_miss', e.target.value)} className={selectClass}>
              <option value="poor_wall_read">Poor wall read</option>
              <option value="late_after_glass">Late contact after the glass</option>
              <option value="weak_bandeja">Weak bandeja</option>
              <option value="overhitting_smashes">Overhitting smashes</option>
              <option value="poor_lob_depth">Poor lob depth</option>
              <option value="volley_errors">Volley errors</option>
              <option value="poor_net_transition">Poor transition to net</option>
              <option value="bad_court_position">Bad court positioning</option>
              <option value="partner_spacing">Partner-spacing issues</option>
              <option value="other">Other / Not sure</option>
            </select>
          </FormField>
          <FormField label="Racket Brand"><input value={form.racket_brand} onChange={(e) => set('racket_brand', e.target.value)} className={inputClass} placeholder="e.g. Bullpadel" /></FormField>
          <FormField label="Racket Model"><input value={form.racket_model} onChange={(e) => set('racket_model', e.target.value)} className={inputClass} placeholder="e.g. Vertex 04" /></FormField>
          <FormField label="Primary Goal" hint="What do you most want to improve?">
            <input value={form.primary_goal} onChange={(e) => set('primary_goal', e.target.value)} className={inputClass} placeholder="e.g. A reliable bandeja" />
          </FormField>
          <FormField label="Coaching Style">
            <select value={form.coaching_style} onChange={(e) => set('coaching_style', e.target.value)} className={selectClass}>
              <option value="data_first">Data-First</option>
              <option value="feel_first">Feel-First</option>
              <option value="balanced">Balanced</option>
            </select>
          </FormField>
          <FormField label="Physical Limitations" hint="Optional.">
            <textarea value={form.injury_notes} onChange={(e) => set('injury_notes', e.target.value)} className={`${inputClass} resize-none`} rows={2} placeholder="Optional injury or mobility notes…" />
          </FormField>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} size="lg">Save Padel Profile</Button>
        {saved && (<div className="flex items-center gap-1.5 text-primary text-sm font-medium"><CheckCircle size={16} /> Profile saved!</div>)}
      </div>
    </div>
  );
}

// ── Sport Profile Form Router ─────────────────────────────────

interface SportProfileFormRouterProps {
  sport: SportId;
}

export function SportProfileFormRouter({ sport }: SportProfileFormRouterProps) {
  switch (sport) {
    case 'tennis': return <TennisProfileForm />;
    case 'pickleball': return <PickleballProfileForm />;
    case 'padel': return <PadelProfileForm />;
    case 'baseball': return <BaseballProfileForm />;
    case 'softball_slow': return <SlowPitchProfileForm />;
    case 'softball_fast': return <FastPitchProfileForm />;
    default: return null;
  }
}
