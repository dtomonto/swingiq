// Regression guard: the sidebar "Sign Out" control was a dead <button> with
// no handler — clicking it did nothing. These assertions fail if that bug
// (or an equivalent un-wired sign-out) is ever reintroduced. A source scan is
// used because the jest env is `node` (no DOM to render/click).

import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = readFileSync(join(__dirname, '..', 'Sidebar.tsx'), 'utf8');
const SIGNOUT_HOOK = readFileSync(
  join(__dirname, '..', '..', '..', 'lib', 'auth', 'useSignOut.ts'),
  'utf8',
);

describe('Sidebar sign-out wiring', () => {
  it('uses the shared useSignOut hook', () => {
    expect(SRC).toMatch(/import\s+\{\s*useSignOut\s*\}\s+from\s+['"]@\/lib\/auth\/useSignOut['"]/);
    expect(SRC).toMatch(/useSignOut\s*\(/);
  });

  it('wires the Sign Out button to an onClick handler (not a dead button)', () => {
    // Find the button element that contains the "Sign Out" label.
    const idx = SRC.indexOf('Sign Out');
    expect(idx).toBeGreaterThan(-1);
    const buttonStart = SRC.lastIndexOf('<button', idx);
    expect(buttonStart).toBeGreaterThan(-1);
    const buttonMarkup = SRC.slice(buttonStart, idx);
    expect(buttonMarkup).toMatch(/onClick=\{signOut\}/);
  });

  it('disables the button while signing out (no double-fire)', () => {
    expect(SRC).toMatch(/disabled=\{signingOut\}/);
  });
});

describe('useSignOut hook', () => {
  it('ends the session and redirects to /login by default', () => {
    expect(SIGNOUT_HOOK).toMatch(/useAuth/);
    expect(SIGNOUT_HOOK).toMatch(/await\s+signOut\(\)/);
    expect(SIGNOUT_HOOK).toMatch(/router\.replace/);
    expect(SIGNOUT_HOOK).toMatch(/redirectTo\s*=\s*['"]\/login['"]/);
  });
});
