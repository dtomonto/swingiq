'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { SportProvider } from '@/contexts/SportContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FloatingCoach } from '@/components/ui/FloatingCoach';

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
          {children}
          <FloatingCoach />
        </LanguageProvider>
      </SportProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
