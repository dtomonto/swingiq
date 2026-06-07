// ============================================================
// SwingVantage — Video Studio: Creative Brief Generator
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Given an approved opportunity, this writes the full creative brief a
//   video needs: objective, audience, the script, a scene-by-scene
//   storyboard, the voiceover, on-screen text, captions, a thumbnail
//   idea, the CTA, SEO + answer-engine summaries, accessibility needs,
//   and compliance notes.
//
//   It is DETERMINISTIC — same opportunity in, same brief out — so it
//   works with zero API keys and is fully testable. Every script is run
//   through the brand guardrails (brand.ts `vetClaims`) so it can't ship
//   a guarantee, a medical claim, or "never leaves your device".
//
//   `enhanceBrief()` is an OPTIONAL async seam: when an AI text provider
//   is configured it can re-word the script for polish, but it always
//   falls back to the deterministic brief — it never blocks or fabricates.
// ============================================================

import {
  type VideoOpportunity,
  type VideoCreativeBrief,
  type StoryboardScene,
  type VideoStyle,
  type AspectRatio,
  type StudioSport,
} from './types';
import {
  BRAND_VOICE,
  COMPLIANCE_NOTES,
  ACCESSIBILITY_DEFAULTS,
  SPORT_LANGUAGE,
  MAX_DURATION_BY_TYPE,
  vetClaims,
} from './brand';

export interface BriefOverrides {
  durationTargetSec?: number;
  aspectRatio?: AspectRatio;
  visualStyle?: VideoStyle;
  cta?: string;
}

/** Pick an aspect ratio: vertical for short/empty/tooltip, else 16:9. */
function defaultAspect(type: VideoOpportunity['recommendedType']): AspectRatio {
  if (type === 'contextual_tooltip' || type === 're_engagement' || type === 'empty_state') {
    return '9:16';
  }
  return '16:9';
}

function audienceLabel(audience: VideoOpportunity['audience']): string {
  switch (audience) {
    case 'athlete':
      return 'a player working on their own game';
    case 'parent':
      return 'a parent helping a young athlete';
    case 'coach':
      return 'a coach working with athletes';
    case 'team':
      return 'a team or program evaluating SwingVantage';
    default:
      return 'players, parents, and coaches';
  }
}

function sportCue(sport: StudioSport | 'all'): string {
  if (sport === 'all') return 'your swing';
  const lang = SPORT_LANGUAGE[sport];
  return `your ${sport.replace('_', '-')} swing (watch the ${lang.cues[2]})`;
}

/**
 * Per-type narration. Returns plain, on-brand lines. Sport-specific videos
 * weave in the right cues/terms. Kept short and concrete (reading grade ~7).
 */
