import {
  DEFAULT_RECRUITING_STATE,
  type RecruitingState,
  type RecruitingProfile,
  type PlayerMetric,
  type FilmAsset,
  type ShareLink,
} from '../types';
import { computeProfileStrength } from '../strength';
import { buildSummary, validateSummaryBody, FORBIDDEN_CLAIM_PATTERNS } from '../summary';
import { buildOutreach, validateOutreachBody } from '../outreach';
import { benchmarkPosition } from '../benchmarks';
import { analyzeReel, scoreFilmQuality, findDuplicateFilm } from '../filmQuality';
import {
  generateSlug,
  permissionPresetFor,
  isLinkActive,
  isLinkExpired,
  buildCoachSnapshot,
  isMinor,
} from '../share';
import { summarizeEngagement, engagementInsights } from '../analytics';
import { buildPlatformImport, type PlatformImportData } from '../platformImport';

const TS = '2026-01-01T00:00:00.000Z';

function profile(over: Partial<RecruitingProfile> = {}): RecruitingProfile {
  return {
    id: 'p1',
    athleteName: 'Jordan Rivera',
    graduationYear: 2027,
    playerType: 'high_school',
    primarySport: 'baseball',
    maskAthleteContact: true,
    recruitingStatus: 'actively_recruiting',
    verifiedLinks: [],
    sportProfiles: { baseball: { sport: 'baseball', position: 'Shortstop', secondaryPositions: [], source: 'self_reported' } },
    visibility: 'private',
    createdAt: TS,
    updatedAt: TS,
    ...over,
  };
}

function metric(over: Partial<PlayerMetric> = {}): PlayerMetric {
  return {
    id: 'm_' + Math.random().toString(36).slice(2, 7),
    metricKey: 'exit_velocity',
    sport: 'baseball',
    currentValue: 90,
    unit: 'mph',
    history: [{ value: 90, date: TS, source: 'self_reported' }],
    source: 'self_reported',
    coachValidated: false,
    visibility: 'link_only',
    updatedAt: TS,
    ...over,
  };
}

function film(over: Partial<FilmAsset> = {}): FilmAsset {
  return {
    id: 'f_' + Math.random().toString(36).slice(2, 7),
    title: 'Swing session',
    sport: 'baseball',
    category: 'swing_session',
    tags: [],
    featured: false,
    visibility: 'link_only',
    source: 'self_reported',
    createdAt: TS,
    updatedAt: TS,
    deletedAt: null,
    ...over,
  };
}

function state(over: Partial<RecruitingState> = {}): RecruitingState {
  return { ...DEFAULT_RECRUITING_STATE, ...over };
}

describe('profile strength', () => {
  it('rises as sections are completed', () => {
    const empty = computeProfileStrength(state());
    expect(empty.tier).toBe('incomplete');

    const filled = computeProfileStrength(
      state({
        profile: profile({ contactEmail: 'a@b.com', heightInches: 72, bio: 'x' }),
        metrics: [metric({ source: 'device_imported', coachValidated: true }), metric({ metricKey: 'bat_speed', currentValue: 70 })],
        film: [film({ featured: true, category: 'tournament_footage', source: 'event_verified' })],
        summaries: [{ id: 's', audience: 'coach', body: 'b', claims: [], caveats: [], generator: 'deterministic', createdAt: TS }],
      }),
    );
    expect(filled.score).toBeGreaterThan(empty.score);
  });

  it('caps a fully self-reported profile below Strong', () => {
    const s = computeProfileStrength(
      state({
        profile: profile({ contactEmail: 'a@b.com', heightInches: 72, bio: 'x', personalStatement: 'y' }),
        metrics: [metric(), metric({ metricKey: 'bat_speed', currentValue: 70 }), metric({ metricKey: 'pitch_velocity', currentValue: 85 })],
        film: [film({ featured: true, category: 'tournament_footage' })],
      }),
    );
    expect(s.selfReportedOnly).toBe(true);
    expect(s.score).toBeLessThanOrEqual(70);
    expect(s.tier === 'strong' || s.tier === 'elite').toBe(false);
  });
});

describe('AI summary guardrails', () => {
  it('never emits forbidden ceiling claims', () => {
    const s = state({
      profile: profile(),
      metrics: [metric({ currentValue: 102, source: 'device_imported' })],
      film: [film({ category: 'full_game' })],
    });
    for (const audience of ['coach', 'scout', 'parent', 'bio', 'email_intro', 'social'] as const) {
      const draft = buildSummary(s, audience);
      for (const re of FORBIDDEN_CLAIM_PATTERNS) expect(re.test(draft.body)).toBe(false);
      expect(validateSummaryBody(draft.body)).toBe(true);
    }
  });

  it('rejects an AI body that smuggles in a guarantee', () => {
    expect(validateSummaryBody('This player is a guaranteed Division I prospect.')).toBe(false);
    expect(validateSummaryBody('Strong exit velocity backed by device data over three sessions.')).toBe(true);
  });

  it('grounds strength claims in real metrics', () => {
    const draft = buildSummary(
      state({ profile: profile(), metrics: [metric({ currentValue: 95, source: 'device_imported' })] }),
      'coach',
    );
    expect(draft.claims.some((c) => c.evidence.includes('exit_velocity'))).toBe(true);
  });
});

