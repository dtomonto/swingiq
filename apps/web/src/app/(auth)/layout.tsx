import type { Metadata } from 'next';

/**
 * Auth group (login / signup / forgot-password). These pages own their own
 * full-screen presentation, so the layout only adds shared metadata: auth
 * screens should never be indexed by search engines.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
