import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { updatePath } from '@/lib/updates/product-detail';
import type { Update } from '@/data/updates';

// ── Category → badge color mapping ───────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const CATEGORY_VARIANT: Partial<Record<string, BadgeVariant>> = {
  'New Feature': 'success',
  'Training Improvement': 'success',
  'Equipment': 'info',
  'Data & Insights': 'info',
  'Multi-Sport Expansion': 'warning',
  'Golf Training': 'success',
  'Tennis Training': 'warning',
  'Baseball Training': 'danger',
  'Softball Training': 'warning',
  'Video & Swing Comparison': 'info',
  'Progress Tracking': 'success',
  'Account & Data': 'default',
  'Mobile Experience': 'info',
  'Website': 'default',
  'SEO & Discoverability': 'default',
  'Security & Privacy': 'default',
  'Product Updates': 'default',
};

const SPORT_EMOJI: Partial<Record<string, string>> = {
  Golf: '⛳',
  Tennis: '🎾',
  Baseball: '⚾',
  'Slow Pitch Softball': '🥎',
  'Fast Pitch Softball': '🥎',
  'All Sports': '🏅',
};

// ── Component ─────────────────────────────────────────────────────────────

interface UpdateCardProps {
  update: Update;
  featured?: boolean;
  className?: string;
}

export function UpdateCard({ update, featured = false, className }: UpdateCardProps) {
  const categoryVariant = CATEGORY_VARIANT[update.category] ?? 'default';
  const sportEmoji = update.sport ? SPORT_EMOJI[update.sport] : undefined;

  return (
    <article
      className={cn(
        'bg-card rounded-xl border shadow-xs overflow-hidden',
        featured
          ? 'border-primary/40 ring-2 ring-primary/30'
          : 'border-border',
        update.isMajorMilestone && !featured && 'border-l-4 border-l-primary',
        className,
      )}
      aria-label={update.title}
    >
      <div className="p-5 sm:p-6">
        {/* Badges + date row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={categoryVariant}>{update.category}</Badge>
          {update.sport && (
            <Badge variant="default" className="bg-muted text-muted-foreground">
              {sportEmoji && <span className="mr-1">{sportEmoji}</span>}
              {update.sport}
            </Badge>
          )}
          {update.isMajorMilestone && (
            <Badge variant="success" className="bg-primary/10 text-primary border border-primary/30">
              Major milestone
            </Badge>
          )}
          {featured && (
            <Badge variant="success" className="bg-primary text-primary-foreground">
              Latest update
            </Badge>
          )}
          <time
            dateTime={update.releaseDate}
            className="ml-auto text-xs text-muted-foreground whitespace-nowrap"
          >
            {update.displayDate}
          </time>
        </div>

        {/* Title — links to the dedicated update report page */}
        <h3
          className={cn(
            'font-bold text-foreground mb-2 leading-snug',
            featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg',
          )}
        >
          <Link href={updatePath(update)} className="hover:text-primary transition-colors">
            {update.title}
          </Link>
        </h3>

        {/* Summary */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{update.summary}</p>

        {/* User benefit + why it matters */}
        {(update.userBenefit || update.whyItMatters) && (
          <div className="space-y-3 mb-4">
            {update.userBenefit && (
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  What this means for you
                </span>
                <p className="text-sm text-foreground mt-1">{update.userBenefit}</p>
              </div>
            )}
            {update.whyItMatters && (
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Why it matters
                </span>
                <p className="text-sm text-muted-foreground mt-1">{update.whyItMatters}</p>
              </div>
            )}
          </div>
        )}

        {/* Where to find + action required */}
        {(update.whereToFindIt || update.userActionRequired) && (
          <div className="border-t border-border pt-3 mt-3 space-y-1">
            {update.whereToFindIt && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Where to find it:</span>{' '}
                {update.whereToFindIt}
              </p>
            )}
            {update.userActionRequired && (
              <p className="text-xs text-accent-secondary bg-accent-secondary/10 rounded-sm px-2 py-1">
                <span className="font-medium">Action:</span> {update.userActionRequired}
              </p>
            )}
          </div>
        )}

        {/* Read full update → dedicated report page */}
        <div className="mt-4 pt-3 border-t border-border">
          <Link
            href={updatePath(update)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            aria-label={`Read the full update: ${update.title}`}
          >
            Read full update →
          </Link>
        </div>
      </div>
    </article>
  );
}
