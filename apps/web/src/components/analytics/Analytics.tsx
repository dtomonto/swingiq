import Script from 'next/script';
import { GA_ID } from '@/lib/analytics';

/**
 * Loads Google Analytics 4 only when NEXT_PUBLIC_GA_ID is set.
 * When unset (the default), this renders nothing — analytics calls
 * fall back to the dev console (see lib/analytics.ts). This keeps
 * the site fast and private by default.
 */
export function Analytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