describe('outreach guardrails', () => {
  it('produces a respectful draft with no guarantees', () => {
    const draft = buildOutreach(state({ profile: profile() }), {
      kind: 'initial',
      contact: { name: 'Smith', organization: 'State University' },
      profileLink: 'https://swingvantage.com/player/abc',
    });
    expect(draft.body.length).toBeGreaterThan(40);
    expect(validateOutreachBody(draft.body)).toBe(true);
    for (const re of FORBIDDEN_CLAIM_PATTERNS) expect(re.test(draft.body)).toBe(false);
  });

  it('flags an over-promising body', () => {
    expect(validateOutreachBody('I guarantee a full ride scholarship.')).toBe(false);
  });
});

describe('benchmark normalization', () => {
  it('handles higher-is-better (exit velocity)', () => {
    const low = benchmarkPosition('exit_velocity', 'baseball', 75)!;
    const high = benchmarkPosition('exit_velocity', 'baseball', 100)!;
    expect(high.normalized).toBeGreaterThan(low.normalized);
  });

  it('handles lower-is-better (pop time)', () => {
    const slow = benchmarkPosition('pop_time', 'baseball', 2.3)!;
    const fast = benchmarkPosition('pop_time', 'baseball', 1.85)!;
    expect(fast.normalized).toBeGreaterThan(slow.normalized);
  });

  it('returns null when no band exists', () => {
    expect(benchmarkPosition('contact_rate', 'baseball', 80)).toBeNull();
  });
});

describe('film + reel analysis', () => {
  it('scores low-context film below well-tagged game film', () => {
    const bare = scoreFilmQuality(film({ cameraAngle: undefined, date: undefined, opponentOrEvent: undefined }));
    const rich = scoreFilmQuality(
      film({ category: 'full_game', cameraAngle: 'down_the_line', date: TS, opponentOrEvent: 'Rival HS', resultOutcome: '2-4, 2B', durationSeconds: 60 }),
    );
    expect(rich).toBeGreaterThan(bare);
  });

  it('warns on an over-long, flash-only reel', () => {
    const clips = [
      { id: 'c1', filmId: 'f1', label: 'a', startSeconds: 0, endSeconds: 120, kind: 'flash' as const, speed: 'full' as const, createdAt: TS },
      { id: 'c2', filmId: 'f1', label: 'b', startSeconds: 0, endSeconds: 90, kind: 'flash' as const, speed: 'full' as const, createdAt: TS },
    ];
    const reel = { id: 'r', title: 'reel', sport: 'baseball' as const, style: 'hitting', clipIds: ['c1', 'c2'], featured: true, visibility: 'link_only' as const, createdAt: TS, updatedAt: TS };
    const a = analyzeReel(reel, clips, [film({ id: 'f1' })]);
    expect(a.totalSeconds).toBe(210);
    expect(a.findings.some((f) => /too long|~90s/i.test(f.message))).toBe(true);
    expect(a.findings.some((f) => /evaluation/i.test(f.message))).toBe(true);
  });

  it('detects duplicate film', () => {
    const dupes = findDuplicateFilm([
      film({ id: 'a', title: 'BP round', category: 'swing_session', cameraAngle: 'face_on', date: TS }),
      film({ id: 'b', title: 'BP round', category: 'swing_session', cameraAngle: 'face_on', date: TS }),
    ]);
    expect(dupes.length).toBe(1);
  });
});

describe('share links', () => {
  it('generates distinct slugs', () => {
    const slugs = new Set(Array.from({ length: 200 }, () => generateSlug()));
    expect(slugs.size).toBeGreaterThan(190);
  });

  it('coach/scout presets allow contact; public masks it', () => {
    expect(permissionPresetFor('coach').showContactInfo).toBe(true);
    expect(permissionPresetFor('public').showContactInfo).toBe(false);
    expect(permissionPresetFor('analytics_anon').canContact).toBe(false);
  });

  it('treats expired and revoked links as inactive', () => {
    const base: ShareLink = {
      id: 'l', slug: 's', kind: 'expiring', label: 'x',
      permissions: permissionPresetFor('expiring'), password: null,
      expiresAt: '2020-01-01T00:00:00.000Z', watermark: false, active: true, createdAt: TS, revokedAt: null,
    };
    expect(isLinkExpired(base)).toBe(true);
    expect(isLinkActive(base)).toBe(false);
    expect(isLinkActive({ ...base, expiresAt: null, revokedAt: TS })).toBe(false);
    expect(isLinkActive({ ...base, expiresAt: null })).toBe(true);
  });
});

