'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SportProvider } from '@/contexts/SportContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { TooltipProvider } from '@/components/ui/Tooltip';

// Deferred, non-critical UI. Both render `null` on the server and only appear
// after a client effect (cookie consent / PWA install prompt), and both are
// position:fixed — so loading them lazily, client-side only, keeps their code
// out of the global first-load JS bundle without any layout shift (CLS).
const CookieBanner = dynamic(
  () => import('@/components/ui/CookieBanner').then((m) => m.CookieBanner),
  { ssr: false },
);
const PWAInstallBanner = dynamic(
  () => import('@/components/ui/PWAInstallBanner').then((m) => m.PWAInstallBanner),
  { ssr: false },
);

// React Query Devtools are a development-only aid. Importing them statically
// pulls their chunk into the shared production bundle that every page downloads,
// so load them lazily and only when not in production.
const ReactQueryDevtools =
  process.env.NODE_ENV === 'production'
    ? (_props: { initialIsOpen?: boolean }) => null
    : dynamic(
        () =>
          import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
        { ssr: false },
      );

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SportProvider>
        <LanguageProvider>
          <TooltipProvider delayDuration={300}>
            <ThemeApplicator />
            {children}
            {/* FloatingCoach + UsageCategoryModal are app-only and now live in
                app/(app)/layout.tsx so they don't leak onto marketing pages. */}
            <CookieBanner />
            <PWAInstallBanner />
          </TooltipProvider>
        </LanguageProvider>
      </SportProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
