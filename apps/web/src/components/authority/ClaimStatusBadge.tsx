'use client';

import { useState } from 'react';
import { ANALYTICS_EVENTS, track } from '@/lib/analytics';
import { getClaim, type ClaimEvidenceStatus } from '@/data/claims-registry';

const STATUS_STYLES: Record<ClaimEvidenceStatus, { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'bg-success/15 text-success border-success/30' },
  partially_verified: {
    label: 'Partly verified',
    cls: 'bg-warning/15 text-warning-text border-warning/30',
  },
  needs_review: { label: 'Needs review', cls: 'bg-muted text-muted-foreground border-border' },
  retired: { label: 'Retired', cls: 'bg-error/15 text-error border-error/30' },
};

/**
 * Renders the governance status of a claim from the claims registry next to
 * the claim it labels — a visible honesty signal. Click to reveal the internal
 * basis (and fire CLAIM_EXPLAINER_OPENED). Only render for claims you are
 * allowed to show: callers should pair this with `isPubliclyUsable(id)`.
 */
export function ClaimStatusBadge({ claimId }: { claimId: string }) {
  const [open, setOpen] = useState(false);
  const claim = getClaim(claimId);
  if (!claim) return null;
  const style = STATUS_STYLES[claim.evidenceStatus];

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) track(ANALYTICS_EVENTS.CLAIM_EXPLAINER_OPENED, { claim_id: claim.id });
        }}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold ${style.cls}`}
      >
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {style.label}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-10 mt-1 w-72 rounded-lg border border-border bg-card p-3 text-xs font-normal leading-relaxed text-muted-foreground shadow-theme"
        >
          <span className="block font-semibold text-foreground">Basis</span>
          {claim.basis}
          <span className="mt-1 block text-3xs text-muted-foreground/80">
            Last reviewed {claim.lastReviewed}
          </span>
        </span>
      )}
    </span>
  );
}
