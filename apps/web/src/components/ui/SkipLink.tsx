// SkipLink — "Skip to main content" bypass (WCAG 2.4.1 Bypass Blocks).
// Visually hidden until it receives focus, then it appears as a pill at the
// top-left so a keyboard/AT user's first Tab can jump past the persistent
// header/banner straight to the page content. Targets the universal
// `#main-content` wrapper mounted once in app/layout.tsx. Pure markup — no
// client JS needed (native in-page anchor + a focusable target).
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-theme-lg"
    >
      Skip to main content
    </a>
  );
}
