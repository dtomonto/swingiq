import {
  buildClaudePrompt,
  buildClaudeBundle,
  promptFilename,
  fromLinkFinding,
  fromSecurityFinding,
  fromAlert,
  fromRecordFields,
} from '..';
import type { LinkFinding } from '@/lib/growth/types';
import type { SecurityFinding } from '@/lib/security-os/types';

describe('buildClaudePrompt', () => {
  it('renders a paste-ready prompt with the actionable footer', () => {
    const out = buildClaudePrompt({
      title: 'Duplicate meta description on 2 pages',
      source: 'Link Intelligence · link audit',
      severity: 'medium',
      problem: '/golf/fix-slice and /golf/cure-slice share the same meta description.',
      recommendation: 'Give each page a unique meta description.',
      affected: ['/golf/fix-slice', '/golf/cure-slice'],
      steps: ['Open both page configs', 'Write a distinct description for each'],
      fields: [{ label: 'Sport', value: 'golf' }],
    });

    expect(out).toContain('# Fix: Duplicate meta description on 2 pages');
    expect(out).toContain('**Source:** Link Intelligence · link audit');
    expect(out).toContain('**Severity:** medium');
    expect(out).toContain('## Problem');
    expect(out).toContain('## Affected');
    expect(out).toContain('- /golf/fix-slice');
    expect(out).toContain('## Recommended fix');
    expect(out).toContain('## Steps');
    expect(out).toContain('1. Open both page configs');
    expect(out).toContain('## Details');
    expect(out).toContain('**Sport:** golf');
    expect(out).toContain('apps/web');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('omits empty sections and skips placeholder dash values', () => {
    const out = buildClaudePrompt({
      title: 'Bare alert',
      source: 'Command Center',
      fields: [{ label: 'Nothing', value: '—' }],
    });
    expect(out).not.toContain('## Problem');
    expect(out).not.toContain('## Affected');
    expect(out).not.toContain('## Steps');
    expect(out).not.toContain('## Details');
    expect(out).toContain('# Fix: Bare alert');
  });

  it('never leaves 3+ consecutive blank lines', () => {
    const out = buildClaudePrompt({ title: 'X', source: 'Y' });
    expect(out).not.toMatch(/\n{3,}/);
  });
});

describe('buildClaudeBundle', () => {
  it('demotes per-item headings and counts items', () => {
    const out = buildClaudeBundle('Open reports', [
      { title: 'A', source: 'S', problem: 'pa' },
      { title: 'B', source: 'S', problem: 'pb' },
    ]);
    expect(out).toContain('# Open reports');
    expect(out).toContain('2 items to fix');
    expect(out).toContain('## Fix: A');
    expect(out).toContain('## Fix: B');
    expect(out).not.toMatch(/^# Fix:/m); // items demoted to H2
  });
});

describe('promptFilename', () => {
  it('slugifies and dates single + bundle files', () => {
    expect(promptFilename('Duplicate meta description!', { dateIso: '2026-06-11T10:00:00Z' })).toBe(
      'claude-fix-duplicate-meta-description-2026-06-11.md',
    );
    expect(promptFilename('Open reports', { bundle: true })).toBe('claude-fixes-open-reports.md');
    expect(promptFilename('')).toBe('claude-fix-report.md');
  });
});

describe('normalizers', () => {
  it('fromLinkFinding maps the duplicate-meta-style finding', () => {
    const f = {
      id: 'lf1',
      findingType: 'weak-inlinks',
      pageUrl: '/golf/fix-slice',
      sport: 'golf',
      severity: 'medium',
      detail: 'Only 1 inbound internal link.',
      recommendedAction: 'Add internal links from related golf pages.',
      metric: 1,
      status: 'open',
    } as LinkFinding;
    const input = fromLinkFinding(f);
    expect(input.title).toBe('Too few inbound internal links');
    expect(input.recommendation).toBe('Add internal links from related golf pages.');
    expect(input.affected).toEqual(['/golf/fix-slice']);
    const prompt = buildClaudePrompt(input);
    expect(prompt).toContain('## Recommended fix');
  });

  it('fromSecurityFinding carries steps + evidence', () => {
    const f = {
      id: 's1',
      title: 'Missing Content-Security-Policy',
      description: 'No CSP header is set.',
      severity: 'high',
      riskDomain: 'Application Security',
      affectedArea: 'next.config.js',
      evidence: ['Response headers lack content-security-policy'],
      recommendedFix: 'Add a CSP header.',
      businessImpact: 'XSS risk.',
      technicalImpact: 'No script-source restriction.',
      riskScore: 72,
      canClaudeFix: true,
      stepByStepActions: ['Edit next.config.js', 'Add the headers() entry'],
    } as unknown as SecurityFinding;
    const input = fromSecurityFinding(f);
    expect(input.title).toBe('Missing Content-Security-Policy');
    expect(input.steps).toContain('Edit next.config.js');
    expect(input.affected).toContain('Response headers lack content-security-policy');
  });

  it('fromAlert is a thin pass-through', () => {
    const input = fromAlert({ title: 'Live data off', detail: 'Set the key.', severity: 'warning', href: '/admin/x' });
    expect(input.title).toBe('Live data off');
    expect(input.problem).toBe('Set the key.');
    expect(input.source).toBe('Command Center');
  });

  it('fromRecordFields picks well-known slots out of generic fields', () => {
    const input = fromRecordFields({
      title: 'Some record',
      source: 'GrowthOS · link audit',
      fields: [
        { label: 'Detail', value: 'Two links share a meta description.' },
        { label: 'Recommended action', value: 'Make them unique.' },
        { label: 'Severity', value: 'medium' },
        { label: 'Page', value: '/a' },
      ],
    });
    expect(input.problem).toBe('Two links share a meta description.');
    expect(input.recommendation).toBe('Make them unique.');
    expect(input.severity).toBe('medium');
    expect(input.fields?.some((f) => f.label === 'Page')).toBe(true);
    expect(input.fields?.some((f) => f.label === 'Detail')).toBe(false);
  });
});
