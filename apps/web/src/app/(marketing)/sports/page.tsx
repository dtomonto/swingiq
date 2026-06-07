'use client';

// ============================================================
// SwingVantage — Sport Selection hub
// A premium entry point: pick a sport (or continue where you
// left off). Reads real per-sport progress from the store and
// routes into the app with that sport active. Fully theme-aware.
// ============================================================

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, Check, LayoutDashboard } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { useSport, SPORT_DISPLAY } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';

const SPORT_ORDER: SportId[] = ['golf', 'tennis', 'pickleball', 'padel', 'baseball', 'softball_slow', 'softball_fast'];

const SPORT_INFO: Record<SportId, { tagline: string; analyzes: string }> = {
  golf: {
    tagline: 'Dial in your ball striking',
    analyzes: 'Launch-monitor data — club path, face angle, attack angle, spin, and distance.',
  },
  tennis: {
    tagline: 'Sharpen every stroke',
    analyzes: 'Forehand, backhand, and serve mechanics, phase-by-phase.',
  },
  pickleball: {
    tagline: 'Win the kitchen',
    analyzes: 'Compact paddle mechanics — dinks, third-shot drops, drives, resets, and volleys.',
  },
  padel: {
    tagline: 'Read the glass, hold the net',
    analyzes: 'Overheads (bandeja/víbora), volleys, lobs, and wall play, phase-by-phase.',
  },
  baseball: {
    tagline: 'Build a repeatable swing',
    analyzes: 'Full swing from load through extension and follow-through.',
  },
  softball_slow: {
    tagline: 'Drive line-drive contact',
    analyzes: 'Arc timing, bat path, and directional hitting for slow pitch.',
  },
  softball_fast: {
    tagline: 'Quicken your launch',
    analyzes: 'Compact swing, timing, and pitch-speed adaptation for fast pitch.',
  },
};

export default function SportSelectionPage() {
  const router = useRouter();
  const { activeSport, setActiveSport } = useSport();
  const { sessions, video_analyses, profile, sportProfiles } = useSwingVantageStore();

  const statsBySport = useMemo(() => {
    const out = {} as Record<SportId, { count: number; started: boolean; lastScore: number | null }>;
    for (const sport of SPORT_ORDER) {
      const sportSessions = sessions.filter((s) => s.sport === sport);
      const sportVideos = video_analyses.filter((v) => v.sport === sport);
      const count = sportSessions.length + sportVideos.length;
      const hasProfile =
        sport === 'golf' ? !!profile : !!sportProfiles[sport as keyof typeof sportProfiles];
      const scored = [...sportSessions]
        .filter((s) => s.swing_score != null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      out[sport] = {
        count,
        started: count > 0 || hasProfile,
        lastScore: scored[0]?.swing_score ?? null,
      };
    }
    return out;
  }, [sessions, video_analyses, profile, sportProfiles]);

  const choose = (sport: SportId) => {
    setActiveSport(sport);
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-golf-fairway rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">SV</span>
            </span>
            <span className="text-foreground font-bold text-lg">SwingVantage</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <LayoutDashboard size={16} aria-hidden="true" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-2xl mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Choose your sport</h1>
          <p className="text-muted-foreground">
            SwingVantage adapts every analysis, drill, and coaching cue to your sport. Pick one to start —
            or continue where you left off.
          </p>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPORT_ORDER.map((sport) => {
            const display = SPORT_DISPLAY[sport];
            const info = SPORT_INFO[sport];
            const stat = statsBySport[sport];
            const isActive = sport === activeSport;
            return (
              <li key={sport}>
                <button
                  type="button"
                  onClick={() => choose(sport)}
                  aria-label={`${stat.started ? 'Continue' : 'Start'} ${display.name}`}
                  className={`group w-full h-full text-left rounded-2xl border-2 bg-card p-5 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-4xl leading-none" aria-hidden="true">
                      {display.emoji}
                    </span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2 py-0.5">
                        <Check size={12} strokeWidth={3} aria-hidden="true" /> Active
                      </span>
                    )}
                  </div>

                  <h2 className="font-bold text-card-foreground text-lg leading-tight">
                    {display.name}
                  </h2>
                  <p className="text-sm text-primary font-medium mt-0.5">{info.tagline}</p>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{info.analyzes}</p>

                  {/* Status row */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      {stat.started ? (
                        <>
                          {stat.count > 0
                            ? `${stat.count} session${stat.count !== 1 ? 's' : ''}`
                            : 'Profile started'}
                          {stat.lastScore != null && (
                            <span className="text-foreground font-semibold"> · last score {stat.lastScore}</span>
                          )}
                        </>
                      ) : (
                        'Not started yet'
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      {stat.started ? 'Continue' : 'Start'}
                      <ArrowRight
                        size={15}
                        aria-hidden="true"
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground mt-8">
          You can switch sports any time from the sidebar. Your data for each sport is kept separate.
        </p>
      </div>
    </main>
  );
}
