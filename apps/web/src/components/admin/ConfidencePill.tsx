// ConfidencePill — a compact, honest confidence label for interpreted
// summaries (the briefing exec summary, AI reads). Server-safe.

const TONE: Record<'low' | 'medium' | 'high', string> = {
  high: 'text-success-text',
  medium: 'text-warning-text',
  low: 'text-muted-foreground',
};

export function ConfidencePill({ level }: { level: 'low' | 'medium' | 'high' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium ${TONE[level]}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} confidence
    </span>
  );
}
