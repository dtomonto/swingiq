// ============================================================================
// SwingVantage Core — Public API (the package barrel)
// ============================================================================
//
// BOUNDARY RULE (audit finding AA-4):
//   packages/core  = framework-agnostic DOMAIN logic. Pure TypeScript: no React,
//                    no Next.js, no `window`/DOM, no app state. Diagnostics,
//                    scoring, sports models, analytics, research, import parsing.
//   apps/web/src/lib = APP GLUE for the Next.js client: React hooks/contexts,
//                    Zustand store wiring, browser APIs, i18n, SEO/JSON-LD.
//   If logic doesn't need React or the browser, it belongs here in core.
//
// IMPORTING: prefer a sub-path for clarity & tree-shaking, e.g.
//   import { runDiagnosticEngine } from '@swingiq/core/diagnostic';
//   import { SPORTS } from '@swingiq/core/sports';
// The root barrel below still re-exports everything for backwards compatibility.
// Sub-path imports are enabled via the "@swingiq/core/*" tsconfig path mapping
// and the package.json "exports" map.
// ============================================================================

export * from './types';
export * from './schemas/shot.schema';
export * from './schemas/profile.schema';
export * from './diagnostic/rules';
export * from './diagnostic/engine';
export * from './diagnostic/persistence';
export * from './diagnostic/profile-tolerance';
export * from './diagnostic/data-quality';
export * from './training/routines';
export * from './import/normalizer';
export * from './import/ai-mapping';
export * from './import/image-extraction';
export * from './import/image-data-extraction';
export * from './scoring/engine';
// video-analysis — export everything; buildYouTubeSearchUrl is also the primary search util
export * from './video-analysis';
export * from './research';
export * from './sports';
export * from './analytics';
export * from './golf';
