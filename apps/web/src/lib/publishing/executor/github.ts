// ============================================================
// PublishingOS — GitHub executor (REST Git Data API)
// ------------------------------------------------------------
// Turns a PublishPlan into a real pull request: read base ref → create blobs →
// tree → commit → branch ref → PR (one atomic commit, multi-file safe). The
// token is sent only in the Authorization header and is NEVER logged or returned
// — errors carry GitHub's message + the failing step only.
// ============================================================

import type { PublishPlan } from './plan';

export interface GithubConfig {
  token: string;
  owner: string;
  repo: string;
  base: string;
}

export type ExecuteResult =
  | { ok: true; prUrl: string; prNumber: number; branch: string; commitSha: string }
  | { ok: false; step: string; error: string };

const API = 'https://api.github.com';

async function ghFetch(cfg: GithubConfig, method: string, path: string, body?: unknown): Promise<Response> {
  return fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

async function failFrom(step: string, res: Response): Promise<ExecuteResult> {
  let detail = `HTTP ${res.status}`;
  try {
    const j = (await res.json()) as { message?: string };
    if (j?.message) detail = j.message; // GitHub's error message never contains the token
  } catch {
    /* non-JSON body */
  }
  return { ok: false, step, error: detail };
}

/**
 * Read a file's UTF-8 content from the base branch via the contents API.
 * Returns null when the file does not exist (or on any read error) — callers
 * treat that as "no existing manifest".
 */
export async function getFileContent(cfg: GithubConfig, path: string): Promise<string | null> {
  try {
    const res = await ghFetch(
      cfg,
      'GET',
      `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(cfg.base)}`,
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { content?: string; encoding?: string };
    if (!j.content) return null;
    return Buffer.from(j.content, (j.encoding as BufferEncoding) || 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/** Execute a plan as a pull request. Each step is guarded; never throws. */
export async function createPullRequestFromPlan(plan: PublishPlan, cfg: GithubConfig): Promise<ExecuteResult> {
  const { owner, repo, base } = cfg;
  try {
    // 1) base branch head sha
    const refRes = await ghFetch(cfg, 'GET', `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(base)}`);
    if (!refRes.ok) return failFrom('get_base_ref', refRes);
    const baseSha = ((await refRes.json()) as { object: { sha: string } }).object.sha;

    // 2) base commit → base tree sha
    const commitRes = await ghFetch(cfg, 'GET', `/repos/${owner}/${repo}/git/commits/${baseSha}`);
    if (!commitRes.ok) return failFrom('get_base_commit', commitRes);
    const baseTreeSha = ((await commitRes.json()) as { tree: { sha: string } }).tree.sha;

    // 3) blobs → tree items
    const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];
    for (const f of plan.files) {
      const blobRes = await ghFetch(cfg, 'POST', `/repos/${owner}/${repo}/git/blobs`, {
        content: f.content,
        encoding: 'utf-8',
      });
      if (!blobRes.ok) return failFrom('create_blob', blobRes);
      treeItems.push({ path: f.path, mode: '100644', type: 'blob', sha: ((await blobRes.json()) as { sha: string }).sha });
    }

    // 4) new tree
    const treeRes = await ghFetch(cfg, 'POST', `/repos/${owner}/${repo}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeItems,
    });
    if (!treeRes.ok) return failFrom('create_tree', treeRes);
    const newTreeSha = ((await treeRes.json()) as { sha: string }).sha;

    // 5) commit
    const newCommitRes = await ghFetch(cfg, 'POST', `/repos/${owner}/${repo}/git/commits`, {
      message: plan.commitMessage,
      tree: newTreeSha,
      parents: [baseSha],
    });
    if (!newCommitRes.ok) return failFrom('create_commit', newCommitRes);
    const newCommitSha = ((await newCommitRes.json()) as { sha: string }).sha;

    // 6) branch ref
    const branchRes = await ghFetch(cfg, 'POST', `/repos/${owner}/${repo}/git/refs`, {
      ref: `refs/heads/${plan.branch}`,
      sha: newCommitSha,
    });
    if (!branchRes.ok) return failFrom('create_branch', branchRes);

    // 7) pull request
    const prRes = await ghFetch(cfg, 'POST', `/repos/${owner}/${repo}/pulls`, {
      title: plan.prTitle,
      head: plan.branch,
      base,
      body: plan.prBody,
    });
    if (!prRes.ok) return failFrom('create_pr', prRes);
    const pr = (await prRes.json()) as { html_url: string; number: number };

    return { ok: true, prUrl: pr.html_url, prNumber: pr.number, branch: plan.branch, commitSha: newCommitSha };
  } catch (e) {
    return { ok: false, step: 'exception', error: e instanceof Error ? e.message : 'network error' };
  }
}
