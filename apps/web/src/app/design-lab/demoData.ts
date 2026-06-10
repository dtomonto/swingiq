// Demo data for the dev-only /design-lab previews. The canonical builders now
// live in `@/lib/demo/swingDemo` (shared with the production /demo experience);
// this module re-exports them so existing design-lab imports keep working.
// Nothing here is presented as real data.

export {
  DEMO_PROFILE,
  demoScoreSessions,
  demoDiagnoseSession,
} from '@/lib/demo/swingDemo';
