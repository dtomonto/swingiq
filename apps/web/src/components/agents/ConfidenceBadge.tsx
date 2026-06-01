import { cn } from '@/lib/utils';
import type { AgentConfidence } from '@/lib/agents';

// Small, plain-language confidence chip. We show confidence to build
// trust — never raw model/technical metadata.

const STYLES: Record<AgentConfidence['level'], string> = {
  high: 'bg-primary/15 text-primary',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-muted text-muted-foreground',
};

const LABEL: Record<AgentConfidence['level'], string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Building confidence',
};

export function ConfidenceBadge({
  confidence,
  showReason = true,
  className,
}: {
  confidence: AgentConfidence;
  showReason?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs', className)}
      title={confidence.reason}
    >
      <span className={cn('px-2 py-0.5 rounded-full font-medium', STYLES[confidence.level])}>
        {LABEL[confidence.level]}
      </span>
      {showReason && confidence.reason && (
        <span className="text-muted-foreground">— {confidence.reason}</span>
      )}
    </span>
  );
}
