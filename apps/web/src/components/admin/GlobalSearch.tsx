'use client';

// GlobalSearch — a command-palette over the nav model. Filters every
// admin section by label / blurb / keywords and navigates on select.
// Entity search (users, uploads, …) can be layered on in later waves.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS, type NavItem } from '@/lib/admin/nav';
import type { Permission } from '@/lib/admin/rbac';

export interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  /** Permission predicate so results respect the admin's role. */
  can: (p: Permission) => boolean;
}

function scoreItem(item: NavItem, q: string): number {
  const hay = [item.label, item.blurb, ...(item.keywords ?? [])].join(' ').toLowerCase();
  if (!q) return 0;
  if (item.label.toLowerCase().startsWith(q)) return 3;
  if (item.label.toLowerCase().includes(q)) return 2;
  if (hay.includes(q)) return 1;
  return -1;
}

export function GlobalSearch({ open, onClose, can }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = NAV_ITEMS.filter((i) => !i.permission || can(i.permission));
    if (!q) return visible;
    return visible
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [query, can]);

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    // Focus after paint.
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (item: NavItem) => {
    if (!item.built) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) go(item);
    }
  };

  const groupLabel = (id: string) => NAV_GROUPS.find((g) => g.id === id)?.label ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button aria-label="Dismiss search" className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-gray-800 px-3">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search admin sections…"
            className="w-full bg-transparent py-3 text-sm text-gray-100 outline-none placeholder:text-gray-600"
          />
          <kbd className="hidden rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 sm:block">esc</kbd>
        </div>

        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">No matching sections.</li>
          )}
          {results.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  disabled={!item.built}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm disabled:opacity-50 ${
                    i === active ? 'bg-gray-800' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-amber-400" />
                  <span className="min-w-0 flex-1">
                    <span className="text-gray-100">{item.label}</span>
                    <span className="ml-2 text-xs text-gray-600">{groupLabel(item.group)}</span>
                    <span className="block truncate text-xs text-gray-500">{item.blurb}</span>
                  </span>
                  {!item.built && <span className="text-[10px] text-gray-600">Soon</span>}
                  {i === active && item.built && <CornerDownLeft className="h-3 w-3 text-gray-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
