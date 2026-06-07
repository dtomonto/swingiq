// Tests for the trusted client-IP resolver (lib/security/client-ip.ts).
// The security-critical property: a client cannot mint a fresh rate-limit
// bucket by spoofing the LEFTMOST x-forwarded-for value.

import { clientIp } from '@/lib/security/client-ip';

/** Build a minimal request-like object from a header map. */
function reqWith(headers: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return { headers: { get: (name: string) => lower[name.toLowerCase()] ?? null } };
}

describe('clientIp', () => {
  it('prefers x-real-ip (proxy-set, not client-forgeable)', () => {
    const req = reqWith({
      'x-real-ip': '203.0.113.7',
      'x-forwarded-for': '1.1.1.1, 203.0.113.7',
    });
    expect(clientIp(req)).toBe('203.0.113.7');
  });

  it('does NOT trust a spoofed leftmost x-forwarded-for value', () => {
    // Attacker sends their own XFF; the trusted proxy appends the real IP last.
    const req = reqWith({ 'x-forwarded-for': '9.9.9.9, 198.51.100.23' });
    // The naive `.split(',')[0]` would return the spoofed 9.9.9.9 — we must not.
    expect(clientIp(req)).toBe('198.51.100.23');
    expect(clientIp(req)).not.toBe('9.9.9.9');
  });

  it('a rotating spoofed prefix yields the SAME bucket (can-not-bypass property)', () => {
    const a = clientIp(reqWith({ 'x-forwarded-for': 'aaaa, 198.51.100.23' }));
    const b = clientIp(reqWith({ 'x-forwarded-for': 'bbbb, 198.51.100.23' }));
    const c = clientIp(reqWith({ 'x-forwarded-for': '198.51.100.23' }));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('trims whitespace around the resolved value', () => {
    expect(clientIp(reqWith({ 'x-real-ip': '  203.0.113.7  ' }))).toBe('203.0.113.7');
    expect(clientIp(reqWith({ 'x-forwarded-for': 'a ,  198.51.100.23 ' }))).toBe('198.51.100.23');
  });

  it('returns "unknown" when no proxy headers are present', () => {
    expect(clientIp(reqWith({}))).toBe('unknown');
    expect(clientIp(reqWith({ 'x-forwarded-for': '' }))).toBe('unknown');
    expect(clientIp(reqWith({ 'x-real-ip': '   ' }))).toBe('unknown');
  });
});
