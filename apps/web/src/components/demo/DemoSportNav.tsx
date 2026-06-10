'use client';

// Sticky sport switcher + section sub-nav for the /demo experience.
// Lets a lead flip between all 7 sports' sample reports instantly, and
// jump between the Report / Profile / Training surfaces for each.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ALL_SPORTS_INCLUDING_GOLF } from '@swingiq/core';
import { slugForSport, sportForSlug, type DemoSportId } from '@/lib/demo/demoReport';

type Section = 'report' | 'profile' | 'training';

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'report', label: 'Report' },
  { id: 'profile', label: 'Profile' },
  { id: 'training', label: 'Training' },
];

function parsePath(pathname: string): { slug: string; section: Section } {
  // /demo/<slug>[/<section>]
  const parts = pathname.split('/').filter(Boolean); // ['demo', slug, section?]
  const slug = parts[1] ?? 'golf';
  const section = (parts[2] as Section) ?? 'report';
  return { slug, section };
}

function hrefFor(slug: string, section: Section): string {
  return section === 'report' ? `/demo/${slug}` : `/demo/${slug}/${section}`;
}

export function DemoSportNav({ accent }: { accent: string }) {
  const pathname = usePathname() ?? '';
  const { slug: activeSlug, section } = parsePath(pathname);
  const activeId = sportForSlug(activeSlug);

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4">
        {/* Sport switcher */}
        <div className="flex gap-1.5 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ALL_SPORTS_INCLUDING_GOLF.map((s) => {
            const id = s.id as DemoSportId;
            const slug = slugForSport(id);
            const isActive = id === activeId;
            return (
              <Link
                key={s.id}
                href={hrefFor(slug, section)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'text-background'
                    : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
                style={isActive ? { background: s.accent_hex, borderColor: s.accent_hex } : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-sm leading-none">{s.emoji}</span>
                {s.short_name ?? s.name}
              </Link>
            );
          })}
        </div>

        {/* Section sub-nav */}
        <div className="flex gap-4 pb-px">
          {SECTIONS.map((sec) => {
            const isActive = sec.id === section;
            return (
              <Link
                key={sec.id}
                href={hrefFor(activeSlug, sec.id)}
                className={`-mb-px border-b-2 px-1 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                style={isActive ? { borderColor: accent } : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {sec.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
