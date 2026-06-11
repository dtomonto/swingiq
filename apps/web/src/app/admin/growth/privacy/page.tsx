// ============================================================
// GrowthOS — Privacy / Consent (§30)
// ------------------------------------------------------------
// Consent records, tracking-pixel inventory, and an internal
// governance risk register. Server component — pure display.
// ============================================================

import type { Metadata } from 'next';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Radio,
} from 'lucide-react';
import { consentRepo, pixelsRepo } from '@/lib/growth/repository';
import { humanize } from '@/lib/growth/format';
import {
  ModuleHeader,
  SectionCard,
  Badge,
  StatusBadge,
  DataSourceBadge,
  MockDataNote,
} from '../_components/ui';

export const metadata: Metadata = {
  title: 'Privacy / Consent | GrowthOS',
  robots: 'noindex, nofollow',
};

// ── Governance risk register items ───────────────────────────
type RiskStatus = 'ok' | 'monitor' | 'needs-attention';

interface RiskItem {
  label: string;
  status: RiskStatus;
  note: string;
}

const RISK_REGISTER: RiskItem[] = [
  {
    label: 'Missing consent banner',
    status: 'needs-attention',
    note:
      'No consent banner yet — analytics consent defaults to "unknown", so GrowthOS analytics.track() drops events until consent is explicitly granted. Add a banner to collect consent before enabling GA4 / PostHog / Plausible.',
  },
  {
    label: 'Client-side secret exposure',
    status: 'ok',
    note:
      'AI and provider keys are server-only environment variables. Only NEXT_PUBLIC_* values reach the browser — the pattern is correct.',
  },
  {
    label: 'Unsafe tracking scripts',
    status: 'monitor',
    note:
      'No ad pixels load before consent. Plausible (if configured) is cookieless and compliant by default. Review this register whenever a new pixel is added.',
  },
  {
    label: 'Unclear opt-in source',
    status: 'monitor',
    note:
      'Email opt-in is explicit via the capture form on the marketing pages. Review that source attribution is stored on any new opt-in touch point.',
  },
  {
    label: 'Missing unsubscribe path',
    status: 'needs-attention',
    note:
      'Verify that every lifecycle and marketing email includes a one-click unsubscribe link. This is a legal requirement in GDPR, CAN-SPAM, and CASL jurisdictions.',
  },
  {
    label: 'Excessive event metadata',
    status: 'ok',
    note:
      'analytics.track() runs all metadata through sanitizeMetadata(), which strips nested objects and keeps payloads lightweight. No bloat risk.',
  },
  {
    label: 'PII in analytics events',
    status: 'ok',
    note:
      'sanitizeMetadata() blocks keys matching email, password, token, secret, SSN, card, phone, address, dob, and name — PII cannot land in analytics by accident.',
  },
  {
    label: 'Unprotected admin routes',
    status: 'ok',
    note:
      '/admin/* is guarded by ADMIN_SECRET in app/admin/layout.tsx. The secret is never exposed client-side.',
  },
];

function RiskIcon({ status }: { status: RiskStatus }) {
  if (status === 'ok') {
    return <Check className="w-4 h-4 text-success-text shrink-0 mt-0.5" />;
  }
  if (status === 'monitor') {
    return <AlertTriangle className="w-4 h-4 text-link shrink-0 mt-0.5" />;
  }
  return <ShieldAlert className="w-4 h-4 text-error-text shrink-0 mt-0.5" />;
}

function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const classes: Record<RiskStatus, string> = {
    ok: 'text-success-text bg-success/10 border-success/30',
    monitor: 'text-link bg-primary/10 border-primary/30',
    'needs-attention': 'text-error-text bg-error/10 border-error/30',
  };
  const labels: Record<RiskStatus, string> = {
    ok: 'OK',
    monitor: 'Monitor',
    'needs-attention': 'Needs Attention',
  };
  return <Badge className={classes[status]}>{labels[status]}</Badge>;
}

