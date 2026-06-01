import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
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
        'bg-white rounded-xl border shadow-xs overflow-hidden',
        featured
          ? 'border-green-300 ring-2 ring-green-200'
          : 'border-gray-200',
        update.isMajorMilestone && !featured && 'border-l-4 border-l-green-500',
        className,
      )}
      aria-label={update.title}
    >
      <div className="p-5 sm:p-6">
        {/* Badges + date row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant={categoryVariant}>{update.category}</Badge>
          {update.sport && (
            <Badge variant="default" className="bg-gray-100 text-gray-600">
              {sportEmoji && <span className="mr-1">{sportEmoji}</span>}
              {update.sport}
            </Badge>
          )}
          {update.isMajorMilestone && (
            <Badge variant="success" className="bg-green-50 text-green-700 border border-green-200">
              Major milestone
            </Badge>
          )}
          {featured && (
            <Badge variant="success" className="bg-green-600 text-white">
              Latest update
            </Badge>
          )}
          <time
            dateTime={update.releaseDate}
            className="ml-auto text-xs text-gray-400 whitespace-nowrap"
          >
            {update.displayDate}
          </time>
        </div>

        {/* Title */}
        <h3
          className={cn(
            'font-bold text-gray-900 mb-2 leading-snug',
            featured ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg',
          )}
        >
          {update.title}
        </h3>

        {/* Summary */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{update.summary}</p>

        {/* User benefit + why it matters */}
        <div className="space-y-3 mb-4">
          <div>
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              What this means for you
            </span>
            <p className="text-sm text-gray-700 mt-1">{update.userBenefit}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Why it matters
            </span>
            <p className="text-sm text-gray-600 mt-1">{update.whyItMatters}</p>
          </div>
        </div>

        {/* Where to find + action required */}
        {(update.whereToFindIt || update.userActionRequired) && (
          <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
            {update.whereToFindIt && (
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Where to find it:</span>{' '}
                {update.whereToFindIt}
              </p>
            )}
            {update.userActionRequired && (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-sm px-2 py-1">
                <span className="font-medium">Action:</span> {update.userActionRequired}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
