import Link from 'next/link';
import { THEMES } from '@/lib/theme/themes';

/**
 * Static, server-renderable showcase of the curated themes for marketing
 * surfaces (e.g. the homepage). Renders each theme's palette from its
 * registry swatches via inline styles — no store/client state needed, so it
 * looks identical regardless of the visitor's active theme. The live,
 * interactive picker lives in Settings (ThemeSelector).
 */
export function ThemePreviewStrip() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {THEMES.map((theme) => (
          <div
            key={theme.id}
            className="rounded-xl border border-border overflow-hidden bg-card"
          >
            {/* Mini palette preview rendered from static swatches */}
            <div className="p-3" style={{ backgroundColor: theme.swatches.bg }}>
              <div
                className="rounded-md p-2.5 space-y-1.5 shadow-sm"
                style={{ backgroundColor: theme.swatches.surface }}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.swatches.primary }}
                  />
                  <span
                    className="h-1.5 flex-1 rounded-full"
                    style={{ backgroundColor: theme.swatches.text, opacity: 0.8 }}
                  />
                </div>
                <span
                  className="block h-1.5 w-2/3 rounded-full"
                  style={{ backgroundColor: theme.swatches.text, opacity: 0.35 }}
                />
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span
                    className="inline-flex h-4 items-center rounded px-2 text-[8px] font-bold"
                    style={{ backgroundColor: theme.swatches.primary, color: theme.swatches.surface }}
                  >
                    A
                  </span>
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: theme.swatches.accent }}
                  />
                </div>
              </div>
            </div>
            <p className="px-3 py-2 text-xs font-semibold text-card-foreground truncate">
              {theme.name}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Switch anytime in Settings.{' '}
        <Link href="/settings" className="font-semibold text-primary hover:underline">
          Browse themes →
        </Link>
      </p>
    </div>
  );
}
