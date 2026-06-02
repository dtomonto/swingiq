'use client';

// ============================================================
// SwingIQ — Non-Golf Progress Tracker
// Shows video analysis score trends, issue history, and
// drill completion for tennis, baseball, and softball.
// ============================================================

import { useMemo } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, Video, Activity } from 'lucide-react';
import Link from 'next/link';
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { format } from 'date-fns';

function TrendBadge({ change }: { change: number }) {
  if (change > 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-success"><TrendingUp size={12} /> +{change}</span>;
  if (change < 0) return <span className="flex items-center gap-0.5 text-xs font-semibold text-error"><TrendingDown size={12} /> {change}</span>;
  return <span className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground"><Minus size={12} /> 0</span>;
}

// Simple SVG sparkline for video analysis scores
function VideoScoreChart({ analyses }: { analyses: Array<{ overall_score: number; created_at: string; file_name: string }> }) {
  if (analyses.length < 2) return null;
  const ordered = [...analyses].reverse();
  const W = 600; const H = 140;
  const pad = { top: 20, bottom: 28, left: 32, right: 12 };
  const scores = ordered.map((a) => a.overall_score);
  const minS = Math.max(0, Math.min(...scores) - 8);
  const maxS = Math.min(100, Math.max(...scores) + 8);
  const toX = (i: number) => pad.left + (i / Math.max(1, ordered.length - 1)) * (W - pad.left - pad.right);
  const toY = (v: number) => pad.top + (1 - (v - minS) / (maxS - minS)) * (H - pad.top - pad.bottom);
  const pts = ordered.map((a, i) => ({ x: toX(i), y: toY(a.overall_score), score: a.overall_score, date: a.created_at }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const fillPath = `${linePath} L${pts.at(-1)!.x},${H - pad.bottom} L${pts[0]!.x},${H - pad.bottom} Z`;
  const trend = pts.at(-1)!.score - pts[0]!.score;
  const color = trend >= 0 ? '#22c55e' : '#ef4444';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
      <path d={fillPath} fill={`${color}18`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" />
          <text x={p.x} y={p.y - 8} fontSize="9.5" fill="#111827" textAnchor="middle" fontWeight="bold">{p.score}</text>
          <text x={p.x} y={H - 5} fontSize="8.5" fill="#9ca3af" textAnchor="middle">{format(new Date(p.date), 'MMM d')}</text>
        </g>
      ))}
    </svg>
  );
}

export function NonGolfProgress() {
  const { activeSport, sportEmoji, sportName } = useSport();
  const { video_analyses, training } = useSwingIQStore();

  const sportAnalyses = useMemo(
    () =>
      video_analyses
        .filter((v) => v.sport === activeSport)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [video_analyses, activeSport],
  );

  if (sportAnalyses.length === 0) {
    return (
      <>
        <div className="p-6 max-w-5xl mx-auto">
          <div className="text-center py-20">
            <Activity size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg font-medium mb-2">No {sportName} analyses yet</p>
            <p className="text-muted-foreground text-sm mb-6">
              Upload a video to start tracking your {sportName.toLowerCase()} development.
            </p>
            <Link href="/video">
              <Button><Video size={16} /> Analyze Your First Video</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const newest = sportAnalyses[0]!;
  const oldest = sportAnalyses[sportAnalyses.length - 1]!;
  const scoreChange = newest.overall_score - oldest.overall_score;
  const bestScore = Math.max(...sportAnalyses.map((a) => a.overall_score));

  // Issue frequency — count how often each issue appears
  const issueCounts: Record<string, number> = {};
  sportAnalyses.forEach((a) => {
    if (a.primary_issue) {
      issueCounts[a.primary_issue] = (issueCounts[a.primary_issue] ?? 0) + 1;
    }
  });
  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {sportEmoji} {sportName} Progress
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {sportAnalyses.length} video{sportAnalyses.length !== 1 ? 's' : ''} analyzed ·{' '}
            {format(new Date(oldest.created_at), 'MMM d')} → {format(new Date(newest.created_at), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <CardBody className="py-5">
              <p className="text-3xl font-black text-foreground">{newest.overall_score}</p>
              <p className="text-xs text-muted-foreground mt-1">Latest Score</p>
              {scoreChange !== 0 && <TrendBadge change={scoreChange} />}
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody className="py-5">
              <p className="text-3xl font-black text-success">{bestScore}</p>
              <p className="text-xs text-muted-foreground mt-1">Best Score</p>
            </CardBody>
          </Card>
          <Card className="text-center">
            <CardBody className="py-5">
              <p className="text-3xl font-black text-warning">
                {training.streak_days > 0 ? `🔥 ${training.streak_days}` : '0'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Practice Streak</p>
            </CardBody>
          </Card>
        </div>

        {/* Score trend chart */}
        {sportAnalyses.length > 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-success" />
                  <CardTitle>Score Over Time</CardTitle>
                </div>
                <TrendBadge change={scoreChange} />
              </div>
            </CardHeader>
            <CardBody>
              <VideoScoreChart analyses={sportAnalyses} />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Scores are video-derived estimates based on pose analysis. Use as a relative trend indicator.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Top recurring issues */}
        {topIssues.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recurring Issues</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {topIssues.map(([issue, count]) => (
                <div key={issue} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{issue}</p>
                    <p className="text-xs text-muted-foreground">Seen in {count} of {sportAnalyses.length} analyses</p>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-error rounded-full"
                      style={{ width: `${Math.round((count / sportAnalyses.length) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Analysis history */}
        <Card>
          <CardHeader><CardTitle>Analysis History</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {sportAnalyses.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{a.file_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'MMM d, yyyy')}</p>
                    {a.primary_issue && (
                      <Badge variant="warning" className="text-xs">⚠ {a.primary_issue.length > 24 ? a.primary_issue.slice(0, 24) + '…' : a.primary_issue}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{a.overall_score}</span>
                  <span className="text-xs text-muted-foreground">Score</span>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <div className="flex gap-3">
          <Link href="/video" className="flex-1">
            <Button variant="outline" className="w-full"><Video size={14} /> Analyze New Video</Button>
          </Link>
          <Link href="/training" className="flex-1">
            <Button className="w-full">View Drill Plan</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
