// Design V2 flag — resolution + precedence. As of the Phase 8 GA flip the
// default is ON; explicit `0` (env or cookie) is the rollback switch.

import {
  DESIGN_V2_COOKIE,
  designV2Enabled,
  designV2EnabledFromEnv,
  readDesignV2Cookie,
} from '../design-v2';

describe('design-v2 flag', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_DESIGN_V2;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_DESIGN_V2;
    else process.env.NEXT_PUBLIC_DESIGN_V2 = ORIGINAL;
  });

  it('defaults ON (GA) with no env and no cookie', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
    expect(designV2Enabled()).toBe(true);
    expect(designV2EnabledFromEnv()).toBe(true);
  });

  it('explicit env=0 (or false/off/no) rolls back to OFF', () => {
    for (const v of ['0', 'false', 'off', 'no']) {
      process.env.NEXT_PUBLIC_DESIGN_V2 = v;
      expect(designV2EnabledFromEnv()).toBe(false);
    }
  });

  it('stays ON for truthy spellings and for unrecognized/empty (default)', () => {
    for (const v of ['1', 'true', 'on', 'YES', 'garbage', '']) {
      process.env.NEXT_PUBLIC_DESIGN_V2 = v;
      expect(designV2EnabledFromEnv()).toBe(true);
    }
  });

  it('cookie 0 rolls back even on a default (ON) deploy', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
    expect(designV2Enabled('0')).toBe(false);
    process.env.NEXT_PUBLIC_DESIGN_V2 = '1';
    expect(designV2Enabled('0')).toBe(false);
  });

  it('cookie 1 forces ON even when the env rolled back', () => {
    process.env.NEXT_PUBLIC_DESIGN_V2 = '0';
    expect(designV2EnabledFromEnv()).toBe(false);
    expect(designV2Enabled('1')).toBe(true);
  });

  it('unrecognized cookie falls through to the env (default ON)', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
    expect(designV2Enabled('maybe')).toBe(true);
    process.env.NEXT_PUBLIC_DESIGN_V2 = '0';
    expect(designV2Enabled('maybe')).toBe(false);
  });
});

describe('readDesignV2Cookie', () => {
  it('extracts the flag from a Cookie header among others', () => {
    const header = `foo=bar; ${DESIGN_V2_COOKIE}=1; baz=qux`;
    expect(readDesignV2Cookie(header)).toBe('1');
  });

  it('returns null when absent or empty', () => {
    expect(readDesignV2Cookie('foo=bar')).toBeNull();
    expect(readDesignV2Cookie('')).toBeNull();
    expect(readDesignV2Cookie(null)).toBeNull();
  });

  it('url-decodes the value', () => {
    expect(readDesignV2Cookie(`${DESIGN_V2_COOKIE}=%31`)).toBe('1');
  });
});
