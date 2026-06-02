import { AppShell } from '@/components/layout/AppShell';
import { FloatingCoach } from '@/components/ui/FloatingCoach';
import { UsageCategoryModal } from '@/components/ui/UsageCategoryModal';

/**
 * Shared shell for the authenticated product surface.
 *
 * Renders the sidebar / app chrome (AppShell) exactly once for every route in
 * the (app) group, plus the app-only floating widgets. Previously AppShell was
 * imported and wrapped manually in ~35 individual pages (audit finding AA-1) and
 * the floating widgets lived in the global Providers and leaked onto marketing
 * pages (AA-3). Both now live here, scoped to the product surface only.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <FloatingCoach />
      <UsageCategoryModal />
    </>
  );
}
