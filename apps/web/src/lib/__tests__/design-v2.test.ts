// Design V2 flag — resolution + precedence (cookie override beats env).

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

  it('defaults OFF with no env and no cookie', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
    expect(designV2Enabled()).toBe(false);
    expect(designV2EnabledFromEnv()).toBe(false);
  });

  it('env enables it', () => {
    process.env.NEXT_PUBLIC_DESIGN_V2 = '1';
    expect(designV2EnabledFromEnv()).toBe(true);
    expect(designV2Enabled()).toBe(true);
  });

  it('accepts truthy/falsy env spellings', () => {
    for (const v of ['1', 'true', 'on', 'YES']) {
      process.env.NEXT_PUBLIC_DESIGN_V2 = v;
      expect(designV2EnabledFromEnv()).toBe(true);
    }
    for (const v of ['0', 'false', 'off', 'no', 'garbage', '']) {
      process.env.NEXT_PUBLIC_DESIGN_V2 = v;
      expect(designV2EnabledFromEnv()).toBe(false);
    }
  });

  it('cookie override beats env (opt OUT of an enabled deploy)', () => {
    process.env.NEXT_PUBLIC_DESIGN_V2 = '1';
    expect(designV2Enabled('0')).toBe(false);
  });

  it('cookie override beats env (opt IN on a disabled deploy)', () => {
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
    expect(designV2Enabled('1')).toBe(true);
  });

  it('unrecognized cookie falls through to env', () => {
    process.env.NEXT_PUBLIC_DESIGN_V2 = '1';
    expect(designV2Enabled('maybe')).toBe(true);
    delete process.env.NEXT_PUBLIC_DESIGN_V2;
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
