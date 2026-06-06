// ============================================================
// Player Recruiting Hub — outreach assistant (deterministic core)
// ------------------------------------------------------------
// Generates respectful, non-spammy coach/scout messages from the
// athlete's real profile. Guardrails are structural: the generator
// cannot produce scholarship guarantees or ceiling claims, every
// draft starts as `status: 'draft'` (nothing auto-sends), and for a
// minor the UI requires guardian consent before a draft can be
// approved. The optional AI re-word must pass `validateOutreachBody`.
// ============================================================

import type { SportId } from '@swingiq/core';
import { SPORT_META } from './sports';
import type { OutreachContact, OutreachKind, RecruitingState } from './types';
import { FORBIDDEN_CLAIM_PATTERNS } from './summary';

export interface OutreachInput {
  kind: OutreachKind;
  contact?: Partial<OutreachContact>;
  /** Recent performance update / news the athlete wants to share. */
  update?: string;
  /** Desired call-to-action override. */
  cta?: string;
  /** Public profile link to include. */
  profileLink?: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

export const OUTREACH_KIND_LABEL: Record<OutreachKind, string> = {
  initial: 'Initial outreach',
  follow_up: 'Follow-up',
  tournament_update: 'Tournament / event update',
  new_reel: 'New highlight reel',
  updated_metrics: 'Updated metrics',
  thank_you: 'Thank-you',
  personalized: 'Personalized message',
  social_dm: 'Short social DM',
};

/** A message must never guarantee outcomes or project a ceiling, and stays concise. */
export function validateOutreachBody(body: string): boolean {
  if (!body || body.trim().length < 20) return false;
  if (body.length > 1800) return false;
  return !FORBIDDEN_CLAIM_PATTERNS.some((re) => re.test(body));
}

function firstStrength(state: RecruitingState, sport: SportId): string {
  // Pull one honest, concrete data point if available (kept short, no projection).
  const m = state.metrics.find((x) => x.sport === sport && x.currentValue != null);
  if (!m) return '';
  return `${m.metricKey.replace(/_/g, ' ')} of ${m.currentValue}${m.unit ? ' ' + m.unit : ''}`;
}

export function buildOutreach(state: RecruitingState, input: OutreachInput): OutreachDraft {
  const p = state.profile;
  const name = p?.athleteName?.trim() || 'Athlete';
  const sport = (input.contact?.sport ?? p?.primarySport ?? 'golf') as SportId;
  const sportName = SPORT_META[sport].name;
  const klass = p?.graduationYear ? `, class of ${p.graduationYear}` : '';
  const sp = p?.sportProfiles[sport];
  const pos = sp?.position?.trim();
  const coachName = input.contact?.name?.trim() ? `Coach ${input.contact.name.trim()}` : 'Coach';
  const org = input.contact?.organization?.trim();
  const link = input.profileLink?.trim() || '[your recruiting profile link]';
  const strength = firstStrength(state, sport);
  const cta = input.cta?.trim();
  const connection = input.contact?.connection?.trim();

  const sign = `Thank you for your time,\n${name}`;
  const orgLine = org ? ` ${org}` : '';
  const posLine = pos ? `, ${pos}` : '';

  let subject = '';
  let lines: string[] = [];

  switch (input.kind) {
    case 'initial':
    case 'personalized':
      subject = `${name}${klass} — ${sportName}${pos ? ` ${pos}` : ''} interested in${orgLine || ' your program'}`;
      lines = [
        `Dear ${coachName},`,
        connection ? `${connection}` : '',
        `My name is ${name}${klass}, a ${sportName.toLowerCase()} athlete${posLine}.${org ? ` I'm interested in${orgLine}.` : ''}`,
        strength ? `One data point from my profile: ${strength}. Everything on my profile is labeled by source, so you can see what's verified.` : 'My film and full data are on my profile, each labeled by source.',
        `If it's helpful, my recruiting profile (film + data) is here: ${link}.`,
        cta || `I'd welcome the chance to be evaluated and to learn what you look for in a recruit.`,
        sign,
      ];
      break;
    case 'follow_up':
      subject = `Following up — ${name}${klass}, ${sportName}`;
      lines = [
        `Dear ${coachName},`,
        `I wanted to follow up on my note and share that I'm still very interested${org ? ` in${orgLine}` : ''}.`,
        input.update ? `Recent update: ${input.update}.` : '',
        `My latest film and data are here: ${link}.`,
        cta || `Please let me know if there's anything else that would help your evaluation.`,
        sign,
      ];
      break;
    case 'tournament_update':
      subject = `Tournament update — ${name}${klass}`;
      lines = [
        `Dear ${coachName},`,
        input.update ? `Quick update: ${input.update}.` : `I recently competed and wanted to share an update.`,
        `New footage and current numbers are on my profile: ${link}.`,
        cta || `Happy to share my upcoming schedule if you'd like to see me play in person.`,
        sign,
      ];
      break;
    case 'new_reel':
      subject = `New highlight reel — ${name}${klass}, ${sportName}`;
      lines = [
        `Dear ${coachName},`,
        `I just posted a new highlight reel and wanted to share it with you.`,
        input.update ? `${input.update}.` : '',
        `Reel + full data: ${link}.`,
        cta || `I'd appreciate any feedback, and I'm happy to send full-length film on request.`,
        sign,
      ];
      break;
    case 'updated_metrics':
      subject = `Updated numbers — ${name}${klass}`;
      lines = [
        `Dear ${coachName},`,
        `I've refreshed my performance data${strength ? `, including ${strength}` : ''}.`,
        `The updated metrics (with sources) are here: ${link}.`,
        cta || `Let me know if you'd like any of these verified through a workout or showcase.`,
        sign,
      ];
      break;
    case 'thank_you':
      subject = `Thank you — ${name}`;
      lines = [
        `Dear ${coachName},`,
        `Thank you for taking the time${org ? ` and for what you're building${orgLine}` : ''}.`,
        input.update ? `${input.update}.` : '',
        cta || `I'd be grateful to stay in touch as I keep developing.`,
        sign,
      ];
      break;
    case 'social_dm':
      subject = '';
      lines = [
        `Hi ${coachName}${org ? ` (${org})` : ''} — I'm ${name}${klass}, a ${sportName.toLowerCase()} athlete${posLine}.`,
        strength ? `Quick data point: ${strength}.` : '',
        `Film + full data here: ${link}. Would value the chance to be evaluated — thanks!`,
      ];
      break;
  }

  let body = lines.filter(Boolean).join('\n\n');

  // Defense in depth: strip any paragraph that became a forbidden claim.
  if (!validateOutreachBody(body)) {
    body = body
      .split(/\n\n+/)
      .filter((para) => !FORBIDDEN_CLAIM_PATTERNS.some((re) => re.test(para)))
      .join('\n\n')
      .trim();
  }

  return { subject, body };
}
