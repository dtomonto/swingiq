import {
  generateClaudeFixPrompt, generateTaskJson, generateTaskMarkdown, generateFixPacket, patternToTaskLike,
} from '../fix-packet';
import { TASKS, PATTERNS } from '../seed';

describe('intelligence-os/fix-packet', () => {
  const task = TASKS[0];

  it('produces a specific (not generic) Claude Code repair prompt', () => {
    const p = generateClaudeFixPrompt(task);
    expect(p).toContain('# Claude Code Repair Prompt');
    expect(p).toContain(task.title);
    expect(p).toContain('## Do Not Break');
    expect(p).toContain('Video uploads');
    // mentions the specific affected route, not a vague placeholder
    expect(p).toContain(task.affectedRoute as string);
  });

  it('task JSON is valid and round-trips the task', () => {
    const parsed = JSON.parse(generateTaskJson(task));
    expect(parsed.packetType).toBe('swingvantage-claude-code-fix-packet');
    expect(parsed.task.id).toBe(task.id);
  });

  it('task markdown includes executive summary + embedded prompt', () => {
    const md = generateTaskMarkdown(task);
    expect(md).toContain('## Executive summary');
    expect(md).toContain('# Claude Code Repair Prompt');
  });

  it('generateFixPacket returns all six packet members', () => {
    const packet = generateFixPacket(task);
    expect(Object.keys(packet).sort()).toEqual([
      'README.md', 'acceptance-criteria.md', 'claude-code-fix-prompt.md',
      'notes.md', 'regression-tests.md', 'task-context.json',
    ]);
    expect(packet['README.md']).toContain(task.title);
  });

  it('patternToTaskLike yields a usable task for a pattern with no stored task', () => {
    const t = patternToTaskLike(PATTERNS[0]);
    expect(t.title).toBe(PATTERNS[0].patternTitle);
    expect(generateClaudeFixPrompt(t)).toContain(PATTERNS[0].patternTitle);
  });
});
