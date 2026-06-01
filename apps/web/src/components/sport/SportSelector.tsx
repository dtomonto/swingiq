'use client';

// ============================================================
// SwingIQ — Sport Selector
// Dropdown/grid component to pick the active sport.
// Used in the sidebar and the video analyzer step.
// ============================================================

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSport } from '@/contexts/SportContext';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import type { SportId } from '@swingiq/core';

// ── Inline card grid (used inside video analyzer) ────────────

interface SportCardGridProps {
  selectedSport?: SportId;
  onSelect: (id: SportId) => void;
  className?: string;
}

export function SportCardGrid({ selectedSport, onSelect, className }: SportCardGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3', className)}>
      {ALL_SPORTS_INCLUDING_GOLF.map((sport) => {
        const isActive = selectedSport === sport.id;
        return (
          <button
            key={sport.id}
            type="button"
            onClick={() => onSelect(sport.id as SportId)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
              isActive
                ? 'border-golf-fairway bg-golf-fairway/10 shadow-xs'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            <span className="text-2xl">{sport.emoji}</span>
            <span
              className={cn(
                'text-xs font-semibold leading-tight',
                isActive ? 'text-golf-fairway' : 'text-gray-700',
              )}
            >
              {sport.short_name}
            </span>
            {isActive && <Check className="w-3 h-3 text-golf-fairway" />}
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
  const { activeSport, setActiveSport } = useSport();
  const [open, setOpen] = useState(false);

  const current = ALL_SPORTS_INCLUDING_GOLF.find((s) => s.id === activeSport);

  const handleSelect = (id: SportId) => {
    setActiveSport(id);
    setOpen(false);
    onClose?.();
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-green-800/50 hover:bg-green-800 transition-colors text-sm font-medium text-green-100"
      >
        <span className="text-base leading-none">{current?.emoji}</span>
        <span className="flex-1 text-left truncate">{current?.name}</span>
        <ChevronDown
          size={14}
          className={cn('text-green-300 transition-transform', open && 'rotate-180')}
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
          <div className="absolute bottom-full left-0 right-0 mb-1 z-20 bg-gray-900 border border-green-800 rounded-xl shadow-xl overflow-hidden">
            {ALL_SPORTS_INCLUDING_GOLF.map((sport) => {
              const isActive = activeSport === sport.id;
              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => handleSelect(sport.id as SportId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left',
                    isActive
                      ? 'bg-green-700 text-white font-semibold'
                      : 'text-green-200 hover:bg-green-800 hover:text-white',
                  )}
                >
                  <span className="text-base">{sport.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{sport.name}</div>
                    <div className="text-xs text-green-400 truncate">{sport.tagline}</div>
                  </div>
                  {isActive && <Check size={14} className="text-green-300 shrink-0" />}
                </button>
              );
            })}
            <div className="px-3 py-2 border-t border-green-800/50">
              <p className="text-xs text-green-500">
                Select your sport to get tailored swing coaching.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
