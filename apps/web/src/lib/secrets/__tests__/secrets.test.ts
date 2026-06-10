import {
  encryptSecret, decryptSecret, secretsEncryptionAvailable, generateMasterKey, type EncryptedSecret,
} from '../crypto.server';
import { detectKey } from '../detect';
import { maskSecret } from '../mask';
import { MANAGED_KEYS, isManagedKey } from '../registry';
import { setSecret, getStoredSecret, deleteSecret, listStoredSecretMeta, __resetSecretStore } from '../store.server';
import { resolveSecret, getSecretStatus } from '../resolve.server';

describe('secrets/crypto (AES-256-GCM)', () => {
  beforeAll(() => { process.env.SECRETS_ENCRYPTION_KEY = generateMasterKey(); });
  afterAll(() => { delete process.env.SECRETS_ENCRYPTION_KEY; });

  it('is available when the master key is set', () => {
    expect(secretsEncryptionAvailable()).toBe(true);
  });

  it('round-trips encrypt → decrypt and stores ciphertext (not plaintext)', () => {
    const enc = encryptSecret('sk-ant-secret-value-123');
    expect(enc).not.toBeNull();
    expect(JSON.stringify(enc)).not.toContain('sk-ant-secret-value-123');
    expect(decryptSecret(enc!)).toBe('sk-ant-secret-value-123');
  });

  it('fails closed on tampering (auth tag)', () => {
    const enc = encryptSecret('hello world')!;
    const tampered: EncryptedSecret = { ...enc, data: Buffer.from('garbage').toString('base64') };
    expect(decryptSecret(tampered)).toBeNull();
  });

  it('cannot encrypt without a master key', () => {
    const saved = process.env.SECRETS_ENCRYPTION_KEY;
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(secretsEncryptionAvailable()).toBe(false);
    expect(encryptSecret('x')).toBeNull();
    process.env.SECRETS_ENCRYPTION_KEY = saved;
  });
});

describe('secrets/detect (provider auto-detection)', () => {
  it('maps a pasted value to the right managed key', () => {
    expect(detectKey('sk-ant-abcdefghij1234567890')?.name).toBe('ANTHROPIC_API_KEY');
    expect(detectKey('sk-proj-abcdefghij1234567890ABCDEF')?.name).toBe('OPENAI_API_KEY');
    expect(detectKey('AIzaSyA1234567890abcdefghijklmnopqrstuv')?.provider).toBe('google');
    expect(detectKey('pk_live_abcdefghij1234567890')?.name).toBe('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    expect(detectKey('sk_live_abcdefghij1234567890')?.name).toBe('STRIPE_SECRET_KEY');
    expect(detectKey('whsec_abcdefghij1234567890')?.name).toBe('STRIPE_WEBHOOK_SECRET');
    expect(detectKey('re_abcdefghij1234')?.name).toBe('RESEND_API_KEY');
    expect(detectKey('ghp_abcdefghij1234567890abcdefghij12')?.name).toBe('GITHUB_TOKEN');
    expect(detectKey('phc_abcdefghij1234567890')?.name).toBe('NEXT_PUBLIC_POSTHOG_KEY');
    expect(detectKey('just-some-random-text')).toBeNull();
  });
});

describe('secrets/mask', () => {
  it('keeps a prefix + last 4, hides the middle', () => {
    const m = maskSecret('sk-ant-abcdef1234567890wxyz');
    expect(m).toContain('•');
    expect(m).toContain('wxyz');
    expect(m).not.toContain('abcdef1234567890');
  });
  it('fully dots short/empty values', () => {
    expect(maskSecret('1234')).toBe('••••');
    expect(maskSecret('')).toBe('');
  });
});

describe('secrets/registry', () => {
  it('has unique, env-shaped names', () => {
    const names = MANAGED_KEYS.map((k) => k.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toMatch(/^[A-Z0-9_]+$/);
    expect(isManagedKey('ANTHROPIC_API_KEY')).toBe(true);
    expect(isManagedKey('NOT_A_KEY')).toBe(false);
  });
});

describe('secrets/store + resolve', () => {
  beforeAll(() => { process.env.SECRETS_ENCRYPTION_KEY = generateMasterKey(); });
  afterAll(() => { delete process.env.SECRETS_ENCRYPTION_KEY; });
  beforeEach(() => {
    __resetSecretStore();
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CRON_SECRET;
  });

  it('stores + retrieves a managed key (encrypted, memory fallback)', async () => {
    const r = await setSecret('ANTHROPIC_API_KEY', 'sk-ant-xyz', 'me@x.com');
    expect(r.ok).toBe(true);
    expect(await getStoredSecret('ANTHROPIC_API_KEY')).toBe('sk-ant-xyz');
    expect((await listStoredSecretMeta()).find((m) => m.name === 'ANTHROPIC_API_KEY')?.actorEmail).toBe('me@x.com');
  });

  it('rejects unknown key names and empty values', async () => {
    expect((await setSecret('NOT_A_KEY', 'x')).ok).toBe(false);
    expect((await setSecret('CRON_SECRET', '   ')).ok).toBe(false);
  });

  it('refuses to store without a master key', async () => {
    const saved = process.env.SECRETS_ENCRYPTION_KEY;
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(await setSecret('CRON_SECRET', 'value')).toEqual({ ok: false, reason: 'no_encryption' });
    process.env.SECRETS_ENCRYPTION_KEY = saved;
  });

  it('resolveSecret: env wins over vault', async () => {
    await setSecret('CRON_SECRET', 'from-vault');
    process.env.CRON_SECRET = 'from-env';
    expect(await resolveSecret('CRON_SECRET')).toBe('from-env');
    delete process.env.CRON_SECRET;
    expect(await resolveSecret('CRON_SECRET')).toBe('from-vault');
  });

  it('delete reverts a stored key', async () => {
    await setSecret('CRON_SECRET', 'v');
    await deleteSecret('CRON_SECRET');
    expect(await getStoredSecret('CRON_SECRET')).toBeNull();
  });

  it('getSecretStatus returns masked previews + source, never raw values', async () => {
    await setSecret('ANTHROPIC_API_KEY', 'sk-ant-supersecretvalue');
    const status = await getSecretStatus();
    const a = status.find((s) => s.name === 'ANTHROPIC_API_KEY')!;
    expect(a.source).toBe('vault');
    expect(a.masked).not.toContain('supersecretvalue');
    expect(JSON.stringify(status)).not.toContain('supersecretvalue');
  });
});
