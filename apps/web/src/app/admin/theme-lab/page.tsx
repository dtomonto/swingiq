// ============================================================
// /admin/theme-lab — Theme Lab operator console (#3)
// Operate the live theme resolution: pin/kill a theme, opt into seasonal,
// and inspect the registry + what resolveThemeForUser() would return.
// ============================================================

import type { Metadata } from 'next';
import { Palette } from 'lucide-react';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { ThemeLabClient } from './ThemeLabClient';

export const metadata: Metadata = { title: 'Theme Lab | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminThemeLabPage() {
  const user = await getAuthenticatedUser();
  const actor = user?.email ?? 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Theme Lab"
        icon={Palette}
        description="Govern the live theme. Pin every visitor to one theme (an emergency kill-switch for a broken theme), opt into seasonal themes, and see exactly which theme the resolver returns and why."
      />

      <SectionCard
        title="Honest note"
        description="A pin set here is saved on THIS device (an operator override) and takes effect immediately for this browser. The cross-device, all-visitor pin is the NEXT_PUBLIC_THEME_LAB_FORCE build env (shown below) — a device pin overrides it for you. Themes change appearance only; coaching, data, and scores never change."
      >
        <ThemeLabClient actor={actor} />
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">Resolution order.</strong> Operator pin → direct
          assignment → experiment → the visitor&apos;s saved preference → segment default → seasonal
          (when opted in) → the global default. The first <em>active</em> theme wins; a retired or
          unknown theme is skipped.
        </p>
        <p>
          <strong className="text-foreground">Kill-switch.</strong> If a theme ships broken, pin
          everyone to the default here while you fix it — no deploy required for your device, or set
          the env pin for every visitor.
        </p>
        <p>
          <strong className="text-foreground">Seasonal.</strong> Seasonal themes only appear when a
          visitor opts in <em>and</em> today falls inside the theme&apos;s window. None are
          registered yet, so the toggle is a no-op until one ships.
        </p>
      </HelpPanel>
    </div>
  );
}
