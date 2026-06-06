'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SportId } from '@swingiq/core';
import { Check, ArrowRight, Film, BarChart3, Sparkles, Link2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRecruitingStore, PLAYER_TYPE_LABEL, type PlayerType } from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';

const SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_fast', 'softball_slow'];
const inputCls = 'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useRecruitingStore((s) => s.profile);
  const saveProfile = useRecruitingStore((s) => s.saveProfile);
  const setOnboarded = useRecruitingStore((s) => s.setOnboarded);

  const [step, setStep] = useState(0);
  const [sport, setSport] = useState<SportId>(profile?.primarySport ?? 'golf');
  const [name, setName] = useState(profile?.athleteName ?? '');
  const [playerType, setPlayerType] = useState<PlayerType>(profile?.playerType ?? 'high_school');
  const [gradYear, setGradYear] = useState(profile?.graduationYear?.toString() ?? '');
  const [dob, setDob] = useState(profile?.dateOfBirth ?? '');

  function finishBasics() {
    saveProfile({
      athleteName: name.trim(),
      primarySport: sport,
      playerType,
      graduationYear: gradYear ? Number(gradYear) : null,
      dateOfBirth: dob || null,
    });
    setStep(2);
    setOnboarded(true);
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        {['Sport', 'You', 'Build'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={cn('flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold',
              i < step ? 'bg-success text-success-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {i < step ? <Check size={14} /> : i + 1}
            </span>
            <span className={cn('text-sm', i === step ? 'text-foreground font-medium' : 'text-muted-foreground')}>{label}</span>
            {i < 2 && <span className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Choose your sport</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {SPORTS.map((s) => (
                <button key={s} onClick={() => setSport(s)} className={cn('rounded-xl border p-4 text-left transition-colors',
                  sport === s ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}>
                  <span className="text-2xl">{SPORT_META[s].emoji}</span>
                  <p className="font-medium text-foreground mt-1">{SPORT_META[s].name}</p>
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={() => setStep(1)}>Continue <ArrowRight size={15} /></Button>
          </CardBody>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Tell us about you</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <label className="block"><span className="text-sm font-medium text-foreground">Athlete name</span><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></label>
            <label className="block"><span className="text-sm font-medium text-foreground">Player type</span>
              <select className={inputCls} value={playerType} onChange={(e) => setPlayerType(e.target.value as PlayerType)}>
                {Object.entries(PLAYER_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className="text-sm font-medium text-foreground">Graduation year</span><input type="number" className={inputCls} value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2027" /></label>
              <label className="block"><span className="text-sm font-medium text-foreground">Date of birth</span><input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} /></label>
            </div>
            <p className="text-xs text-muted-foreground">Date of birth enables guardian protections for minors. It&apos;s never shown publicly.</p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
              <Button className="flex-1" onClick={finishBasics} disabled={!name.trim()}>Create profile <ArrowRight size={15} /></Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>You&apos;re set — now build it out</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-muted-foreground">Your private profile is created. Add evidence in any order — the strongest profiles have game film + verified data.</p>
            {[
              { href: '/recruiting/film-library', label: 'Upload your first film', icon: Film },
              { href: '/recruiting/data-dashboard', label: 'Add performance data', icon: BarChart3 },
              { href: '/recruiting/profile-builder', label: 'Finish your profile details', icon: Sparkles },
              { href: '/recruiting/packet-generator', label: 'Create a share link', icon: Link2 },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary hover:bg-muted/50 transition-colors">
                <Icon size={18} className="text-primary" /><span className="text-sm font-medium text-foreground flex-1">{label}</span><ArrowRight size={15} className="text-muted-foreground" />
              </Link>
            ))}
            <Button className="w-full" onClick={() => router.push('/recruiting')}>Go to my hub</Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
