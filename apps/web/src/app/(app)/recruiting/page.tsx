'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Film, BarChart3, Clapperboard, Mail, FileDown, LineChart, Sparkles, ShieldCheck, Trophy } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import {
  useRecruitingStore,
  computeProfileStrength,
} from '@/lib/recruiting';
import {
  RecruitingProfileCard,
  ProfileStrengthMeter,
  AIPlayerSummaryPanel,
  ImportFromPlatform,
} from '@/components/recruiting';

const QUICK = [
  { href: '/recruiting/recommendations', label: 'Find your fit', icon: Trophy },
  { href: '/recruiting/film-library', label: 'Film library', icon: Film },
  { href: '/recruiting/data-dashboard', label: 'Data dashboard', icon: BarChart3 },
  { href: '/recruiting/highlight-builder', label: 'Highlight reels', icon: Clapperboard },
  { href: '/recruiting/packet-generator', label: 'Recruiting packet', icon: FileDown },
  { href: '/recruiting/outreach', label: 'Outreach', icon: Mail },
  { href: '/recruiting/analytics', label: 'Analytics', icon: LineChart },
];

export default function RecruitingOverviewPage() {
  const state = useRecruitingStore();
  const strength = useMemo(() => computeProfileStrength(state), [state]);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <RecruitingProfileCard />
        <ProfileStrengthMeter strength={strength} />
      </div>

      {!state.profile && (
        <Card>
          <CardBody className="space-y-2">
            <p className="flex items-center gap-2 font-semibold text-foreground"><Sparkles size={16} className="text-primary" /> What makes this different</p>
            <p className="text-sm text-muted-foreground">
              A recruiting profile coaches actually trust: every number and claim is labeled by source (verified vs self-reported),
              the AI describes evidence instead of projecting a ceiling, and you control exactly what each coach can see.
            </p>
          </CardBody>
        </Card>
      )}

      <ImportFromPlatform compact />

      {state.profile && (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Jump in</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {QUICK.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-muted/50 transition-colors">
                  <Icon size={20} className="text-primary mb-2" aria-hidden="true" />
                  <p className="font-medium text-foreground text-sm">{label}</p>
                </Link>
              ))}
            </div>
          </section>

          <AIPlayerSummaryPanel />

          <Card>
            <CardBody className="flex items-start gap-2 text-sm">
              <ShieldCheck size={16} className="text-success mt-0.5 shrink-0" />
              <span className="text-muted-foreground">
                Your profile is private by default and your data lives on this device (and syncs to your account when connected).
                Coaches only see what a specific share link allows, and you can revoke any link instantly in{' '}
                <Link href="/recruiting/settings" className="text-primary hover:underline">Privacy</Link>.
              </span>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
