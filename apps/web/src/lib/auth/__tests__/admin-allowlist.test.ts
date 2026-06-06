import { isAdminEmail, adminEmails } from '../admin-allowlist';

describe('admin allowlist', () => {
  const orig = process.env.ADMIN_EMAILS;
  afterEach(() => {
    process.env.ADMIN_EMAILS = orig;
  });

  it('matches allowlisted emails case-insensitively, trimming spaces', () => {
    process.env.ADMIN_EMAILS = ' Owner@Example.com , two@x.com ';
    expect(adminEmails()).toEqual(['owner@example.com', 'two@x.com']);
    expect(isAdminEmail('owner@example.com')).toBe(true);
    expect(isAdminEmail('TWO@X.COM')).toBe(true);
    expect(isAdminEmail('stranger@x.com')).toBe(false);
  });

  it('denies everyone when the allowlist is empty/unset (secure by default)', () => {
    process.env.ADMIN_EMAILS = '';
    expect(isAdminEmail('owner@example.com')).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });
});
