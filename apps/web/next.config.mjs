/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@swingiq/core'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
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
          // in CSP), Google Fonts, Vercel analytics/speed insights, and inline styles
          // required by Tailwind/Radix. Adjust cdn/analytics hosts as needed.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: allow same-origin + Vercel analytics
              "script-src 'self' 'unsafe-inline' https://vercel.live",
              // Styles: allow same-origin + inline (Tailwind) + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts: same-origin + Google Fonts CDN
              "font-src 'self' https://fonts.gstatic.com",
              // Images: same-origin + data URIs (charts) + Supabase storage
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              // Media: same-origin + Supabase storage (swing videos)
              "media-src 'self' blob: https://*.supabase.co https://*.supabase.in",
              // Connections: same-origin + Supabase API/realtime + Vercel
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://vercel.live",
              // Workers: same-origin + blob (video processing)
              "worker-src 'self' blob:",
              // No plugins
              "object-src 'none'",
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

export default nextConfig;
