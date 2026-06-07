// ============================================================
// Link Intelligence Agent — outreach workflow (human-approved)
// ------------------------------------------------------------
// The agent NEVER sends outreach automatically. It (1) drafts short, honest,
// white-hat outreach for a backlink opportunity, (2) creates a GrowthOS
// approval task (kind `task`, approvalRequired) so a human signs off, and
// (3) maps the spec's outreach pipeline onto the existing AuthorityOpportunity
// status the Digital PR module already understands.
// ============================================================

import type { AuthorityOpportunity, AuthorityStatus, MarketingTask } from '../types';
import { AGENT_OWNER } from './constants';
import { id } from './id';

// The full outreach pipeline (spec §9) mapped onto AuthorityStatus so it
// renders natively in the Digital PR module.
export const OUTREACH_PIPELINE: { stage: string; status: AuthorityStatus }[] = [
  { stage: 'Discovered', status: 'idea' },
  { stage: 'Qualified', status: 'researching' },
  { stage: 'Drafted / Needs approval', status: 'researching' },
  { stage: 'Approved / Sent', status: 'pitched' },
  { stage: 'In progress / Follow-up', status: 'in-progress' },
  { stage: 'Won', status: 'won' },
  { stage: 'Published', status: 'published' },
  { stage: 'Lost / Not worth it / Toxic', status: 'declined' },
];

export interface OutreachDraft {
  subjectOptions: string[];
  body: string;
  followUps: string[];
  linkedinDm: string;
  valueProposition: string;
  reviewerNote: string;
}

function relevantPageFromNotes(notes?: string): string {
  const m = notes?.match(/page to pitch:\s*([^\s.]+)/i);
  return m ? m[1] : 'https://swingvantage.com';
}

/**
 * A short, human, white-hat outreach draft. Honest by construction: no
 * fabricated stats, no false urgency, value-first. The AI Strategist
 * `link-outreach` task can rewrite this for tone when a key is configured.
 */
export function draftOutreach(opp: AuthorityOpportunity): OutreachDraft {
  const page = relevantPageFromNotes(opp.notes);
  const outlet = opp.targetOutlet;
  const valueProposition = `A free AI swing-analysis resource your audience can use immediately, relevant to ${outlet.toLowerCase()}.`;

  return {
    subjectOptions: [
      `A free resource for your readers on swing analysis`,
      `Quick idea for ${outlet}`,
      `Free AI swing-analysis tool — useful for your audience?`,
    ],
    body: [
      `Hi there,`,
      ``,
      `I run SwingVantage, a free AI swing-analysis tool for golf, tennis, pickleball, padel, baseball and softball. ${opp.pitchAngle}`,
      ``,
      `If it's a fit, here's the most relevant page: ${page}. No payment, no signup required to try it — I just think it could genuinely help your audience.`,
      ``,
      `Either way, thanks for the work you put out. Happy to share anything that'd make it more useful to you.`,
      ``,
      `Best,`,
      `The SwingVantage team`,
    ].join('\n'),
    followUps: [
      `Hi — just floating this back up in case it's useful. No worries at all if it's not a fit.`,
      `Last note from me on this — if a free swing-analysis resource would help your readers, the link is ${page}. Thanks either way!`,
      `Closing the loop here — I'll leave it with you. Always happy to help if it's ever relevant down the line.`,
    ],
    linkedinDm: `Hi! I built SwingVantage, a free AI swing-analysis tool across 7 sports. ${opp.pitchAngle} Thought it might be useful for your audience — happy to share more if helpful.`,
    valueProposition,
    reviewerNote: 'Draft only — review for fit + personalization before any send. The agent never sends outreach automatically.',
  };
}

/** Create a GrowthOS approval task for an outreach opportunity (never auto-sends). */
export function makeApprovalTask(opp: AuthorityOpportunity): MarketingTask {
  const now = new Date().toISOString();
  return {
    id: id('task-li-outreach', opp.id),
    name: `Approve outreach: ${opp.targetOutlet}`,
    dataSource: 'real',
    owner: AGENT_OWNER,
    notes: `Outreach for backlink opportunity "${opp.name}". Requires human approval before sending.`,
    createdAt: now,
    updatedAt: now,
    description: `Review + personalize the outreach draft for ${opp.targetOutlet}, then approve to send manually. Pitch angle: ${opp.pitchAngle}`,
    assignee: 'Unassigned',
    status: 'todo',
    dueDate: null,
    dependencies: [],
    approvalRequired: true,
    checklist: ['Confirm outlet relevance', 'Find the right contact', 'Personalize the draft', 'Approve + send manually', 'Log result + backlink URL'],
  };
}

export type OutreachAction = 'qualify' | 'draft' | 'approve' | 'mark-sent' | 'win' | 'lose';

/** Pure status transition for the outreach pipeline. */
export function advanceOutreach(current: AuthorityStatus, action: OutreachAction): AuthorityStatus {
  switch (action) {
    case 'qualify': return 'researching';
    case 'draft': return 'researching';
    case 'approve': return 'pitched';
    case 'mark-sent': return 'pitched';
    case 'win': return 'won';
    case 'lose': return 'declined';
    default: return current;
  }
}
