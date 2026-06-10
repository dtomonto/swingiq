// ============================================================
// PublishingOS — public-read override merge (pure + thin server re-export)
// ------------------------------------------------------------
// The seam public surfaces use to honour durable publish decisions. The merge
// function is PURE and additive: when the override map is empty (no DB, nothing
// toggled) it returns exactly the base set, so wiring it into a public page is a
// zero-behaviour-change, fully reversible edit.
// ============================================================

import { getPublishOverrides } from './store';

/**
 * Filter `items` to those that are effectively published, applying any durable
 * override on top of each item's base published state.
 *
 *   override === true   → force published (promote a draft)
 *   override === false  → force draft     (pull a live item)
 *   override undefined  → use the item's own base state
 */
export function applyOverrides<T extends { id: string }>(
  items: T[],
  overrides: Record<string, boolean>,
  isBasePublished: (item: T) => boolean,
): T[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return items.filter(isBasePublished);
  }
  return items.filter((item) => {
    const o = overrides[item.id];
    return o === undefined ? isBasePublished(item) : o;
  });
}

/** True when the effective state of a single item is published. */
export function isEffectivelyPublished<T extends { id: string }>(
  item: T,
  overrides: Record<string, boolean>,
  isBasePublished: (item: T) => boolean,
): boolean {
  const o = overrides[item.id];
  return o === undefined ? isBasePublished(item) : o;
}

export { getPublishOverrides };