export default async function PrivacyPage() {
  const [consentRecords, pixels] = await Promise.all([consentRepo.list(), pixelsRepo.list()]);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={ShieldCheck}
        title="Privacy / Consent"
        description="Consent records, tracking-pixel inventory, and a governance risk register."
      />

      {/* ── Consent records ─────────────────────────────────── */}
      <SectionCard title="Consent records" icon={FileText}>
        {consentRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No consent records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Channel</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">State</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Source</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Region</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Retention note</th>
                  <th className="text-left py-2 text-muted-foreground font-medium whitespace-nowrap">Data</th>
                </tr>
              </thead>
              <tbody>
                {consentRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-border hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-foreground font-medium whitespace-nowrap">
                      {humanize(record.channel)}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <StatusBadge status={record.state} />
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground max-w-[180px]">
                      {record.source}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">
                      {record.region}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground max-w-[240px]">
                      {record.retentionNote || '—'}
                    </td>
                    <td className="py-2.5">
                      <DataSourceBadge source={record.dataSource} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Tracking pixel inventory ─────────────────────────── */}
      <SectionCard title="Tracking pixel inventory" icon={Radio}>
        {pixels.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tracking pixels recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Vendor</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Purpose</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Requires consent</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Timing</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">Risk note</th>
                  <th className="text-left py-2 text-muted-foreground font-medium whitespace-nowrap">Data</th>
                </tr>
              </thead>
              <tbody>
                {pixels.map((pixel) => (
                  <tr
                    key={pixel.id}
                    className="border-b border-border hover:bg-muted/40 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-foreground font-medium whitespace-nowrap">
                      {pixel.vendor}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground max-w-[160px]">
                      {pixel.purpose}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      <Badge className="text-blue-400 bg-blue-400/10 border-blue-400/30">
                        {humanize(pixel.consentChannel)}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {pixel.loadsBeforeConsent ? (
                        <Badge className="text-error-text bg-error/10 border-error/30">
                          <ShieldAlert className="w-3 h-3" />
                          fires pre-consent
                        </Badge>
                      ) : (
                        <Badge className="text-success-text bg-success/10 border-success/30">
                          <Check className="w-3 h-3" />
                          waits for consent
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground max-w-[200px]">
                      {pixel.riskNote || '—'}
                    </td>
                    <td className="py-2.5">
                      <DataSourceBadge source={pixel.dataSource} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Governance risk register ─────────────────────────── */}
      <SectionCard title="Governance risk register / internal warnings" icon={ShieldCheck}>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground pb-1">
            Internal governance checklist. These statuses reflect the current state of this application —
            review whenever a new integration, pixel, or message channel is added.
          </p>

          {RISK_REGISTER.map((item) => (
            <div
              key={item.label}
              className={[
                'rounded-lg border px-3 py-2.5',
                item.status === 'ok'
                  ? 'bg-success/5 border-success/20'
                  : item.status === 'monitor'
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-error/5 border-error/20',
              ].join(' ')}
            >
              <div className="flex items-start gap-2.5">
                <RiskIcon status={item.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span
                      className={[
                        'text-xs font-semibold',
                        item.status === 'ok'
                          ? 'text-success-text'
                          : item.status === 'monitor'
                            ? 'text-link'
                            : 'text-error-text',
                      ].join(' ')}
                    >
                      {item.label}
                    </span>
                    <RiskStatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Closing consent-aware note ───────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
        <p className="text-xs font-semibold text-foreground">
          GrowthOS analytics is consent-aware by design
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Every call to <code className="text-success-text bg-muted px-1 rounded">analytics.track()</code> checks
          consent before emitting any event. When the required consent channel is{' '}
          <span className="text-link font-medium">unknown</span> or{' '}
          <span className="text-error-text font-medium">denied</span>, the call returns{' '}
          <code className="text-foreground bg-muted px-1 rounded">{"{ status: 'dropped' }"}</code> and nothing
          is sent — events degrade to a silent no-op, never to unsolicited tracking.
          See <code className="text-success-text bg-muted px-1 rounded">apps/web/src/lib/growth/analytics.ts</code> for
          the full implementation.
        </p>
      </div>

      <MockDataNote />
    </div>
  );
}
