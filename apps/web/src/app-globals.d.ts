// Ambient declarations for the web app.
//
// TypeScript 6 no longer auto-includes the jest globals here and now requires a
// module declaration for non-JS side-effect imports. Both are declared below so
// `tsc --noEmit` matches what jest/Next handle at runtime.

/// <reference types="jest" />

// Side-effect stylesheet imports, e.g. `import './globals.css'` in layout.tsx.
declare module '*.css';
