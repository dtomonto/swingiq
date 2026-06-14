import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@swingiq/core'],
  // React Compiler (stable, top-level in Next 16). Auto-memoizes components and
  // hooks so we don't hand-write useMemo/useCallback. Default `infer` mode only
  // compiles things that follow the Rules of React and safely bails out (no
  // miscompilation) on anything it can't prove safe — so the remaining
  // react-hooks/* lint warnings don't block it; they just mark un-optimized spots.
  // Requires babel-plugin-react-compiler (devDependency).
  reactCompiler: true,
  // Pin the workspace root to the monorepo root (apps/web → ../..). Without this,
  // Next auto-detected a stray lockfile in the home directory and traced the
  // entire project into the serverless output, bloating function size and
  // slowing cold starts. Resolved relative to this file so it works in CI too.
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
  experimental: {
    // Barrel-import packages used across the app. optimizePackageImports rewrites
    // `import { X } from 'pkg'` to deep per-export imports so unused members are
    // tree-shaken out of the shared first-load JS (faster FCP/LCP on every page).
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
    ],
  },

  // Never ship source maps to production browsers
  productionBrowserSourceMaps: false,

  // URL redirects — preserve old paths after the IA restructure (audit IA-5/IA-6)
  async redirects() {
    return [
      // Resolve the /report vs /reports singular/plural collision (IA-6)
      { source: '/report/sample', destination: '/sample-report', permanent: true },
      // Equipment unified under /equipment/[sport]; golf was the odd-one-out at /bag (IA-5)
      { source: '/bag', destination: '/equipment/golf', permanent: true },
      // Bare sport hubs have no index page (only children like /golf/fix-slice exist),
      // but robots.txt historically advertised them, so Googlebot fetched them and got a
      // hard 404 ("Not found" in Search Console). 301 each to its real analysis hub so the
      // URL resolves and any link equity is preserved. These run before the middleware.
      { source: '/golf', destination: '/golf-swing-analysis', permanent: true },
      { source: '/tennis', destination: '/tennis-swing-analysis', permanent: true },
      { source: '/baseball', destination: '/baseball-swing-analysis', permanent: true },
      { source: '/softball', destination: '/softball-swing-analysis', permanent: true },
    ];
  },

  // Note: Next 16 removed `next lint` and the `eslint` config key. Linting now
  // runs standalone via `npm run lint` (ESLint flat config) in CI and locally;
  // the build no longer invokes ESLint.

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Block clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Force HTTPS for 1 year (includeSubDomains)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Limit referrer data sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by this app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          // Prevent cross-origin info leaks
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          // Content Security Policy
          // Allows: same-origin, Supabase, OpenAI/Anthropic (server-side only, not needed
          // in CSP), Google Fonts, Vercel analytics/speed insights, the on-device
          // MediaPipe pose engine (WASM runtime + model, see below), and inline styles
          // required by Tailwind/Radix. Adjust cdn/analytics hosts as needed.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: same-origin + inline + Vercel analytics + the MediaPipe
              // WASM loader script (jsdelivr). 'wasm-unsafe-eval' is REQUIRED for
              // the on-device pose engine: WebAssembly.instantiate is blocked
              // without it, so pose detection silently fails and the video
              // overlays report "no body pose detected" (it's NOT covered by
              // 'unsafe-inline'). If you self-host the WASM (NEXT_PUBLIC_MEDIAPIPE_*_BASE)
              // you can drop the jsdelivr host but must keep 'wasm-unsafe-eval'.
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://vercel.live https://cdn.jsdelivr.net",
              // Styles: allow same-origin + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: same-origin + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: same-origin + data URIs (charts) + Supabase storage
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              // Media: same-origin + Supabase storage (swing videos)
              "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
              // Connections: same-origin + Supabase API/realtime + Vercel + the
              // on-device MediaPipe pose assets fetched at runtime — the WASM
              // runtime from jsdelivr and the pose model (.task) from Google
              // Cloud Storage. Blocking these is what makes the overlays report
              // "no body pose detected". (Self-hosting via NEXT_PUBLIC_MEDIAPIPE_*_BASE
              // moves both to same-origin and lets you drop these two hosts.)
              // tfhub.dev + kaggle.com are the OPTIONAL MoveNet second-engine model
              // hosts — only used when NEXT_PUBLIC_MOTION_SECOND_ENGINE=movenet (off
              // by default); harmless to allow otherwise (additive, never restrictive).
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vercel.live https://cdn.jsdelivr.net https://storage.googleapis.com https://tfhub.dev https://www.kaggle.com",
              // Workers: same-origin + blob (video processing)
              "worker-src 'self' blob:",
              // No plugins
              "object-src 'none'",
              // Lock the document base URL so an injected <base> tag can't
              // re-root every relative URL (script/style/link) to an attacker host.
              "base-uri 'self'",
              // Forms may only submit to same-origin endpoints.
              "form-action 'self'",
              // Prevent framing by any origin
              "frame-ancestors 'none'",
              // Only load from HTTPS
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      // API responses must not be cached by shared caches
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ];
  },
};

// ── Bundle analyzer (opt-in, zero overhead unless ANALYZE=true) ──────────────
// `ANALYZE=true npm run build` (or `$env:ANALYZE='true'; npm run build` on
// Windows) opens an interactive treemap of every route's JS so we can see what
// is inflating first-load. Kept as a CONDITIONAL dynamic import so a normal
// build never loads — or even needs — the @next/bundle-analyzer package.
// The companion CI gate (scripts/check-bundle-budget.mjs) fails the build if a
// route's first-load JS exceeds apps/web/bundle-budget.json. See docs/PERFORMANCE.md.
export default async function config() {
  if (process.env.ANALYZE === 'true') {
    const { default: withBundleAnalyzer } = await import('@next/bundle-analyzer');
    return withBundleAnalyzer({ enabled: true })(nextConfig);
  }
  return nextConfig;
}
