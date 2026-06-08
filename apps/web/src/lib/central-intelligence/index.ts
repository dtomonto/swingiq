// ============================================================
// CentralIntelligenceOS — public barrel
// ------------------------------------------------------------
// The platform's ethical intelligence brain. Import from here:
//   import { calculateProfileCompletion, evaluateFoundingFathersStatus }
//     from '@/lib/central-intelligence';
//
// Layout:
//   config.ts            — constants + ethical guarantees
//   types.ts             — memory layers, completion, sessions, founding, recs
//   profile-completion.ts— required-fields engine (per sport)
//   sessions.ts          — valid-session definition + counting
//   founding.ts          — qualification + membership gate (pure)
//   memory.ts            — ethical memory + coaching continuity
//   aggregate.ts         — anonymized distributions (k-anonymity)
//   recommendations.ts   — deterministic recommendations engine
//   snapshot.ts          — main-store → engine inputs adapter
//   store.ts             — client local-first memory/consent store
//   achievements.ts      — Founding Member + session milestones
// Server-only (not re-exported to avoid leaking secrets into the client):
//   founding-server.ts   — tamper-proof member-number assignment
// ============================================================

export * from './config';
export * from './types';
export * from './profile-completion';
export * from './sessions';
export * from './founding';
export * from './memory';
export * from './aggregate';
export * from './recommendations';
export * from './snapshot';
export * from './achievements';
