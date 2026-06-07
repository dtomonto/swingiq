// ============================================================
// SwingVantage — Feature Education Engine: API guards (server-only)
// ------------------------------------------------------------
// Reuse the Video Studio guards verbatim so auth + rate limiting are
// identical across admin tools (admin x-admin-secret header, dev-open;
// CRON_SECRET for scheduled drift audits; one-line rate-limit helper).
// ============================================================

export { requireAdmin, requireCronOrAdmin, limited } from '@/lib/video-studio/server/guards';
