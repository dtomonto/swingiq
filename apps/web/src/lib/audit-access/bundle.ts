// ============================================================
// External Auditor Access — packet builder (isomorphic, pure)
// ------------------------------------------------------------
// Assembles the read-only audit packet from already-fetched inputs. Kept
// pure (no I/O, no env reads) so it is unit-testable; the route handler
// does the async fetching (crawl mirror, analytics) and injects results.
//
// PRIVACY: this builder only ever receives structural/aggregate inputs.
// It must never be passed — and never emits — user PII, raw session
// content, or secret values.
// ============================================================

import { AUDIT_BARRIERS, APP_SURFACE, STILL_CANNOT_PROVIDE } from './barriers';
import type { AuditBundle, AuditBundleInput } from './types';

/** Current packet schema version. Bump on a breaking shape change. */
export const AUDIT_SCHEMA_VERSION = 1;

export function buildAuditBundle(input: AuditBundleInput): AuditBundle {
  return {
    meta: {
      product: 'SwingVantage',
      site: input.site,
      generatedAt: input.generatedAt,
      schemaVersion: AUDIT_SCHEMA_VERSION,
      readOnly: true,
      note:
        'Read-only, token-gated audit packet. Aggregate & structural data only — no user PII, raw session content, or secrets. Items that cannot be served as JSON are listed under stillCannotProvide.',
    },
    barriersAddressed: AUDIT_BARRIERS,
    capabilities: input.capabilities,
    crawl: input.crawl,
    routes: {
      public: input.publicRoutes,
      authenticated: APP_SURFACE,
    },
    seo: input.seo,
    analytics: input.analytics,
    stillCannotProvide: STILL_CANNOT_PROVIDE,
  };
}
