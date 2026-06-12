// Claude Handoff — turn any admin alert/finding into a paste-ready Claude Code
// fix prompt. Public surface; see ./types.ts for the normalized shape.
export type { ClaudeFixInput, ClaudeFixField } from './types';
export { buildClaudePrompt, buildClaudeBundle, promptFilename } from './prompt';
export {
  fromAlert,
  fromDecision,
  fromLinkFinding,
  fromSecurityFinding,
  fromRecordFields,
} from './adapters';
