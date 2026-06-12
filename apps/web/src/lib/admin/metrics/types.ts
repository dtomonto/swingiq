// ============================================================
// Admin Metric Explainers — shared types (isomorphic, pure)
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Every number on the admin dashboard should be clickable and open a page
//   that explains what it means and how it's computed. `MetricDefinition` is
//   the curated content for one metric; the registry (./registry.ts) holds
//   them and the /admin/metrics/[id] route renders them. Anything not yet
//   curated still opens an honest generic explainer (no dead links).
//
//   Pure types only — safe on server, client or in tests.
// ============================================================

/** Honest provenance of a number — never invent; always label. */
export type MetricDataSource =
  | 'real' // measured from the database / a live API
  | 'derived' // computed from other real numbers (a formula)
  | 'estimated' // modelled / approximated, clearly not exact
  | 'placeholder' // shown as scaffolding until a provider is connected
  | 'demo' // realistic seed data, not production
  | 'config'; // an environment / configuration value, not a measurement

/** Broad grouping so the metrics index can be sectioned. */
export type MetricCategory =
  | 'platform'
  | 'system'
  | 'ai'
  | 'growth'
  | 'security'
  | 'content'
  | 'reliability';

/** A related surface or sibling metric to jump to from the explainer. */
export interface MetricLink {
  label: string;
  href: string;
}

/** The curated explainer for one metric. */
export interface MetricDefinition {
  /** Stable kebab-case id used in the URL: /admin/metrics/<id>. */
  id: string;
  /** Canonical display name, e.g. "Authenticated accounts". */
  label: string;
  category: MetricCategory;
  /** One-line "what is this". */
  summary: string;
  /** Plain-English, deeper explanation of what the number represents. */
  definition: string;
  /** How it's computed — the formula, query or derivation, in plain terms. */
  howComputed: string;
  /** Honest provenance label for the underlying number. */
  dataSource: MetricDataSource;
  /** Specifics of the source, e.g. "COUNT(*) on golfer_profiles (service-role)". */
  sourceDetail?: string;
  /** How to READ the number — what good/healthy/concerning looks like. */
  interpretation: string;
  /** Honesty caveats — what it does NOT mean, known limits. */
  caveats?: string[];
  /** Where this number is shown / what to open next. */
  related?: MetricLink[];
  /** Optional unit rendered with the live value ("%", "s", "$"). */
  unit?: string;
}

/** The live value of a metric right now, resolved server-side (optional). */
export interface ResolvedMetricValue {
  /** Display-ready value, e.g. "1,204" or "—". */
  value: string;
  /** Provenance of THIS reading (may differ from the curated default,
   *  e.g. "real" when connected vs "placeholder" in local mode). */
  source: MetricDataSource;
  /** ISO timestamp the value was read. */
  asOf?: string;
  /** Honest one-liner about the reading (e.g. why it's blank). */
  note?: string;
}