function scriptFor(opp: VideoOpportunity): string[] {
  const who = audienceLabel(opp.audience);
  switch (opp.recommendedType) {
    case 'hero_explainer':
      return [
        'Meet SwingVantage — your personal performance system for golf, tennis, baseball, and softball.',
        'Record a swing, and you get a clear read on what to work on, with how confident we are.',
        'Turn that into a few focused drills, then track real improvement over time.',
        'Your data is tied to your private account and synced across your devices.',
        'Start free — no credit card, no pressure.',
      ];
    case 'onboarding_walkthrough':
      return [
        `Welcome! In two minutes we'll get ${who} a first personalized result.`,
        'Pick the sport you play — you can add more and switch anytime.',
        'Tell us who this is for, so the tone and safety reminders fit.',
        'Choose how to start: a couple of quick questions, a video, or import data.',
        "You'll land on your Today dashboard with one clear next step.",
      ];
    case 'product_tour':
      return [
        'Here is how SwingVantage works, end to end.',
        'Analyze: upload a swing or your data and get plain-language feedback.',
        'Learn: see your top issue, ranked by confidence, with what it means.',
        'Practice: turn it into focused drills you can actually do.',
        'Track: watch your trends and prove the change worked.',
      ];
    case 'feature_tutorial':
      return [
        `${opp.businessRationale}`,
        'Follow along on screen — each step is quick and shown in order.',
        opp.page === '/video'
          ? 'Film steady, keep the whole body in frame, and use down-the-line or face-on.'
          : 'Use the highlighted controls to complete the step.',
        'When you finish, your result is saved so you can compare later.',
        opp.suggestedCta,
      ];
    case 'results_explainer':
      return [
        'Let’s read your analysis together.',
        'Each finding comes with a confidence level, so you know what to trust first.',
        'Visual conclusions are a smart starting point — an estimate, not a measurement.',
        'A coach can confirm what the analysis suggests when you’re ready.',
        'Jump straight to the drills that target what we found.',
      ];
    case 'error_resolution':
      return [
        'Hit a snag on upload? This fixes the common ones fast.',
        'Check the angle: down-the-line or face-on, whole body in frame.',
        'Trim very long clips and make sure the lighting is even.',
        'Still stuck? Try a smaller file or switch cameras.',
        'Then re-upload — you’re one step from your result.',
      ];
    case 'empty_state':
      return [
        opp.page === '/drills'
          ? 'No drills yet? Here’s how to turn your top fix into a plan.'
          : 'Nothing here yet — here’s what this screen will show you.',
        'Add your first session or analysis to unlock it.',
        'Then this page fills with your personalized view.',
        opp.suggestedCta,
      ];
    case 'trust_safety':
      return [
        'Here’s exactly how SwingVantage treats your data.',
        'Your information is tied to your private account and synced across your devices.',
        'You choose what, if anything, is ever shared with the community.',
        'Youth athletes get extra privacy protections automatically.',
        'You can export or delete your data anytime.',
      ];
    case 'conversion_upgrade':
      return [
        'The core swing analysis is free — always.',
        'Upgrading adds deeper tools for players who want more.',
        'We never promise a specific score — just sharper, more specific guidance.',
        'Try the free version first and upgrade only if it earns it.',
        opp.suggestedCta,
      ];
    case 're_engagement':
      return [
        'Welcome back — your progress is right where you left it.',
        'Here’s the one thing worth doing in your next session.',
        'Small, consistent reps are what move the needle.',
        opp.suggestedCta,
      ];
    case 'sport_instructional': {
      const sport = opp.sport === 'all' ? 'golf' : opp.sport;
      const lang = SPORT_LANGUAGE[sport];
      return [
        `Let’s work a key drill you can do at ${lang.surface}.`,
        `Set up and feel the ${lang.cues[0]} — keep it relaxed.`,
        `Move through ${lang.cues[1]} to ${lang.cues[2]}, smooth and balanced.`,
        `Finish under control: ${lang.cues[3]}.`,
        'Stop if you feel any pain — comfort first, reps second.',
      ];
    }
    case 'comparison':
      return [
        'How does SwingVantage compare? Here’s the honest version.',
        'You get AI-assisted analysis across five sports, in your browser.',
        'Findings are explained in plain language, with confidence levels.',
        'No special hardware required to get started.',
        opp.suggestedCta,
      ];
    case 'contextual_tooltip':
      return [
        `Quick tip for this screen: ${opp.businessRationale}`,
        'Tap the highlighted control to try it.',
        'That’s it — you’re set.',
      ];
    case 'help_center':
      return [
        `${opp.businessRationale}`,
        'Here are the steps, start to finish.',
        'Follow each one on screen — it only takes a minute.',
        opp.suggestedCta,
      ];
    case 'admin_training':
      return [
        'Internal training: how to operate this tool.',
        'We’ll cover the core workflow and the guardrails.',
        'Follow the steps; pause anytime.',
        'Questions go to the team channel.',
      ];
    default:
      return [
        `${opp.businessRationale}`,
        'Follow the steps on screen.',
        opp.suggestedCta,
      ];
  }
}

/** Split a script into evenly-timed storyboard scenes summing to the target. */
function buildStoryboard(
  script: string[],
  totalSec: number,
  page: string,
): StoryboardScene[] {
  const n = Math.max(1, script.length);
  const per = Math.max(2, Math.floor(totalSec / n));
  let used = 0;
  return script.map((line, i) => {
    const isLast = i === script.length - 1;
    const durationSec = isLast ? Math.max(2, totalSec - used) : per;
    used += durationSec;
    return {
      index: i + 1,
      durationSec,
      visual:
        i === 0
          ? `Open on ${page} with a clean title card.`
          : isLast
            ? 'End card with the CTA and logo.'
            : `Screen of ${page} highlighting the relevant control; subtle motion.`,
      voiceover: line,
      onScreenText: i === 0 ? undefined : line.length > 64 ? line.slice(0, 61) + '…' : line,
    };
  });
}

