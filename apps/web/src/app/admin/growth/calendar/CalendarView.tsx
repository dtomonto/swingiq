'use client';

// ============================================================
// CalendarView — interactive month grid + list toggle
// Matches dark admin palette. date-fns v4 is used throughout.
// ============================================================

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight, LayoutGrid, List, CalendarDays, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { humanize, formatDate } from '@/lib/growth/format';
import { StatusBadge } from '../_components/ui';
import type { MarketingCalendarItem } from '@/lib/growth/types';

// ── Item type → color chip ────────────────────────────────────
const ITEM_TYPE_COLOR: Record<string, string> = {
  'campaign-launch':        'bg-green-600/80 text-green-100 border-green-500/40',
  'content-publish':        'bg-blue-600/80 text-blue-100 border-blue-500/40',
  'social-post':            'bg-purple-600/80 text-purple-100 border-purple-500/40',
  'product-launch':         'bg-amber-600/80 text-amber-100 border-amber-500/40',
  'feature-announcement':   'bg-cyan-600/80 text-cyan-100 border-cyan-500/40',
  'email-send':             'bg-teal-600/80 text-teal-100 border-teal-500/40',
  'paid-start':             'bg-rose-600/80 text-rose-100 border-rose-500/40',
  'webinar':                'bg-indigo-600/80 text-indigo-100 border-indigo-500/40',
  'partner-campaign':       'bg-lime-600/80 text-lime-100 border-lime-500/40',
  'seasonal':               'bg-orange-600/80 text-orange-100 border-orange-500/40',
  'experiment':             'bg-pink-600/80 text-pink-100 border-pink-500/40',
  'reporting':              'bg-gray-600/80 text-gray-200 border-gray-500/40',
  'compliance-review':      'bg-red-700/70 text-red-100 border-red-600/40',
};

function chipClass(itemType: string): string {
  return ITEM_TYPE_COLOR[itemType] ?? 'bg-gray-700/80 text-gray-200 border-gray-600/40';
}

// ── Weekday header labels ─────────────────────────────────────
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Helpers ───────────────────────────────────────────────────
function itemsOnDay(items: MarketingCalendarItem[], day: Date): MarketingCalendarItem[] {
  return items.filter((item) => isSameDay(parseISO(item.date), day));
}

function earliestItemMonth(items: MarketingCalendarItem[]): Date {
  if (items.length === 0) return new Date();
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  return startOfMonth(parseISO(sorted[0].date));
}

// ── Legend ────────────────────────────────────────────────────
const LEGEND_TYPES: Array<[string, string]> = [
  ['campaign-launch', 'Campaign launch'],
  ['content-publish', 'Content publish'],
  ['social-post', 'Social post'],
  ['product-launch', 'Product launch'],
  ['feature-announcement', 'Feature announcement'],
  ['email-send', 'Email send'],
  ['reporting', 'Reporting'],
];

