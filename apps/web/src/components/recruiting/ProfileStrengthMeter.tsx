'use client';

// ============================================================
// Recruiting — ProfileStrengthMeter
// ------------------------------------------------------------
// Shows the profile-strength tier + score and the highest-leverage
// next steps. Credibility notes (e.g. self-reported cap) surface
// honestly so the athlete knows verification is what unlocks "Strong".
// ============================================================

import { TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import {
  type ProfileStrength,
  type StrengthTier,
  STRENGTH_TIER_LABEL,
} from '@/lib/recruiting';

const TIER_VARIANT: Record<StrengthTier, 'default' | 'info' | 'warning' | 'success'> = {
  incomplete: 'default',
  basic: 'default',
  recruitable: 'info',
  strong: 'success',
  elite: 'success',
};

const TIER_COLOR: Record<StrengthTier, string> = {
  incomplete: 'bg-muted-foreground',
  basic: 'bg-accent-secondary',
  recruitable: 'bg-accent-secondary',
  strong: 'bg-success',
  elite: 'bg-success',
};

export function ProfileStrengthMeter({
  strength,
  compact = false,
}: {
  strength: ProfileStrength;
  compact?: boolean;
}) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">Profile strength</h3>
          </div>
          <Badge variant={TIER_VARIANT[strength.tier]}>{STRENGTH_TIER_LABEL[strength.tier]}</Badge>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{strength.score}/100</span>
            <span>{strength.checks.filter((c) => c.met).length}/{strength.checks.length} sections</span>
          </div>
          <Progress
            value={strength.score}
            className="h-2.5"
            indicatorClassName={TIER_COLOR[strength.tier]}
            aria-label="Profile strength"
          />
        </div>

        {strength.notes.map((n) => (
          <p key={n} className="text-xs text-warning-text bg-warning/10 rounded-md px-2.5 py-1.5">{n}</p>
        ))}

        {!compact && strength.recommendations.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Do next</p>
            {strength.recommendations.map((r) => (
              <div key={r} className="flex items-start gap-1.5 text-sm text-foreground/80">
                <ChevronRight size={15} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
