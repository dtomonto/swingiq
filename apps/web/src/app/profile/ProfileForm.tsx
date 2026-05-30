'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GolferProfileSchema, type GolferProfileInput } from '@swingiq/core';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useSwingIQStore } from '@/store';

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';
const selectClass = `${inputClass} bg-white`;

export function ProfileForm() {
  const [saved, setSaved] = useState(false);
  const { profile, setProfile } = useSwingIQStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GolferProfileInput>({
    resolver: zodResolver(GolferProfileSchema),
    defaultValues: profile ?? {
      handedness: 'right',
      home_simulator: false,
      indoor_outdoor: 'outdoor',
      mat_or_grass: 'mat',
      skill_level: 'intermediate',
      coaching_style: 'balanced',
      data_sophistication: 'beginner',
      injury_notes: '',
    },
  });

  const onSubmit = async (data: GolferProfileInput) => {
    setProfile(data);
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Your Name" error={errors.name?.message}>
            <input {...register('name')} className={inputClass} placeholder="Tiger Woods" />
          </FormField>
          <FormField label="Handedness">
            <select {...register('handedness')} className={selectClass}>
              <option value="right">Right-Handed</option>
              <option value="left">Left-Handed</option>
            </select>
          </FormField>
          <FormField label="Handicap" hint="Enter your current official handicap, or your best estimate.">
            <input {...register('handicap', { valueAsNumber: true })} type="number" step="0.1" className={inputClass} placeholder="12.4" />
          </FormField>
          <FormField label="Scoring Average" hint="Your typical 18-hole score.">
            <input {...register('scoring_average', { valueAsNumber: true })} type="number" className={inputClass} placeholder="84" />
          </FormField>
          <FormField label="Low Round" hint="Your personal best 18-hole score.">
            <input {...register('low_round', { valueAsNumber: true })} type="number" className={inputClass} placeholder="76" />
          </FormField>
          <FormField label="Skill Level">
            <select {...register('skill_level')} className={selectClass}>
              <option value="beginner">Beginner (20+ handicap)</option>
              <option value="intermediate">Intermediate (10–19 handicap)</option>
              <option value="advanced">Advanced (1–9 handicap)</option>
              <option value="elite">Elite (scratch or better)</option>
            </select>
          </FormField>
        </CardBody>
      </Card>

      {/* Goals & Tendencies */}
      <Card>
        <CardHeader><CardTitle>Goals and Tendencies</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          <FormField label="Primary Goal" hint="What is the #1 thing you want to improve?">
            <input {...register('primary_goal')} className={inputClass} placeholder="Eliminate my slice with the driver" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Current Miss" hint="Your typical bad shot.">
              <input {...register('current_miss')} className={inputClass} placeholder="Push-fade with driver" />
            </FormField>
            <FormField label="Desired Shot Shape">
              <select {...register('desired_shot_shape')} className={selectClass}>
                <option value="straight">Straight</option>
                <option value="draw">Controlled Draw</option>
                <option value="fade">Controlled Fade</option>
                <option value="push_draw">Push Draw</option>
                <option value="pull_fade">Pull Fade</option>
              </select>
            </FormField>
          </div>
        </CardBody>
      </Card>

      {/* Practice Setup */}
      <Card>
        <CardHeader><CardTitle>Practice Setup</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField label="Practice Frequency">
            <select {...register('practice_frequency')} className={selectClass}>
              <option value="daily">Daily</option>
              <option value="4-6x/week">4–6 times per week</option>
              <option value="2-3x/week">2–3 times per week</option>
              <option value="weekly">Once per week</option>
              <option value="occasional">Occasional</option>
            </select>
          </FormField>
          <FormField label="Practice Environment">
            <select {...register('practice_environment')} className={selectClass}>
              <option value="outdoor_range">Outdoor driving range</option>
              <option value="indoor_simulator">Indoor simulator</option>
              <option value="home_net">Home net/garage</option>
              <option value="mixed">Mixed</option>
            </select>
          </FormField>
          <FormField label="Indoor or Outdoor">
            <select {...register('indoor_outdoor')} className={selectClass}>
              <option value="outdoor">Outdoor</option>
              <option value="indoor">Indoor</option>
            </select>
          </FormField>
          <FormField label="Mat or Grass">
            <select {...register('mat_or_grass')} className={selectClass}>
              <option value="mat">Hitting Mat</option>
              <option value="grass">Grass / Turf</option>
            </select>
          </FormField>
          <FormField label="Launch Monitor Owned">
            <select {...register('launch_monitor_owned')} className={selectClass}>
              <option value="">None / Don&apos;t own one</option>
              <option value="flightscope">FlightScope (Mevo, Mevo+, X3)</option>
              <option value="trackman">TrackMan</option>
              <option value="foresight">Foresight / Bushnell</option>
              <option value="skytrak">SkyTrak</option>
              <option value="uneekor">Uneekor</option>
              <option value="garmin">Garmin R10</option>
              <option value="rapsodo">Rapsodo MLM</option>
              <option value="full_swing">Full Swing KIT</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Ball Used">
            <input {...register('ball_used')} className={inputClass} placeholder="Titleist Pro V1x" />
          </FormField>
        </CardBody>
      </Card>

      {/* Coaching Preferences */}
      <Card>
        <CardHeader><CardTitle>Coaching Style</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-2 gap-4">
          <FormField
            label="Coaching Style Preference"
            hint="How do you prefer to receive feedback?"
          >
            <select {...register('coaching_style')} className={selectClass}>
              <option value="data_first">Data-First (show me the numbers)</option>
              <option value="feel_first">Feel-First (keep it simple)</option>
              <option value="balanced">Balanced (mix of both)</option>
            </select>
          </FormField>
          <FormField
            label="Data Sophistication"
            hint="How comfortable are you with launch monitor terms?"
          >
            <select {...register('data_sophistication')} className={selectClass}>
              <option value="beginner">Beginner (explain everything)</option>
              <option value="intermediate">Intermediate (I know the basics)</option>
              <option value="advanced">Advanced (I understand most metrics)</option>
              <option value="elite">Elite (skip the explanations)</option>
            </select>
          </FormField>
          <FormField
            label="Injury or Physical Limitations"
            hint="Optional. Helps tailor drill recommendations."
            error={errors.injury_notes?.message}
          >
            <textarea
              {...register('injury_notes')}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="e.g. Left knee — avoid deep knee bend drills"
            />
          </FormField>
        </CardBody>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button type="submit" loading={isSubmitting} size="lg">
          Save Profile
        </Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle size={16} />
            Profile saved!
          </div>
        )}
      </div>
    </form>
  );
}
