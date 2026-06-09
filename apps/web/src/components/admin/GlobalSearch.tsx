'use client';

// GlobalSearch — a command palette over BOTH the nav model (sections) and live
// records (users, swing analyses, milestones via /api/admin/search). Filters
// sections by label/blurb/keywords; fetches records on a debounce. Empty state
// shows recently-visited sections. Keyboard-navigable across all rows.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Clock, User, Film, Milestone, Loader2 } from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS, findNavItem, type NavItem } from '@/lib/admin/nav';
import { getRecent } from '@/lib/admin/nav-prefs';
import type { Permission } from '@/lib/admin/rbac';

export interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  can: (p: Permission) => boolean;
}

// Local mirror of the entity-search result shape (avoids importing the
// server-only module into this client bundle).
type EntityType = 'user' | 'analysis' | 'milestone';
interface EntityResult { type: EntityType; id: string; label: string; sublabel?: string; href: string }

const ENTITY_ICON: Record<EntityType, typeof User> = { user: User, analysis: Film, milestone: Milestone };

type Row =
  | { kind: 'nav'; item: NavItem }
  | { kind: 'entity'; entity: EntityResult };

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
  const [entities, setEntities] = useState<EntityResult[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Section results: filtered by query, or recent-visited when empty.
  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = NAV_ITEMS.filter((i) => !i.permission || can(i.permission));
    if (!q) {
      const recent = getRecent().map(findNavItem).filter((i): i is NavItem => !!i && (!i.permission || can(i.permission)));
      return recent.length > 0 ? recent : visible;
    }
    return visible
      .map((item) => ({ item, score: scoreItem(item, q) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [query, can]);

  const showRecent = query.trim() === '' && navResults.length > 0;

  // Combined, keyboard-navigable rows: sections then records.
  const rows: Row[] = useMemo(
    () => [
      ...navResults.map((item): Row => ({ kind: 'nav', item })),
      ...entities.map((entity): Row => ({ kind: 'entity', entity })),
    ],
    [navResults, entities],
  );

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setActive(0);
    setEntities([]);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActive(0), [query, entities]);

  // Debounced entity (record) search.
  useEffect(() => {
    if (!open) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setEntities([]);
      setEntityLoading(false);
      return undefined;
    }
    let cancelled = false;
    setEntityLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setEntities(Array.isArray(data.results) ? data.results : []);
      } catch {
        if (!cancelled) setEntities([]);
      } finally {
        if (!cancelled) setEntityLoading(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [open, query]);

  if (!open) return null;

  const goRow = (row: Row) => {
    if (row.kind === 'nav') {
      if (!row.item.built) return;
      onClose();
      router.push(row.item.href);
    } else {
      onClose();
      router.push(row.entity.href);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') return onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(rows.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = rows[active];
      if (row) goRow(row);
    }
  };

  const groupLabel = (id: string) => NAV_GROUPS.find((g) => g.id === id)?.label ?? '';
  const navCount = navResults.length;

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
            placeholder="Search sections, users, analyses, milestones…"
            className="w-full bg-transparent py-3 text-sm text-gray-100 outline-none placeholder:text-gray-600"
          />
          {entityLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-600" />}
          <kbd className="hidden rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 sm:block">esc</kbd>
        </div>

        <ul className="max-h-[55vh] overflow-y-auto py-1">
          {rows.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">No matches.</li>
          )}

          {navResults.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              {showRecent ? 'Recent' : 'Sections'}
            </li>
          )}
          {navResults.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={`nav-${item.id}`}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goRow({ kind: 'nav', item })}
                  disabled={!item.built}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm disabled:opacity-50 ${i === active ? 'bg-gray-800' : ''}`}
                >
                  {showRecent ? <Clock className="h-4 w-4 shrink-0 text-gray-500" /> : <Icon className="h-4 w-4 shrink-0 text-amber-400" />}
                  <span className="min-w-0 flex-1">
                    <span className="text-gray-100">{item.label}</span>
                    <span className="ml-2 text-xs text-gray-600">{groupLabel(item.group)}</span>
                    {!showRecent && <span className="block truncate text-xs text-gray-500">{item.blurb}</span>}
                  </span>
                  {!item.built && <span className="text-[10px] text-gray-600">Soon</span>}
                  {i === active && item.built && <CornerDownLeft className="h-3 w-3 text-gray-600" />}
                </button>
              </li>
            );
          })}

          {entities.length > 0 && (
            <li className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">Records</li>
          )}
          {entities.map((entity, j) => {
            const idx = navCount + j;
            const Icon = ENTITY_ICON[entity.type];
            return (
              <li key={`ent-${entity.type}-${entity.id}`}>
                <button
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => goRow({ kind: 'entity', entity })}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${idx === active ? 'bg-gray-800' : ''}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-sky-400" />
                  <span className="min-w-0 flex-1">
                    <span className="truncate text-gray-100">{entity.label}</span>
                    {entity.sublabel && <span className="block truncate text-xs text-gray-500">{entity.sublabel}</span>}
                  </span>
                  {idx === active && <CornerDownLeft className="h-3 w-3 text-gray-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
