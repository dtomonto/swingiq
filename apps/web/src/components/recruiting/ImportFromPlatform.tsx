'use client';

// ============================================================
// Recruiting — ImportFromPlatform
// ------------------------------------------------------------
// One-tap bridge from the athlete's existing SwingVantage data into
// the recruiting hub. Launch-monitor numbers import as device-verified;
// user-entered figures import as self-reported — labeled honestly so
// nothing looks more proven than it is. Solves the empty-profile
// cold-start that otherwise keeps profile strength low.
// ============================================================

import { useMemo, useState } from 'react';
import { Sparkles, Check, ArrowDownToLine } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSwingVantageStore } from '@/store';
import {
  useRecruitingStore,
  buildPlatformImport,
  getMetricDef,
  type PlatformImportData,
} from '@/lib/recruiting';
import { DataSourceLabel } from './DataSourceLabel';

export function ImportFromPlatform({ compact = false }: { compact?: boolean }) {
  const profile = useSwingVantageStore((s) => s.profile);
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);

  const saveProfile = useRecruitingStore((s) => s.saveProfile);
  const upsertSportProfile = useRecruitingStore((s) => s.upsertSportProfile);
  const addMetric = useRecruitingStore((s) => s.addMetric);
  const existingMetrics = useRecruitingStore((s) => s.metrics);

  const [done, setDone] = useState(false);

  const data: PlatformImportData = useMemo(
    () => ({
      name: profile?.name,
      handedness: profile?.handedness === 'left' ? 'left' : profile?.handedness === 'right' ? 'right' : undefined,
      handicap: typeof profile?.handicap === 'number' ? profile.handicap : null,
      scoringAverage: typeof profile?.scoring_average === 'number' ? profile.scoring_average : null,
      sessions: sessions.map((s) => ({
        sport: s.sport,
        shots: s.shots.map((sh) => ({
          clubCategory: sh.club_category,
          ballSpeed: sh.ball_data?.ball_speed ?? null,
          carryDistance: sh.ball_data?.carry_distance ?? null,
          clubSpeed: sh.club_data?.club_speed ?? null,
          smashFactor: sh.ball_data?.smash_factor ?? null,
          launchAngle: sh.ball_data?.launch_angle_vertical ?? null,
          spinRate: sh.ball_data?.spin_rate ?? null,
        })),
      })),
      analysisCount: videoAnalyses.length,
    }),
    [profile, sessions, videoAnalyses],
  );

  const result = useMemo(() => buildPlatformImport(data), [data]);

  if (!result.available) {
    if (compact) return null;
    return (
      <Card>
        <CardBody className="text-sm text-muted-foreground">
          No SwingVantage data to import yet. As you log sessions and analyze swings, your verified numbers will be importable here.
        </CardBody>
      </Card>
    );
  }

  function applyImport() {
    if (result.profilePatch.athleteName || result.profilePatch.primarySport || result.profilePatch.dominantHand) {
      saveProfile(result.profilePatch);
    }
    if (result.golfSportPatch) upsertSportProfile('golf', result.golfSportPatch);
    // Skip metrics that already exist (same key + sport) to avoid duplicates.
    const have = new Set(existingMetrics.map((m) => `${m.sport}:${m.metricKey}`));
    for (const m of result.metrics) {
      if (have.has(`${m.sport}:${m.metricKey}`)) continue;
      addMetric({ metricKey: m.metricKey, sport: m.sport, value: m.value, unit: m.unit, source: m.source });
    }
    setDone(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles size={17} className="text-primary" /> Import from SwingVantage</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Give your profile a head start from the data you already have. Launch-monitor numbers import as device-verified; the rest is labeled by source.
        </p>

        {(result.profilePatch.athleteName || result.profilePatch.primarySport) && (
          <p className="text-sm text-foreground/85">
            Profile: {[result.profilePatch.athleteName, result.profilePatch.primarySport].filter(Boolean).join(' · ')}
          </p>
        )}

        {result.metrics.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{result.metrics.length} metric(s) ready</p>
            <div className="flex flex-wrap gap-1.5">
              {result.metrics.map((m) => (
                <span key={`${m.sport}:${m.metricKey}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs">
                  <span className="text-foreground font-medium">{getMetricDef(m.metricKey)?.label ?? m.metricKey}: {m.value}{m.unit ? ` ${m.unit}` : ''}</span>
                  <DataSourceLabel source={m.source} />
                </span>
              ))}
            </div>
          </div>
        )}

        {result.notes.map((n) => <p key={n} className="text-xs text-muted-foreground">{n}</p>)}

        {done ? (
          <Badge variant="success"><Check size={12} className="mr-1" /> Imported into your recruiting profile</Badge>
        ) : (
          <Button onClick={applyImport}><ArrowDownToLine size={15} /> Import to recruiting profile</Button>
        )}
      </CardBody>
    </Card>
  );
}
