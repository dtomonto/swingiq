// ============================================================
// SwingIQ — Workflow: Pro Upgrade Recommendation
// ------------------------------------------------------------
// Suggests upgrading ONLY when a Pro feature would clearly help.
// Contextual, non-pushy, no dark patterns. Most of the time this
// returns showUpgradePrompt: false.
// ============================================================

import type { AgentContext, UpgradeSuggestion } from '../types';

export function buildProUpgradeSuggestion(ctx: AgentContext): UpgradeSuggestion {
  // Deep history → cloud sync / longer progress history is genuinely useful.
  if (ctx.sessionCount >= 5) {
    return {
      upgradeReason: 'You have built up real history worth protecting and analyzing over time.',
      relevantFeature: 'Keep your full history with cloud backup',
      userBenefit:
        'With several sessions logged, Pro keeps your data backed up and unlocks deeper long-term progress trends.',
      showUpgradePrompt: true,
    };
  }

  // Coach/parent context → coach reports are the relevant benefit.
  if ((ctx.usageCategory === 'coach' || ctx.usageCategory === 'parent_guardian') && ctx.sessionCount >= 3) {
    return {
      upgradeReason: 'You are tracking an athlete, where shareable coach reports add the most value.',
      relevantFeature: 'Share polished coach reports',
      userBenefit: 'Pro generates clean, shareable progress reports for coaches and parents.',
      showUpgradePrompt: true,
    };
  }

  return {
    upgradeReason: '',
    relevantFeature: '',
    userBenefit: '',
    showUpgradePrompt: false,
  };
}
