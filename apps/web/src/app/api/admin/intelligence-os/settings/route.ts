// GET  /api/admin/intelligence-os/settings — read settings
// POST /api/admin/intelligence-os/settings — update settings (settings.manage)
import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/intelligence-os/store';
import type { IntelligenceSettings } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await guard('logs.view');
  if (error) return error;
  return NextResponse.json({ ok: true, settings: await getSettings() });
}

// Numeric fields are clamped to sane ranges so the UI can't persist nonsense.
const NUMERIC_0_1: (keyof IntelligenceSettings)[] = [
  'autoServeConfidenceThreshold', 'semanticMatchThreshold', 'knowledgePromotionThreshold',
];
const NUMERIC_NONNEG: (keyof IntelligenceSettings)[] = [
  'cacheTtlHours', 'dailyTokenBudgetAlertCents', 'maxCostPerFeatureCents', 'rawEventRetentionDays', 'lowValueArchiveDays',
];

export async function POST(req: Request) {
  const { error, admin } = await guard('settings.manage');
  if (error) return error;
  const body = await readJson<Partial<IntelligenceSettings>>(req);
  const patch: Partial<IntelligenceSettings> = {};

  for (const key of NUMERIC_0_1) {
    const v = body[key];
    if (typeof v === 'number') (patch as Record<string, unknown>)[key] = Math.max(0, Math.min(1, v));
  }
  for (const key of NUMERIC_NONNEG) {
    const v = body[key];
    if (typeof v === 'number') (patch as Record<string, unknown>)[key] = Math.max(0, Math.round(v));
  }
  if (typeof body.requireReviewBeforeAutoServe === 'boolean') patch.requireReviewBeforeAutoServe = body.requireReviewBeforeAutoServe;
  if (Array.isArray(body.privacyExclusionKeywords)) patch.privacyExclusionKeywords = body.privacyExclusionKeywords.map(String);
  if (Array.isArray(body.reviewRequiredSafetyFlags)) patch.reviewRequiredSafetyFlags = body.reviewRequiredSafetyFlags as never;

  const settings = await saveSettings(patch, admin.email);
  return NextResponse.json({ ok: true, settings });
}
