import {
  validateContact,
  buildContactSubject,
  buildContactText,
  buildContactHtml,
  contactRecipient,
  sendContactMessage,
  CONTACT_TOPICS,
  type ContactInput,
} from '@/lib/email/contact';

const VALID = {
  name: 'Alex Morgan',
  email: 'Alex@Example.com',
  topic: 'feedback',
  message: 'Love the product so far, here is one thing to improve.',
  pagePath: '/golf-swing-analysis',
};

describe('validateContact', () => {
  it('accepts and normalizes a valid payload', () => {
    const r = validateContact(VALID);
    expect(r.ok).toBe(true);
    expect(r.value).toMatchObject({
      name: 'Alex Morgan',
      email: 'alex@example.com', // lowercased + trimmed
      topic: 'feedback',
      pagePath: '/golf-swing-analysis',
    });
  });

  it('rejects a missing name', () => {
    const r = validateContact({ ...VALID, name: '   ' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/name/i);
  });

  it('rejects an invalid email', () => {
    const r = validateContact({ ...VALID, email: 'not-an-email' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/valid email/i);
  });

  it('rejects a too-short message', () => {
    const r = validateContact({ ...VALID, message: 'too short' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/detail/i);
  });

  it('falls back to "other" for an unknown topic', () => {
    const r = validateContact({ ...VALID, topic: 'nonsense' });
    expect(r.ok).toBe(true);
    expect(r.value?.topic).toBe('other');
  });

  it('drops a non-absolute pagePath', () => {
    const r = validateContact({ ...VALID, pagePath: 'https://evil.example.com' });
    expect(r.ok).toBe(true);
    expect(r.value?.pagePath).toBeUndefined();
  });

  it('caps an overly long message', () => {
    const r = validateContact({ ...VALID, message: 'x'.repeat(9000) });
    expect(r.value?.message.length).toBe(4000);
  });

  it('every declared topic validates through', () => {
    for (const topic of CONTACT_TOPICS) {
      const r = validateContact({ ...VALID, topic });
      expect(r.ok).toBe(true);
      expect(r.value?.topic).toBe(topic);
    }
  });
});

const INPUT: ContactInput = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  topic: 'bug',
  message: 'The upload button looks broken on my phone.',
  pagePath: '/diagnose',
};

describe('email builders', () => {
  it('subject names the topic and sender', () => {
    const subject = buildContactSubject(INPUT);
    expect(subject).toContain('SwingVantage contact');
    expect(subject).toContain('Alex Morgan');
  });

  it('text body includes the key fields', () => {
    const text = buildContactText(INPUT);
    expect(text).toContain('alex@example.com');
    expect(text).toContain('The upload button looks broken');
    expect(text).toContain('/diagnose');
  });

  it('html escapes user content (no injection)', () => {
    const html = buildContactHtml({ ...INPUT, message: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('contactRecipient', () => {
  it('uses CONTACT_TO_EMAIL when set', () => {
    expect(contactRecipient({ CONTACT_TO_EMAIL: 'owner@example.com' })).toBe('owner@example.com');
  });

  it('falls back to the configured support address', () => {
    expect(contactRecipient({})).toBe('support@swingvantage.com');
  });
});

describe('sendContactMessage', () => {
  it('dry-runs (does NOT claim delivery) when no RESEND_API_KEY', async () => {
    const r = await sendContactMessage(INPUT, {});
    expect(r.delivered).toBe(false);
    expect(r.provider).toBe('none');
  });

  it('reports delivered when Resend accepts the message', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 200 }));
    try {
      const r = await sendContactMessage(INPUT, { RESEND_API_KEY: 'test-key' });
      expect(r.delivered).toBe(true);
      expect(r.provider).toBe('resend');
      // sends reply_to so the owner can reply to the visitor directly
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      expect(body.reply_to).toBe('alex@example.com');
      expect(body.to).toEqual(['support@swingvantage.com']);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('reports not-delivered when Resend rejects, and never throws', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(null, { status: 422 }));
    try {
      const r = await sendContactMessage(INPUT, { RESEND_API_KEY: 'test-key' });
      expect(r.delivered).toBe(false);
      expect(r.provider).toBe('resend');
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
