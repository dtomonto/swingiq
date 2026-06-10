// ============================================================
// PublishingOS — public barrel
// ------------------------------------------------------------
// Pure modules (types, transitions, risk, validation, entity-registry,
// overrides) are safe to import anywhere. The store + service touch the
// service-role client and must only be imported from server code.
// ============================================================

export * from './types';
export * from './transitions';
export * from './risk';
export * from './validation';
export * from './entity-registry';
export { applyOverrides, isEffectivelyPublished } from './overrides';

// Server-only (re-exported for convenience; do not import from client):
export {
  getPublishOverrides,
  listPublishOverrides,
  setPublishOverride,
  listEntities,
  getEntity,
  listEvents,
  isPublishingPersistent,
} from './store';
export { recordPublishDecision, getRecentEvents } from './service';
export type { PublishDecisionInput, PublishDecisionResult } from './service';
