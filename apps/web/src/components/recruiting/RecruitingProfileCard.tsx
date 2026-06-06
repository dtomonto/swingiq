'use client';

// ============================================================
// Recruiting — RecruitingProfileCard
// ------------------------------------------------------------
// Compact identity + at-a-glance stats card for the hub overview.
// ============================================================

import Link from 'next/link';
import { Film, BarChart3, Link2, UserCog } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  useRecruitingStore,
  isLinkActive,
  PLAYER_TYPE_LABEL,
  type PlayerType,
} from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';

export function RecruitingProfileCard() {
  const profile = useRecruitingStore((s) => s.profile);
  const film = useRecruitingStore((s) => s.film.filter((f) => !f.deletedAt));
  const metrics = useRecruitingStore((s) => s.metrics);
  const links = useRecruitingStore((s) => s.shareLinks);

  if (!profile) {
    return (
      <Card>
        <CardBody className="text-center py-6">
          <UserCog size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold text-foreground">Start your recruiting profile</p>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Build a verified, shareable profile coaches can evaluate in 90 seconds.</p>
          <Link href="/recruiting/onboarding"><Button>Get started</Button></Link>
        </CardBody>
      </Card>
    );
  }

  const sport = profile.primarySport;
  const meta = SPORT_META[sport];
  const sp = profile.sportProfiles[sport];
  const activeLinks = links.filter((l) => isLinkActive(l)).length;

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{meta.emoji} {meta.name}</p>
            <h2 className="text-xl font-bold text-foreground">{profile.athleteName || 'Unnamed athlete'}</h2>
            <p className="text-sm text-muted-foreground">
              {[profile.graduationYear ? `Class of ${profile.graduationYear}` : '', sp?.position, PLAYER_TYPE_LABEL[profile.playerType as PlayerType]].filter(Boolean).join(' · ')}
            </p>
          </div>
          <Badge variant={profile.visibility === 'private' ? 'default' : 'info'}>{profile.visibility === 'private' ? 'Private' : profile.visibility === 'public' ? 'Public' : 'Link-only'}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2"><Film size={15} className="mx-auto text-muted-foreground" /><p className="text-lg font-bold text-foreground">{film.length}</p><p className="text-xs text-muted-foreground">Film</p></div>
          <div className="rounded-lg bg-muted/50 p-2"><BarChart3 size={15} className="mx-auto text-muted-foreground" /><p className="text-lg font-bold text-foreground">{metrics.length}</p><p className="text-xs text-muted-foreground">Metrics</p></div>
          <div className="rounded-lg bg-muted/50 p-2"><Link2 size={15} className="mx-auto text-muted-foreground" /><p className="text-lg font-bold text-foreground">{activeLinks}</p><p className="text-xs text-muted-foreground">Active links</p></div>
        </div>

        <Link href="/recruiting/profile-builder"><Button variant="outline" size="sm" className="w-full"><UserCog size={14} /> Edit profile</Button></Link>
      </CardBody>
    </Card>
  );
}
