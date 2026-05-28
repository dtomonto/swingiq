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
  good: 'border-green-200 bg-green-50',
  warning: 'border-yellow-200 bg-yellow-50',
  danger: 'border-red-200 bg-red-50',
  neutral: 'border-gray-200 bg-white',
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
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors',
        statusColors[status],
        className,
      )}
    >
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-end gap-1.5 mb-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {unit && <span className="text-sm text-gray-500 mb-0.5">{unit}</span>}
      </div>
      {target && (
        <p className="text-xs text-gray-500">Target: {target}</p>
      )}
      {(trend || trendLabel) && (
        <div className={cn('flex items-center gap-1 mt-1.5', trendColor)}>
          <TrendIcon size={12} />
          {trendLabel && <span className="text-xs">{trendLabel}</span>}
        </div>
      )}
      {description && (
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{description}</p>
      )}
    </div>
  );
}
