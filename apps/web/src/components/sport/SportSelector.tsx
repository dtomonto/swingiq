'use client';

// ============================================================
// SwingVantage — Sport Selector
// Dropdown/grid component to pick the active sport.
// Used in the sidebar and the video analyzer step.
// ============================================================

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSport } from '@/contexts/SportContext';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import type { SportId } from '@swingiq/core';

// ── Inline card grid (used inside video analyzer + intake) ────
//
// Two modes:
//   • Single-select — pass `selectedSport` + `onSelect`.
//   • Multi-select  — pass `selectedSports` (array) + `onToggle`.
// Multi mode renders the cards as toggles so an athlete can pick
// every sport they play during intake.

interface SportCardGridProps {
  /** Single-select: the currently chosen sport. */
  selectedSport?: SportId;
  /** Single-select handler. */
  onSelect?: (id: SportId) => void;
  /** Multi-select: the set of chosen sports. When provided, the grid
   *  switches to multi-select (toggle) mode. */
  selectedSports?: SportId[];
  /** Multi-select toggle handler. */
  onToggle?: (id: SportId) => void;
  className?: string;
}

export function SportCardGrid({
  selectedSport,
  onSelect,
  selectedSports,
  onToggle,
  className,
}: SportCardGridProps) {
  const multiple = Array.isArray(selectedSports);

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}>
      {ALL_SPORTS_INCLUDING_GOLF.map((sport) => {
        const id = sport.id as SportId;
        const isActive = multiple ? selectedSports!.includes(id) : selectedSport === id;
        return (
          <button
            key={sport.id}
            type="button"
            aria-pressed={multiple ? isActive : undefined}
            onClick={() => (multiple ? onToggle?.(id) : onSelect?.(id))}
            className={cn(
              'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
              isActive
                ? 'border-golf-fairway bg-golf-fairway/10 shadow-xs'
                : 'border-border hover:border-border hover:bg-muted',
            )}
          >
            <span className="text-2xl">{sport.emoji}</span>
            <span
              className={cn(
                'text-xs font-semibold leading-tight',
                isActive ? 'text-golf-fairway' : 'text-foreground',
              )}
            >
              {sport.short_name}
            </span>
            {isActive && (
              <Check
                className={cn(
                  'w-3 h-3 text-golf-fairway',
                  multiple && 'absolute top-1.5 right-1.5',
                )}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Compact inline pill (used in the sidebar) ────────────────

interface SportPillDropdownProps {
  className?: string;
  onClose?: () => void;
}

export function SportPillDropdown({ className, onClose }: SportPillDropdownProps) {
  const { activeSport, setActiveSport, selectedSports } = useSport();
  const [open, setOpen] = useState(false);

  const current = ALL_SPORTS_INCLUDING_GOLF.find((s) => s.id === activeSport);

  // Group: the athlete's chosen sports first, then any they could add.
  const yourSports = ALL_SPORTS_INCLUDING_GOLF.filter((s) =>
    selectedSports.includes(s.id as SportId),
  );
  const otherSports = ALL_SPORTS_INCLUDING_GOLF.filter(
    (s) => !selectedSports.includes(s.id as SportId),
  );

  const handleSelect = (id: SportId) => {
    setActiveSport(id); // also adds to the tracked set if it wasn't already
    setOpen(false);
    onClose?.();
  };

  const renderRow = (sport: (typeof ALL_SPORTS_INCLUDING_GOLF)[number]) => {
    const isActive = activeSport === sport.id;
    return (
      <button
        key={sport.id}
        type="button"
        onClick={() => handleSelect(sport.id as SportId)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
          isActive
            ? 'bg-primary text-white font-semibold'
            : 'text-primary-foreground/90 hover:bg-primary hover:text-white',
        )}
      >
        <span className="text-base">{sport.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium">{sport.name}</div>
          <div className="text-xs text-primary-foreground/90 truncate">{sport.tagline}</div>
        </div>
        {isActive && <Check size={14} className="text-primary-foreground/80 shrink-0" />}
      </button>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/50 hover:bg-primary transition-colors text-sm font-medium text-primary-foreground/90"
      >
        <span className="text-base leading-none">{current?.emoji}</span>
        <span className="flex-1 text-left truncate">{current?.name}</span>
        <ChevronDown
          size={14}
          className={cn('text-primary-foreground/80 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-secondary border border-border rounded-xl shadow-xl overflow-hidden">
            {selectedSports.length > 0 && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground/70">
                Your sports
              </p>
            )}
            {yourSports.map(renderRow)}

            {otherSports.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground/70 border-t border-border/50">
                  Add a sport
                </p>
                {otherSports.map(renderRow)}
              </>
            )}

            <div className="px-3 py-2 border-t border-border/50">
              <p className="text-xs text-primary">
                Tap any sport to switch. Add as many as you play — your data is kept per sport.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
