'use client';

// ============================================================
// Recruiting — ProfileBuilderForm
// ------------------------------------------------------------
// Guided, sectioned profile builder. Writes straight to the local-first
// store so the strength meter updates live. Private-by-default: the
// profile visibility stays private until the athlete shares a link.
// ============================================================

import { useRecruitingStore } from '@/lib/recruiting';
import type { SportId } from '@swingiq/core';
import {
  PLAYER_TYPE_LABEL,
  RECRUITING_STATUS_LABEL,
  type PlayerType,
  type RecruitingStatus,
  type Handedness,
} from '@/lib/recruiting';
import { SPORT_META } from '@/lib/recruiting/sports';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';

const SPORTS: SportId[] = ['golf', 'tennis', 'baseball', 'softball_fast', 'softball_slow'];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {hint && <span className="block text-xs text-muted-foreground mb-1">{hint}</span>}
      <div className={hint ? '' : 'mt-1'}>{children}</div>
    </label>
  );
}

const inputCls =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring';

export function ProfileBuilderForm() {
  const profile = useRecruitingStore((s) => s.profile);
  const saveProfile = useRecruitingStore((s) => s.saveProfile);
  const upsertSportProfile = useRecruitingStore((s) => s.upsertSportProfile);

  const sport = profile?.primarySport ?? 'golf';
  const sp = profile?.sportProfiles[sport];
  const isGolf = sport === 'golf';
  const isTennis = sport === 'tennis';
  const isBat = sport === 'baseball' || sport === 'softball_fast' || sport === 'softball_slow';

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  return (
    <div className="space-y-5">
      {/* Identity */}
      <Card>
        <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Athlete name">
            <input className={inputCls} value={profile?.athleteName ?? ''} onChange={(e) => saveProfile({ athleteName: e.target.value })} placeholder="Full name" />
          </Field>
          <Field label="Primary sport">
            <select className={inputCls} value={sport} onChange={(e) => saveProfile({ primarySport: e.target.value as SportId })}>
              {SPORTS.map((s) => <option key={s} value={s}>{SPORT_META[s].emoji} {SPORT_META[s].name}</option>)}
            </select>
          </Field>
          <Field label="Player type">
            <select className={inputCls} value={profile?.playerType ?? 'high_school'} onChange={(e) => saveProfile({ playerType: e.target.value as PlayerType })}>
              {Object.entries(PLAYER_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Graduation year / class">
            <input type="number" className={inputCls} value={profile?.graduationYear ?? ''} onChange={(e) => saveProfile({ graduationYear: num(e.target.value) })} placeholder="2027" />
          </Field>
          <Field label="School or club / team">
            <input className={inputCls} value={profile?.schoolOrClub ?? ''} onChange={(e) => saveProfile({ schoolOrClub: e.target.value })} placeholder="Lincoln HS / Elite Travel" />
          </Field>
          <Field label="Hometown region" hint="City/state region only — never a precise address.">
            <input className={inputCls} value={profile?.hometownRegion ?? ''} onChange={(e) => saveProfile({ hometownRegion: e.target.value })} placeholder="Austin, TX" />
          </Field>
          <Field label="Date of birth" hint="Used only to enable guardian protections for minors. Never shown publicly.">
            <input type="date" className={inputCls} value={profile?.dateOfBirth ?? ''} onChange={(e) => saveProfile({ dateOfBirth: e.target.value || null })} />
          </Field>
        </CardBody>
      </Card>

      {/* Sport detail */}
      <Card>
        <CardHeader><CardTitle>{SPORT_META[sport].name} detail</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Position / event / specialty">
            <input className={inputCls} value={sp?.position ?? ''} onChange={(e) => upsertSportProfile(sport, { position: e.target.value })} placeholder={isGolf ? 'All-around' : isTennis ? 'Singles' : 'Shortstop'} />
          </Field>
          <Field label="Competition level reached">
            <input className={inputCls} value={sp?.competitionLevel ?? ''} onChange={(e) => upsertSportProfile(sport, { competitionLevel: e.target.value })} placeholder="Varsity, State, Regional" />
          </Field>
          {isBat && (
            <>
              <Field label="Batting hand">
                <select className={inputCls} value={sp?.battingHand ?? ''} onChange={(e) => upsertSportProfile(sport, { battingHand: (e.target.value || undefined) as Handedness })}>
                  <option value="">—</option><option value="right">Right</option><option value="left">Left</option><option value="switch">Switch</option>
                </select>
              </Field>
              <Field label="Throwing hand">
                <select className={inputCls} value={sp?.throwingHand ?? ''} onChange={(e) => upsertSportProfile(sport, { throwingHand: (e.target.value || undefined) as Handedness })}>
                  <option value="">—</option><option value="right">Right</option><option value="left">Left</option>
                </select>
              </Field>
            </>
          )}
          {isGolf && (
            <>
              <Field label="Handicap index">
                <input type="number" step="0.1" className={inputCls} value={sp?.handicap ?? ''} onChange={(e) => upsertSportProfile(sport, { handicap: num(e.target.value) })} placeholder="4.2" />
              </Field>
              <Field label="Scoring average">
                <input type="number" step="0.1" className={inputCls} value={sp?.scoringAverage ?? ''} onChange={(e) => upsertSportProfile(sport, { scoringAverage: num(e.target.value) })} placeholder="74" />
              </Field>
            </>
          )}
          {isTennis && (
            <>
              <Field label="Rating value">
                <input type="number" step="0.1" className={inputCls} value={sp?.rating ?? ''} onChange={(e) => upsertSportProfile(sport, { rating: num(e.target.value) })} placeholder="9.5" />
              </Field>
              <Field label="Rating system">
                <select className={inputCls} value={sp?.ratingSystem ?? 'UTR'} onChange={(e) => upsertSportProfile(sport, { ratingSystem: e.target.value as never })}>
                  <option value="UTR">UTR</option><option value="NTRP">NTRP</option><option value="ITF">ITF</option><option value="WTN">WTN</option><option value="other">Other</option>
                </select>
              </Field>
            </>
          )}
        </CardBody>
      </Card>

      {/* Measurables */}
      <Card>
        <CardHeader><CardTitle>Measurables</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Field label="Height (in)"><input type="number" className={inputCls} value={profile?.heightInches ?? ''} onChange={(e) => saveProfile({ heightInches: num(e.target.value) })} placeholder="72" /></Field>
          <Field label="Weight (lb)"><input type="number" className={inputCls} value={profile?.weightLbs ?? ''} onChange={(e) => saveProfile({ weightLbs: num(e.target.value) })} placeholder="180" /></Field>
          <Field label="Dominant hand">
            <select className={inputCls} value={profile?.dominantHand ?? ''} onChange={(e) => saveProfile({ dominantHand: (e.target.value || undefined) as Handedness })}>
              <option value="">—</option><option value="right">Right</option><option value="left">Left</option><option value="switch">Switch</option>
            </select>
          </Field>
        </CardBody>
      </Card>

      {/* Academics */}
      <Card>
        <CardHeader><CardTitle>Academics (optional)</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="GPA"><input type="number" step="0.01" className={inputCls} value={profile?.gpa ?? ''} onChange={(e) => saveProfile({ gpa: num(e.target.value) })} placeholder="3.8" /></Field>
          <Field label="Test scores"><input className={inputCls} value={profile?.testScores ?? ''} onChange={(e) => saveProfile({ testScores: e.target.value })} placeholder="SAT 1300" /></Field>
          <Field label="Intended major"><input className={inputCls} value={profile?.intendedMajor ?? ''} onChange={(e) => saveProfile({ intendedMajor: e.target.value })} placeholder="Kinesiology" /></Field>
          <Field label="Academic interests"><input className={inputCls} value={profile?.academicInterests ?? ''} onChange={(e) => saveProfile({ academicInterests: e.target.value })} placeholder="Sports science, business" /></Field>
        </CardBody>
      </Card>

      {/* Recruiting context + story */}
      <Card>
        <CardHeader><CardTitle>Story & status</CardTitle></CardHeader>
        <CardBody className="grid gap-4">
          <Field label="Recruiting status">
            <select className={inputCls} value={profile?.recruitingStatus ?? 'exploring'} onChange={(e) => saveProfile({ recruitingStatus: e.target.value as RecruitingStatus })}>
              {Object.entries(RECRUITING_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Short bio"><textarea rows={3} className={inputCls} value={profile?.bio ?? ''} onChange={(e) => saveProfile({ bio: e.target.value })} placeholder="Two-way player, captain, three-year varsity starter…" /></Field>
          <Field label="Personal statement"><textarea rows={3} className={inputCls} value={profile?.personalStatement ?? ''} onChange={(e) => saveProfile({ personalStatement: e.target.value })} placeholder="Why you play, what you're chasing, in your words." /></Field>
          <Field label="Goals"><textarea rows={2} className={inputCls} value={profile?.goals ?? ''} onChange={(e) => saveProfile({ goals: e.target.value })} placeholder="Play at the next level; study X." /></Field>
          <Field label="Coachability notes" hint="What coaches/teammates say about how you work — kept honest."><textarea rows={2} className={inputCls} value={profile?.coachabilityNotes ?? ''} onChange={(e) => saveProfile({ coachabilityNotes: e.target.value })} placeholder="First to practice, takes feedback well…" /></Field>
        </CardBody>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Athlete email"><input type="email" className={inputCls} value={profile?.contactEmail ?? ''} onChange={(e) => saveProfile({ contactEmail: e.target.value })} placeholder="you@email.com" /></Field>
          <Field label="Athlete phone"><input className={inputCls} value={profile?.contactPhone ?? ''} onChange={(e) => saveProfile({ contactPhone: e.target.value })} placeholder="(555) 555-5555" /></Field>
          <Field label="Guardian name"><input className={inputCls} value={profile?.guardianName ?? ''} onChange={(e) => saveProfile({ guardianName: e.target.value })} /></Field>
          <Field label="Guardian email"><input type="email" className={inputCls} value={profile?.guardianEmail ?? ''} onChange={(e) => saveProfile({ guardianEmail: e.target.value })} /></Field>
          <Field label="Primary coach / trainer"><input className={inputCls} value={profile?.primaryCoachName ?? ''} onChange={(e) => saveProfile({ primaryCoachName: e.target.value })} /></Field>
          <Field label="Coach contact"><input className={inputCls} value={profile?.primaryCoachContact ?? ''} onChange={(e) => saveProfile({ primaryCoachContact: e.target.value })} /></Field>
          <label className="flex items-center gap-2 sm:col-span-2 text-sm text-foreground">
            <input type="checkbox" checked={profile?.maskAthleteContact ?? true} onChange={(e) => saveProfile({ maskAthleteContact: e.target.checked })} />
            Hide my direct contact publicly and route coaches through my guardian/coach (recommended, required for minors)
          </label>
        </CardBody>
      </Card>
    </div>
  );
}
