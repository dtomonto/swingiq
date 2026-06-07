'use client';

// ============================================================
// SwingVantage — Root error boundary (App Router)
// ------------------------------------------------------------
// Catches errors that escape every nested boundary. It (1) reports the error to
// observability (A2) and (2) shows an on-brand recovery screen instead of the
// bare Next.js error page. Because it replaces the root layout, styles are
// inlined so the recovery UI renders even if the stylesheet failed to load.
// ============================================================

import { useEffect } from 'react';
import { reportError } from '@/lib/observability/report';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { boundary: 'global-error', digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f6f5',
          fontFamily:
            'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          color: '#0f1a14',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: '#1a3a2a',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              SV
            </span>
            <span style={{ fontWeight: 700, fontSize: 20 }}>SwingVantage</span>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1px solid #e3e8e5',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#5b6b62', margin: '0 0 24px' }}>
              A temporary error interrupted this page. Your data is safe. Try again,
              or head back to the home page.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => reset()}
                style={{
                  background: '#1a3a2a',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '12px 24px',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  border: '1px solid #d7ded9',
                  color: '#0f1a14',
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '12px 24px',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                Go to SwingVantage Home
              </a>
            </div>
          </div>
          {error?.digest && (
            <p style={{ fontSize: 12, color: '#9aa8a0', marginTop: 16 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
