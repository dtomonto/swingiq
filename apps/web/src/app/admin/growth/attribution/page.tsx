// ============================================================
// /admin/growth/attribution — Privacy-aware first/last-touch attribution
// ============================================================

import type { Metadata } from 'next';
import { GitBranch, Info } from 'lucide-react';
import { attributionRepo } from '@/lib/growth/repository';
import { formatDate } from '@/lib/growth/format';
import { ModuleHeader, SectionCard, DataSourceBadge, EmptyState } from '../_components/ui';

export const metadata: Metadata = {
  title: 'Attribution | GrowthOS',
  robots: 'noindex, nofollow',
};

export default async function AttributionPage() {
  const events = await attributionRepo.list();

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={GitBranch}
        title="Attribution"
        description="Privacy-aware first/last-touch attribution."
      />

      {/* Model explainer */}
      <SectionCard title="Attribution models" icon={Info}>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-link mb-1">First-touch</p>
              <p className="text-xs text-link/70">
                100% of the conversion credit goes to the <strong className="text-link">very first</strong> channel
                or campaign that brought the visitor to the site. Useful for understanding which channels
                generate initial awareness.
              </p>
            </div>
            <div className="rounded-lg border border-success/20 bg-success/5 p-3">
              <p className="text-xs font-semibold text-success-text mb-1">Last-touch</p>
              <p className="text-xs text-success-text/70">
                100% of the credit goes to the <strong className="text-success-text">most recent</strong> channel before
                conversion. Useful for identifying which channels close the deal. The simplest model
                and most common default in ad platforms.
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-semibold text-link mb-1">Multi-touch (planned)</p>
              <p className="text-xs text-link/70">
                Credit is <strong className="text-link">distributed across all touchpoints</strong> in the
                customer journey (linear, time-decay, or data-driven weighting). Gives a more complete
                picture — requires capturing the full event sequence.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-link/90">
            <strong className="text-link">Consent-aware capture:</strong>{' '}
            Attribution events only fire when the visitor has explicitly granted <em>analytics</em> consent.
            GrowthOS uses a deny-by-default consent model — if consent is unknown or denied, the{' '}
            <code className="text-link text-2xs">track()</code> call in{' '}
            <code className="text-link text-2xs">lib/growth/analytics.ts</code> drops the event
            silently. No data is collected before consent.
          </div>
        </div>
      </SectionCard>

      {/* Attribution events table */}
      <SectionCard
        title="Attribution events"
        action={
          <DataSourceBadge source="mock" />
        }
      >
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-link mb-4">
          <strong>Demo data.</strong> These are realistic seed events — not real user data. Real capture
          requires wiring the analytics consent flow + attribution event emission in your app (see{' '}
          <code className="text-link text-2xs">lib/growth/analytics.ts</code> and your signup/conversion
          flows). Once wired, this table will show live events pulled from your analytics store.
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No attribution events yet"
            description="Attribution events appear here once your analytics + consent flow is wired and users grant consent."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Event</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Time</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Source</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Medium</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Campaign</th>
                  <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium whitespace-nowrap">Page</th>
                  <th className="text-left py-2.5 text-muted-foreground font-medium whitespace-nowrap">Device</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                    {/* Event name */}
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      <span className="font-mono text-success-text/90">{ev.eventName}</span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap">
                      {ev.timestamp
                        ? formatDate(ev.timestamp)
                        : '—'}
                    </td>

                    {/* Source */}
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {ev.source ? (
                        <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
                          {ev.source}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </td>

                    {/* Medium */}
                    <td className="py-2.5 pr-3 whitespace-nowrap">
                      {ev.medium ? (
                        <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
                          {ev.medium}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </td>

                    {/* Campaign */}
                    <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap max-w-[160px] truncate" title={ev.campaign ?? undefined}>
                      {ev.campaign ?? <span className="text-muted-foreground/70">—</span>}
                    </td>

                    {/* Page */}
                    <td className="py-2.5 pr-3 text-muted-foreground whitespace-nowrap max-w-[140px] truncate font-mono text-2xs" title={ev.page ?? undefined}>
                      {ev.page ?? '—'}
                    </td>

                    {/* Device */}
                    <td className="py-2.5 whitespace-nowrap">
                      {ev.deviceType ? (
                        <span className="text-muted-foreground capitalize">{ev.deviceType}</span>
                      ) : (
                        <span className="text-muted-foreground/70">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-2xs text-muted-foreground/70 mt-3 pt-3 border-t border-border">
          Showing {events.length} event{events.length !== 1 ? 's' : ''}.
          User IDs are anonymized — GrowthOS stores an anonymous browser ID, not PII.
          Events are tagged with UTM parameters when they are present in the URL at the time of the event.
        </p>
      </SectionCard>
    </div>
  );
}