function seoFor(opp: VideoOpportunity): VideoCreativeBrief['seo'] {
  const sportWord = opp.sport === 'all' ? 'swing' : opp.sport.replace('_', '-');
  const base = ['swing analysis', 'AI swing coach', `${sportWord} tips`, 'SwingVantage'];
  const titleMap: Partial<Record<VideoOpportunity['recommendedType'], string>> = {
    hero_explainer: 'What is SwingVantage? AI swing analysis in 60 seconds',
    sport_instructional: `${sportWord} drill: a quick, correct walkthrough`,
    trust_safety: 'How SwingVantage protects your data',
    conversion_upgrade: 'SwingVantage free vs Pro — what you get',
    comparison: 'SwingVantage compared: honest AI swing analysis',
    product_tour: 'How SwingVantage works: analyze, learn, practice, track',
  };
  return {
    title: titleMap[opp.recommendedType] ?? `${opp.businessRationale.split(':')[0]} — quick guide`,
    description: opp.estimatedImpact,
    keywords: base,
  };
}

/**
 * Build a complete, deterministic creative brief for an opportunity.
 * `version` lets the reassessment engine create v2, v3, … briefs.
 */
export function buildBrief(
  opp: VideoOpportunity,
  overrides: BriefOverrides = {},
  version = 1,
  now: Date = new Date(),
): VideoCreativeBrief {
  const visualStyle = overrides.visualStyle ?? opp.suggestedStyle;
  const aspectRatio = overrides.aspectRatio ?? defaultAspect(opp.recommendedType);
  const durationTargetSec = Math.min(
    overrides.durationTargetSec ?? opp.suggestedLengthSec,
    MAX_DURATION_BY_TYPE[opp.recommendedType],
  );
  const cta = overrides.cta ?? opp.suggestedCta;

  const script = scriptFor(opp);
  const storyboard = buildStoryboard(script, durationTargetSec, opp.page);

  // Brand guardrails: collect warnings, attach to compliance notes.
  const findings = vetClaims(script);
  const guardrailNotes = findings.map(
    (f) => `[${f.severity}] "${f.line}" — ${f.reason} ${f.suggestion}`,
  );

  return {
    id: `brief_${opp.id}_v${version}`,
    opportunityId: opp.id,
    version,
    objective: `Help ${audienceLabel(opp.audience)} ${opp.estimatedImpact.toLowerCase().replace(/^could /, '')}`,
    targetUser: audienceLabel(opp.audience),
    userPainPoint: opp.uxRationale,
    desiredOutcome: opp.estimatedImpact,
    keyMessage: opp.businessRationale.split(':').slice(1).join(':').trim() || opp.businessRationale,
    pageContext: `${opp.page} — ${opp.zone}`,
    script,
    storyboard,
    voiceover: script.join(' '),
    onScreenText: storyboard.map((s) => s.onScreenText ?? '').filter(Boolean),
    captions: script,
    thumbnailConcept: `Bold ${visualStyle.replace('_', ' ')} frame for "${opp.businessRationale.split(':')[0]}" — ${sportCue(opp.sport)}, high-contrast title, SwingVantage mark.`,
    cta,
    visualStyle,
    durationTargetSec,
    aspectRatio,
    platformUseCase: `${opp.suggestedPlacement} on ${opp.page} (${opp.journeyStage} stage)`,
    accessibilityRequirements: ACCESSIBILITY_DEFAULTS,
    seo: seoFor(opp),
    aeoSummary: `${opp.businessRationale} ${opp.estimatedImpact} Built for ${audienceLabel(opp.audience)}.`,
    versionNotes:
      version === 1 ? 'Initial deterministic brief.' : `Revision v${version} from reassessment.`,
    complianceNotes: [...(COMPLIANCE_NOTES[opp.recommendedType] ?? []), ...guardrailNotes],
    createdAt: now.toISOString(),
  };
}

/**
 * OPTIONAL polish: when an AI text provider is configured, an integrator can
 * re-word the script here for extra shine. This default implementation is a
 * safe no-op that returns the deterministic brief unchanged — wire a real
 * provider behind `aiConfigured(process.env)` to enable it. It must always
 * preserve meaning and re-run `vetClaims` before returning.
 */
export async function enhanceBrief(brief: VideoCreativeBrief): Promise<VideoCreativeBrief> {
  // No provider call here by design (honest default). See docs/VIDEO_STUDIO.md
  // → "Adding a real script/LLM enhancer". Returning the input keeps behaviour
  // deterministic and key-free.
  void BRAND_VOICE; // referenced so the brand voice is the contract an enhancer must honor
  return brief;
}
