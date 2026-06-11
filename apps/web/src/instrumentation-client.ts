// ============================================================
// SwingVantage — Client instrumentation (Next.js native hook)
// ------------------------------------------------------------
// Runs once in the browser, before the app hydrates. Attaches global error +
// unhandled-rejection listeners that forward to the provider-agnostic reporter,
// so client crashes are captured the moment an observability sink (Sentry) is
// configured. No SDK dependency — a safe no-op until activated.
// See docs/OBSERVABILITY.md.
// ============================================================

import { reportError } from '@/lib/observability/report';
import { registerOperationalSink } from '@/lib/reliability-os/capture';

if (typeof window !== 'undefined') {
  // ReliabilityOS: install the operational sink BEFORE the listeners below so
  // reportError() routes failures into the local capture buffer (it chains to
  // any prior sink / Sentry, so real error reporting is preserved).
  registerOperationalSink();

  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, { kind: 'window.error' });
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { kind: 'unhandledrejection' });
  });
}
