import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  description?: string;
  className?: string;
}

const statusColors = {
  good: 'border-success/30 bg-success/10',
  warning: 'border-warning/30 bg-warning/10',
  danger: 'border-error/30 bg-error/10',
  neutral: 'border-border bg-card',
};

export function MetricCard({
  label,
  value,
  unit,
  target,
  trend,
  trendLabel,
  status = 'neutral',
  description,
  className,
}: MetricCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        statusColors[status],
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>}
      </div>
      {target && (
        <p className="text-xs text-muted-foreground">Target: {target}</p>
      )}
      {(trend || trendLabel) && (
        <div className={cn('flex items-center gap-1 mt-1.5', trendColor)}>
          <TrendIcon size={12} />
          {trendLabel && <span className="text-xs">{trendLabel}</span>}
        </div>
      )}
      {description && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
