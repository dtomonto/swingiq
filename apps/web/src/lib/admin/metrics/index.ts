// Admin Metric Explainers — pure public surface. Every dashboard number can
// link to /admin/metrics/<id>; curated entries get a rich page, the rest get
// an honest generic explainer. (Live-value resolvers are server-only — import
// them directly from ./resolvers.server, never from here.)
export type {
  MetricDefinition,
  MetricCategory,
  MetricDataSource,
  MetricLink,
  ResolvedMetricValue,
} from './types';
export {
  METRIC_BASE_PATH,
  metricHref,
  humanizeMetricId,
  METRIC_CATEGORY_LABEL,
  METRIC_DATA_SOURCE_LABEL,
  listMetricDefinitions,
  getMetricDefinition,
  hasMetricDefinition,
  metricsByCategory,
} from './registry';
