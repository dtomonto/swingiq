// ============================================================
// SwingVantage — Skill Transfer Map: Types
// ------------------------------------------------------------
// A cross-sport architecture: shared movement PRINCIPLES, their
// sport-specific EXPRESSIONS, and the TRANSFER PATTERNS that link
// them. Honest framing: a shared principle suggests a pattern MAY
// transfer — it is a related idea, never a guarantee.
// ============================================================

import type { SportId } from '@swingiq/core';

export interface MovementPrinciple {
  id: string;
  name: string;
  /** The shared idea, sport-neutral. */
  description: string;
  /** How the principle shows up in each sport (only where it applies). */
  expressions: Partial<Record<SportId, string>>;
}

export interface TransferPattern {
  principleId: string;
  principle: string;
  fromSport: SportId;
  toSport: SportId;
  fromExpression: string;
  toExpression: string;
  /** Honest caveat — related, not guaranteed. */
  note: string;
}
