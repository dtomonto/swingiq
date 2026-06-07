// ============================================================
// SwingVantage — Feature Education Engine: Video brief generator
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   We do NOT reimplement video generation — the Video Studio already does
//   briefs → jobs → assets → placement → measurement. This adapter turns a
//   Feature Registry record into a Video Studio `VideoOpportunity`, asks the
//   Studio's deterministic `buildBrief` to write the script + storyboard,
//   and wraps the result as an EducationAsset so it shows up in the feature's
//   coverage. On publish, the same opportunity/brief can be handed to the
//   Studio's pipeline.
// ============================================================

import {
  buildBrief,
  MAX_DURATION_BY_TYPE,
  type VideoOpportunity,
  type VideoCreativeBrief,
  type VideoType,
  type StudioAudience,
  type StudioSport,
  type OpportunitySignals,
} from '@/lib/video-studio';
// DEFAULT_STYLE_BY_TYPE isn't re-exported from the studio index — import directly.
import { DEFAULT_STYLE_BY_TYPE } from '@/lib/video-studio/brand';
import { type FeatureRecord, type EducationAsset } from '../types';
import { type GenContext, baseAsset, primaryRoute, whereToFind } from './helpers';

const STUDIO_SPORTS: StudioSport[] = ['golf', 'tennis', 'baseball', 'softball_slow', 'softball_fast'];

function pickVideoType(feature: FeatureRecord): VideoType {
  if (feature.audiences.includes('admin') || feature.category === 'admin-capability') return 'admin_training';
  if (feature.routes.some((r) => ['/', '/pricing', '/how-it-works'].includes(r))) return 'product_tour';
  if (feature.category === 'support-troubleshooting') return 'error_resolution';
  return 'feature_tutorial';
}

function mapStudioAudience(feature: FeatureRecord): StudioAudience {
  if (feature.audiences.includes('coach')) return 'coach';
  if (feature.audiences.includes('parent')) return 'parent';
  if (feature.audiences.includes('admin') || feature.audiences.includes('enterprise')) return 'team';
  if (feature.audiences.some((a) => ['new-user', 'returning-user', 'power-user'].includes(a))) return 'athlete';
  return 'all';
}

function zeroSignals(): OpportunitySignals {
  return {
    userConfusionRisk: 0,
    featureComplexity: 0,
    funnelImportance: 0,
    conversionOpportunity: 0,
    onboardingFriction: 0,
    educationalDepth: 0,
    supportBurden: 0,
    visualExplanationNeed: 0,
    trustBuildingNeed: 0,
    seoOpportunity: 0,
    accessibilityBenefit: 0,
    retentionValue: 0,
    differentiationValue: 0,
  };
}

/** Build a Video Studio opportunity from a feature (grounded in its route). */
export function buildVideoOpportunity(feature: FeatureRecord, now = new Date()): VideoOpportunity {
  const type = pickVideoType(feature);
  const page = primaryRoute(feature) ?? feature.adminControls[0] ?? '/';
  const sport = feature.sport && STUDIO_SPORTS.includes(feature.sport as StudioSport)
    ? (feature.sport as StudioSport)
    : 'all';
  const iso = now.toISOString();
  const confidence: VideoOpportunity['confidence'] =
    feature.confidence >= 75 ? 'high' : feature.confidence >= 50 ? 'medium' : 'low';
  return {
    id: `opp_${feature.id}`,
    surfaceId: feature.slug,
    page,
    zone: feature.name,
    recommendedType: type,
    businessRationale: `${feature.name}: ${feature.description}`,
    uxRationale: `Help users use ${feature.name} faster with a short, captioned walkthrough.`,
    signals: zeroSignals(),
    priorityScore: 60,
    confidenceScore: feature.confidence,
    confidence,
    estimatedImpact: `Could help users get value from ${feature.name} sooner.`,
    suggestedPlacement: 'inline',
    suggestedLengthSec: Math.max(20, Math.round(MAX_DURATION_BY_TYPE[type] * 0.7)),
    suggestedStyle: DEFAULT_STYLE_BY_TYPE[type],
    suggestedCta: 'See how it works',
    requiredAssets: [`Screen recording of ${page}`, 'VO/script', 'WebVTT captions', 'poster + thumbnail'],
    riskLevel: feature.category === 'security-privacy' || feature.category === 'monetization' ? 'medium' : 'low',
    requiresApproval: true,
    audience: mapStudioAudience(feature),
    sport,
    journeyStage: feature.audiences.includes('admin') ? 'onboard' : 'understand',
    status: 'approved',
    alreadyCovered: false,
    createdAt: iso,
    updatedAt: iso,
  };
}

/** Build the deterministic creative brief (delegates to Video Studio). */
export function buildVideoBrief(feature: FeatureRecord, now = new Date()): VideoCreativeBrief {
  return buildBrief(buildVideoOpportunity(feature, now), {}, 1, now);
}

export function generateVideoBrief(feature: FeatureRecord, ctx: GenContext = {}): EducationAsset {
  const now = ctx.now ?? new Date();
  const brief = buildVideoBrief(feature, now);
  return baseAsset(
    feature,
    'video-brief',
    'all',
    {
      title: `${feature.name} — video script`,
      summary: brief.objective,
      videoBriefId: brief.id,
      sections: [
        { heading: 'Objective', body: [brief.objective, whereToFind(feature)] },
        { heading: 'Script', body: brief.script },
        {
          heading: 'Storyboard',
          body: brief.storyboard.map(
            (s) => `${s.index}. (${s.durationSec}s) ${s.visual} — VO: "${s.voiceover}"`,
          ),
        },
        { heading: 'Captions & accessibility', body: brief.accessibilityRequirements },
        {
          heading: 'SEO & thumbnail',
          body: [brief.seo.title, brief.seo.description, `Thumbnail: ${brief.thumbnailConcept}`],
        },
      ],
    },
    ctx,
  );
}
