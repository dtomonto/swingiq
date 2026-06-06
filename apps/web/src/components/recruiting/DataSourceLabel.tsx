'use client';

// ============================================================
// Recruiting — credibility labels
// ------------------------------------------------------------
// The honest-first primitives: every metric, film, and claim shows
// where it came from and how confident we are. Verified sources get a
// check; unverified ones read plainly so nothing looks more proven
// than it is.
// ============================================================

import { ShieldCheck, CircleHelp, CircleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  type DataSource,
  type ConfidenceLevel,
  DATA_SOURCE_LABEL,
  CONFIDENCE_LABEL,
  VERIFIED_SOURCES,
} from '@/lib/recruiting';

export function DataSourceLabel({ source, className }: { source: DataSource; className?: string }) {
  const verified = VERIFIED_SOURCES.has(source as never);
  const needsReview = source === 'needs_review';
  const variant = verified ? 'success' : needsReview ? 'warning' : 'default';
  const Icon = verified ? ShieldCheck : needsReview ? CircleAlert : CircleHelp;
  return (
    <Badge variant={variant} className={className}>
      <Icon size={11} className="mr-1" aria-hidden="true" />
      {DATA_SOURCE_LABEL[source]}
    </Badge>
  );
}

/** Compact verified/unverified pill for tight rows. */
export function VerificationBadge({ source }: { source: DataSource }) {
  const verified = VERIFIED_SOURCES.has(source as never);
  return verified ? (
    <Badge variant="success">
      <ShieldCheck size={11} className="mr-1" aria-hidden="true" />
      Verified
    </Badge>
  ) : (
    <Badge variant="default">Unverified</Badge>
  );
}

const CONFIDENCE_VARIANT: Record<ConfidenceLevel, 'success' | 'warning' | 'default' | 'danger'> = {
  high: 'success',
  medium: 'default',
  low: 'warning',
  needs_review: 'danger',
};

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  return <Badge variant={CONFIDENCE_VARIANT[level]}>{CONFIDENCE_LABEL[level]}</Badge>;
}