describe('coach-view snapshot', () => {
  const link: ShareLink = {
    id: 'l', slug: 's', kind: 'coach', label: 'Coach Smith',
    permissions: permissionPresetFor('coach'), password: null, expiresAt: null,
    watermark: true, active: true, createdAt: TS, revokedAt: null,
  };

  it('excludes private items and includes shared ones', () => {
    const s = state({
      profile: profile({ maskAthleteContact: false, contactEmail: 'a@b.com', dateOfBirth: '1995-01-01' }),
      metrics: [metric({ visibility: 'private' }), metric({ metricKey: 'bat_speed', visibility: 'link_only' })],
      film: [film({ visibility: 'private' }), film({ visibility: 'public' })],
    });
    const snap = buildCoachSnapshot(s, link);
    expect(snap.metrics.length).toBe(1);
    expect(snap.film.length).toBe(1);
    expect(snap.watermark).toBe(true);
  });

  it('masks a minor athlete contact even when the link allows it', () => {
    const recentDob = new Date(Date.now() - 15 * 365.25 * 24 * 3600 * 1000).toISOString();
    expect(isMinor(recentDob)).toBe(true);
    const s = state({
      profile: profile({ maskAthleteContact: false, contactEmail: 'minor@x.com', guardianEmail: 'g@x.com', dateOfBirth: recentDob }),
      guardianConsent: { ...DEFAULT_RECRUITING_STATE.guardianConsent, allowContactDisplay: false },
    });
    const snap = buildCoachSnapshot(s, link);
    const athleteEmailShown = (snap.contact ?? []).some((c) => c.value.includes('minor@x.com'));
    expect(athleteEmailShown).toBe(false);
    expect(snap.disclosures.some((d) => /minor/i.test(d))).toBe(true);
  });
});

describe('platform import bridge', () => {
  it('imports launch-monitor driver data as device-verified golf metrics', () => {
    const data: PlatformImportData = {
      name: 'Casey Lin',
      handedness: 'right',
      handicap: 4,
      sessions: [
        {
          sport: 'golf',
          shots: [
            { clubCategory: 'driver', ballSpeed: 162, carryDistance: 268, clubSpeed: 110, smashFactor: 1.47, launchAngle: 13, spinRate: 2600 },
            { clubCategory: 'driver', ballSpeed: 165, carryDistance: 275, clubSpeed: 112, smashFactor: 1.48, launchAngle: 12, spinRate: 2500 },
            { clubCategory: 'mid_iron', ballSpeed: 120, carryDistance: 170, clubSpeed: 88, smashFactor: 1.36, launchAngle: 18, spinRate: 5200 },
          ],
        },
      ],
      analysisCount: 3,
    };
    const r = buildPlatformImport(data);
    expect(r.available).toBe(true);
    expect(r.profilePatch).toMatchObject({ athleteName: 'Casey Lin', primarySport: 'golf', dominantHand: 'right' });
    const carry = r.metrics.find((m) => m.metricKey === 'driver_carry');
    expect(carry).toBeTruthy();
    expect(carry!.value).toBe(275); // max of driver carries, irons excluded
    expect(carry!.source).toBe('device_imported');
    // Self-reported handicap is labeled honestly, not as verified.
    const handicap = r.metrics.find((m) => m.metricKey === 'handicap');
    expect(handicap!.source).toBe('self_reported');
  });

  it('is unavailable when there is nothing to import', () => {
    const r = buildPlatformImport({ sessions: [] });
    expect(r.available).toBe(false);
    expect(r.metrics).toHaveLength(0);
  });
});

describe('engagement analytics', () => {
  it('aggregates views, unique viewers, and watch %', () => {
    const sum = summarizeEngagement([
      { id: '1', type: 'profile_view', viewerKey: 'v1', at: TS },
      { id: '2', type: 'profile_view', viewerKey: 'v1', at: TS },
      { id: '3', type: 'profile_view', viewerKey: 'v2', at: TS },
      { id: '4', type: 'video_view', targetId: 'reelA', at: TS },
      { id: '5', type: 'video_watch_progress', progress: 0.2, at: TS },
      { id: '6', type: 'video_watch_progress', progress: 0.4, at: TS },
    ]);
    expect(sum.profileViews).toBe(3);
    expect(sum.uniqueViewers).toBe(2);
    expect(sum.repeatVisitors).toBe(1);
    expect(sum.avgWatchPct).toBe(30);
    expect(sum.topVideos[0].targetId).toBe('reelA');
  });

  it('produces an honest low-watch insight', () => {
    const sum = summarizeEngagement([
      ...Array.from({ length: 6 }, (_, i) => ({ id: 'vv' + i, type: 'video_view' as const, targetId: 'r', at: TS })),
      { id: 'w', type: 'video_watch_progress' as const, progress: 0.2, at: TS },
    ]);
    const insights = engagementInsights(sum, [], [{ id: 'r', title: 'Reel', sport: 'baseball', style: 'hitting', clipIds: [], featured: true, visibility: 'link_only', createdAt: TS, updatedAt: TS }]);
    expect(insights.some((i) => /too long|90s/i.test(i))).toBe(true);
  });
});