// ── Day detail panel ──────────────────────────────────────────
function DayDetail({
  day,
  items,
  onClose,
}: {
  day: Date;
  items: MarketingCalendarItem[];
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-4 space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-200">
          {format(day, 'EEEE, MMMM d, yyyy')}
          <span className="ml-2 text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </p>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          aria-label="Close day panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-800/50 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">{item.name}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className={cn('text-[11px] px-1.5 py-0.5 rounded border font-medium', chipClass(item.itemType))}>
                  {humanize(item.itemType)}
                </span>
                <span className="text-[11px] text-gray-500">{item.channel}</span>
                {item.funnelStage && (
                  <span className="text-[11px] text-gray-600 capitalize">{item.funnelStage}</span>
                )}
              </div>
            </div>
            <div className="shrink-0 mt-0.5">
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Month grid ────────────────────────────────────────────────
function MonthGrid({
  month,
  items,
  selectedDay,
  onSelectDay,
}: {
  month: Date;
  items: MarketingCalendarItem[];
  selectedDay: Date | null;
  onSelectDay: (day: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-800 mb-1">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {wd}
            </div>
          ))}
        </div>

        {/* Day cells — chunked into rows */}
        <div className="grid grid-cols-7 gap-px bg-gray-800/30 rounded-lg overflow-hidden border border-gray-800">
          {days.map((day) => {
            const dayItems = itemsOnDay(items, day);
            const inMonth = isSameMonth(day, month);
            const todayFlag = isToday(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const CHIP_MAX = 2;
            const overflow = dayItems.length > CHIP_MAX ? dayItems.length - CHIP_MAX : 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDay(day)}
                className={cn(
                  'bg-gray-900 min-h-[88px] p-2 text-left transition-colors hover:bg-gray-800/60 focus:outline-none',
                  !inMonth && 'opacity-30',
                  isSelected && 'ring-1 ring-inset ring-green-500',
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                      todayFlag
                        ? 'bg-green-500 text-white'
                        : inMonth
                        ? 'text-gray-300'
                        : 'text-gray-600',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Item chips */}
                <div className="space-y-0.5">
                  {dayItems.slice(0, CHIP_MAX).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border truncate leading-tight font-medium',
                        chipClass(item.itemType),
                      )}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-gray-500 pl-0.5">+{overflow} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────
function ListView({ items }: { items: MarketingCalendarItem[] }) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/50 p-8 text-center">
        <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-300">No items scheduled</p>
        <p className="text-xs text-gray-500 mt-1">Add items to the calendar to see them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 hover:border-gray-700 transition-colors"
        >
          {/* Date block */}
          <div className="shrink-0 text-center w-14 pt-0.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">
              {format(parseISO(item.date), 'MMM')}
            </p>
            <p className="text-lg font-bold text-gray-200 leading-tight">
              {format(parseISO(item.date), 'd')}
            </p>
            <p className="text-[10px] text-gray-600">{format(parseISO(item.date), 'yyyy')}</p>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-gray-800 shrink-0" />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-200 truncate">{item.name}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className={cn('text-[11px] px-1.5 py-0.5 rounded border font-medium', chipClass(item.itemType))}>
                {humanize(item.itemType)}
              </span>
              <span className="text-[11px] text-gray-500">{item.channel}</span>
              {item.funnelStage && (
                <span className="text-[11px] text-gray-600 capitalize">{item.funnelStage}</span>
              )}
              {item.endDate && (
                <span className="text-[11px] text-gray-600">→ {formatDate(item.endDate)}</span>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="shrink-0 mt-0.5">
            <StatusBadge status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Legend strip ──────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
      {LEGEND_TYPES.map(([type, label]) => (
        <div key={type} className="flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-sm border', chipClass(type))} />
          <span className="text-[11px] text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function CalendarView({ items }: { items: MarketingCalendarItem[] }) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => earliestItemMonth(items));
  const [view, setView] = useState<'month' | 'list'>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const today = new Date();

  function goToToday() {
    setCurrentMonth(startOfMonth(today));
    setSelectedDay(today);
  }

  function handleSelectDay(day: Date) {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(day);
    }
  }

  const selectedDayItems = selectedDay ? itemsOnDay(items, selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="rounded-lg border border-gray-800 bg-gray-900 p-1.5 text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-200 w-36 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="rounded-lg border border-gray-800 bg-gray-900 p-1.5 text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="ml-1 text-xs px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900 text-gray-400 hover:text-gray-200 hover:border-gray-700 transition-colors"
          >
            Today
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1">
          <button
            onClick={() => setView('month')}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors',
              view === 'month'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-200',
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Month
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors',
              view === 'list'
                ? 'bg-gray-700 text-gray-100'
                : 'text-gray-400 hover:text-gray-200',
            )}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Legend (month view only) */}
      {view === 'month' && <Legend />}

      {/* Calendar body */}
      {view === 'month' ? (
        <>
          <MonthGrid
            month={currentMonth}
            items={items}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
          />
          {selectedDay && selectedDayItems.length > 0 && (
            <DayDetail
              day={selectedDay}
              items={selectedDayItems}
              onClose={() => setSelectedDay(null)}
            />
          )}
          {selectedDay && selectedDayItems.length === 0 && (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 text-center text-xs text-gray-500">
              No items on {format(selectedDay, 'MMMM d, yyyy')}. Click another day or{' '}
              <button
                className="text-green-400 hover:text-green-300 underline underline-offset-2"
                onClick={() => setSelectedDay(null)}
              >
                dismiss
              </button>
              .
            </div>
          )}
        </>
      ) : (
        <ListView items={items} />
      )}

      {/* Item count summary */}
      <p className="text-xs text-gray-600">
        {items.length} item{items.length !== 1 ? 's' : ''} across all channels
        {view === 'month' && ' — click any day to see its items'}
        {view === 'list' && ' — sorted ascending by date'}
      </p>
    </div>
  );
}
