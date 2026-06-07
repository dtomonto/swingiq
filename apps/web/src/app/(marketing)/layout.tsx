import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MarketingAutoLocale } from '@/components/marketing/MarketingAutoLocale';

/**
 * Shared chrome for the public marketing / SEO surface.
 *
 * Adds a persistent top navigation (previously absent — audit finding IA-3) and
 * the site footer to every public page. Individual pages now supply only their
 * content and no longer render their own <PublicFooter>.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingAutoLocale />
      <MarketingHeader />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  );
}
