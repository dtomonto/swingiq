import Link from 'next/link';
import { THEMES } from '@/lib/theme/themes';

/**
 * Static, server-renderable showcase of the curated themes for marketing
 * surfaces (e.g. the homepage). Each tile renders a miniature "app card" from
 * the theme's registry swatches via inline styles — no store/client state, so
 * it looks identical regardless of the visitor's active theme. The live,
 * interactive picker lives in Settings (ThemeSelector).
 */
export function ThemePreviewStrip() {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {THEMES.map((theme) => {
          const { bg, surface, text, primary, accent } = theme.swatches;
          return (
            <div
              key={theme.id}
              className="rounded-xl border border-border overflow-hidden bg-card shadow-sm"
            >
              {/* Mini app preview rendered from static swatches */}
              <div className="relative p-3" style={{ backgroundColor: bg }}>
                {/* Atmospheric wash so each tile has depth, not just a flat fill */}
                <div
                  className="absolute inset-0"
                  aria-hidden="true"
                  style={{
                    background: `radial-gradient(120% 90% at 85% -12%, ${primary}, transparent 55%)`,
                    opacity: 0.14,
                  }}
                />
                <div
                  className="relative rounded-lg p-2.5 space-y-1.5 shadow-sm"
                  style={{ backgroundColor: surface }}
                >
                  {/* Header: brand dot + title + grade chip */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: primary }}
                    />
                    <span
                      className="h-1.5 flex-1 rounded-full"
                      style={{ backgroundColor: text, opacity: 0.8 }}
                    />
                    <span
                      className="inline-flex h-3.5 items-center rounded-full px-1.5 text-[7px] font-bold"
                      style={{ backgroundColor: accent, color: surface }}
                    >
                      A
                    </span>
                  </div>

                  {/* Body copy lines */}
                  <span
                    className="block h-1.5 w-3/4 rounded-full"
                    style={{ backgroundColor: text, opacity: 0.35 }}
                  />

                  {/* Mini chart */}
                  <div className="flex items-end gap-1 h-5">
                    <span
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: primary, height: '55%' }}
                    />
                    <span
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: accent, height: '90%' }}
                    />
                    <span
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: primary, opacity: 0.6, height: '40%' }}
                    />
                    <span
                      className="flex-1 rounded-sm"
                      style={{ backgroundColor: accent, opacity: 0.7, height: '70%' }}
                    />
                  </div>

                  {/* Footer: gradient CTA chip + accent dot */}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className="inline-flex h-4 items-center rounded-md px-2 text-[7px] font-bold"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primary}, ${accent})`,
                        color: surface,
                      }}
                    >
                      Analyze
                    </span>
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: accent }}
                    />
                  </div>
                </div>
              </div>
              <p className="px-3 py-2 text-xs font-semibold text-card-foreground truncate">
                {theme.name}
              </p>
            </div>
          );
        })}
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
