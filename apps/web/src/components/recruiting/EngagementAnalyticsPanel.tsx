'use client';

// ============================================================
// Recruiting — EngagementAnalyticsPanel
// ------------------------------------------------------------
// Honest, non-invasive engagement: views, unique viewers, watch %,
// downloads, and plain-English insights. Includes a demo seeder so the
// athlete can see what coaches' activity will look like before any real
// traffic arrives (clearly labeled as sample data).
// ============================================================

import { useMemo } from 'react';
import { Eye, Users, Clock, Download, Repeat, Mail } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useRecruitingStore,
  summarizeEngagement,
  engagementInsights,
} from '@/lib/recruiting';

function Stat({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <Icon size={16} className="text-primary mb-1" aria-hidden="true" />
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function EngagementAnalyticsPanel() {
  const engagement = useRecruitingStore((s) => s.engagement);
  const film = useRecruitingStore((s) => s.film);
  const reels = useRecruitingStore((s) => s.reels);
  const record = useRecruitingStore((s) => s.recordEngagement);

  const summary = useMemo(() => summarizeEngagement(engagement), [engagement]);
  const insights = useMemo(() => engagementInsights(summary, film, reels), [summary, film, reels]);

  function seedDemo() {
    const reelId = reels.find((r) => r.featured)?.id ?? film[0]?.id ?? 'demo';
    record({ type: 'profile_view', viewerKey: 'demo-coach-1', region: 'US-CA' });
    record({ type: 'profile_view', viewerKey: 'demo-coach-1', region: 'US-CA' });
    record({ type: 'profile_view', viewerKey: 'demo-coach-2', region: 'US-TX' });
    record({ type: 'video_view', targetId: reelId });
    record({ type: 'video_watch_progress', targetId: reelId, progress: 0.62 });
    record({ type: 'packet_download' });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Eye size={17} className="text-primary" /> Engagement</CardTitle>
        {engagement.length === 0 && <Button size="sm" variant="outline" onClick={seedDemo}>Preview with sample data</Button>}
      </CardHeader>
      <CardBody className="space-y-4">
        {engagement.length === 0 ? (
          <EmptyState icon={Eye} title="No activity yet" description="When you share a link, you'll see views, watch time, and downloads here — plus tips on what's working." />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Stat icon={Eye} label="Profile views" value={summary.profileViews} />
              <Stat icon={Users} label="Unique viewers" value={summary.uniqueViewers} />
              <Stat icon={Clock} label="Avg watch" value={`${summary.avgWatchPct}%`} />
              <Stat icon={Repeat} label="Repeat visitors" value={summary.repeatVisitors} />
              <Stat icon={Download} label="Packet downloads" value={summary.packetDownloads} />
              <Stat icon={Mail} label="Coach contacts" value={summary.contactSubmissions} />
            </div>

            {insights.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights</p>
                {insights.map((i) => <p key={i} className="text-sm text-foreground/85 rounded-md bg-muted/50 px-3 py-1.5">{i}</p>)}
              </div>
            )}

            {summary.regions.length > 0 && (
              <p className="text-xs text-muted-foreground">Regions (coarse): {summary.regions.map((r) => `${r.region} (${r.count})`).join(', ')}</p>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground border-t border-border pt-2">
          Engagement is coarse and non-invasive: viewers are anonymous markers and regions are country/state only. No precise location or personal tracking.
        </p>
      </CardBody>
    </Card>
  );
}
