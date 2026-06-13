import {
  upsertTask, changeTaskStatus, addTaskNote, patchTask, taskFingerprint,
} from '../tasks';
import { generateFixPacketFromTask, renderFixPacketFile, buildTaskRepairPrompt } from '../service';
import { taskRepo, __resetIntelligenceStoreForTests } from '../store';

beforeEach(() => { __resetIntelligenceStoreForTests(); });

const base = {
  title: 'Video uploads fail on mobile Safari for large files',
  severity: 'high' as const,
  category: 'upload' as const,
  source: 'upload-reliability-report',
  affectedRoute: '/start',
  affectedComponent: 'UploadHandler',
};

describe('intelligence-os/tasks', () => {
  it('creates a task with a default priority derived from severity', async () => {
    const { task, deduped } = await upsertTask(base);
    expect(deduped).toBe(false);
    expect(task.priority).toBe('p1'); // high → p1
    expect(task.status).toBe('new');
    expect(task.dataSource).toBe('real');
    expect(task.history[0].event).toBe('created');
  });

  it('dedupes a recurring issue into the existing task (bumps occurrenceCount)', async () => {
    const first = await upsertTask(base);
    const second = await upsertTask({ ...base, source: 'video-analysis' });
    expect(second.deduped).toBe(true);
    expect(second.task.id).toBe(first.task.id);
    expect(second.task.occurrenceCount).toBe(2);
    expect((await taskRepo.list()).length).toBe(1);
  });

  it('materially different issues get distinct fingerprints (no false merge)', () => {
    const a = taskFingerprint({ category: 'upload', affectedRoute: '/start', severity: 'high', signature: 'upload timeout safari' });
    const b = taskFingerprint({ category: 'ai-coach', affectedRoute: '/coach', severity: 'high', signature: 'slice answer drift' });
    expect(a).not.toBe(b);
  });

  it('status change + note + escalate append history and persist', async () => {
    const { task } = await upsertTask(base);
    const moved = await changeTaskStatus(task.id, 'in-progress');
    expect(moved?.status).toBe('in-progress');
    expect(moved?.history.at(-1)?.event).toBe('status-change');

    const noted = await addTaskNote(task.id, 'admin@x.com', 'Reproduced on iOS 18.');
    expect(noted?.notes.at(-1)?.body).toBe('Reproduced on iOS 18.');

    const escalated = await patchTask(task.id, { severity: 'critical', priority: 'p0' }, 'escalated');
    expect(escalated?.severity).toBe('critical');
    expect(escalated?.priority).toBe('p0');
  });

  it('archiving via status sets archived and removes it from the active list', async () => {
    const { task } = await upsertTask(base);
    await changeTaskStatus(task.id, 'archived');
    const stored = await taskRepo.get(task.id);
    expect(stored?.archived).toBe(true);
  });

  it('generates a specific (not generic) Claude Code fix packet for a task', async () => {
    const { task } = await upsertTask({
      ...base,
      reproductionSteps: ['Open /start on iPhone Safari', 'Select a >100MB video', 'Observe timeout'],
      acceptanceCriteria: ['Large files upload reliably', 'Regression tests added'],
    });
    const packet = await generateFixPacketFromTask(task.id);
    expect(packet).not.toBeNull();
    expect(packet!.markdownPrompt).toContain('# Claude Code Repair Prompt');
    expect(packet!.markdownPrompt).toContain('/start'); // specific route, not vague
    expect(packet!.markdownPrompt).toContain('## Do Not Break');
    expect(packet!.markdownPrompt).toContain('Video uploads');
  });

  it('renders the fix packet as downloadable Markdown and JSON files', async () => {
    const { task } = await upsertTask(base);
    const packet = await generateFixPacketFromTask(task.id);
    const md = renderFixPacketFile(packet!, 'markdown');
    expect(md.contentType).toBe('text/markdown');
    expect(md.filename.endsWith('.md')).toBe(true);

    const json = renderFixPacketFile(packet!, 'json');
    expect(json.contentType).toBe('application/json');
    const parsed = JSON.parse(json.body);
    expect(parsed.packetType).toBe('swingvantage-claude-code-fix-packet');
    expect(parsed.jsonContext.taskId).toBe(task.id);
  });

  it('buildTaskRepairPrompt is safe when optional fields are empty', async () => {
    const { task } = await upsertTask({ title: 'Bare task', severity: 'low', category: 'bug', source: 'manual-admin-entry' });
    const prompt = buildTaskRepairPrompt(task);
    expect(prompt).toContain('Bare task');
    expect(prompt).toContain('reproduction steps not yet captured');
  });
});
