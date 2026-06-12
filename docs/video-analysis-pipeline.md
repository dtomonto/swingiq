# Video Analysis Pipeline — Job Lifecycle (G3)

> Status: shipped 2026-06-12. First slice of the AI-native master plan's
> **Analysis Job lifecycle** (the keystone gap from
> [swingvantage-architecture-audit.md](./swingvantage-architecture-audit.md) §3, G3).

## Why this exists

Swing analysis was **fire-and-forget**: the pipeline ran on-device, produced a
report, and left no traceable record of the run itself. The master brief's spine
is that *every analysis is a traceable job* — observable, retryable, and
routable to human review. This adds that lifecycle without changing how analysis
actually works.

## The honest model: local-first

Analysis runs **on-device** (the video never leaves the browser), so a job is
recorded **device-local** — the same local-first model the feature-flag and
audit-log surfaces already use. A job holds only **non-PII operational
metadata**: sport label, lifecycle status, the analysis's own confidence, the AI
provider/model the route used, timestamps, retries. Never frames, prompts, or
analysis prose.

A fleet-wide admin view would mirror this metadata to an optional Supabase
`analysis_jobs` table — **deferred** (G3.2), exactly as the audit-log store notes
for itself.

## Lifecycle

```
queued → preparing → extracting_frames → extracting_pose → analyzing → generating_report → completed
```

Each active step maps 1:1 to a **real** pipeline stage (`AnalysisStage` in
`components/video/AnalysisProgress`) — we never claim a step the analyzer does
not perform (`building` + `plan` fold into one `generating_report`). Terminal /
operational states:

| Status | Meaning |
| --- | --- |
| `completed` | Finished with an AI diagnosis. |
| `not_configured` | Finished **without** AI (keyless / paused / budget). Frames + pose still ran. Honest, **not** a failure. |
| `needs_human_review` | Completed but confidence ≤ `LOW_CONFIDENCE_REVIEW_THRESHOLD` (0.45) → auto-flagged. |
| `failed` | An error stopped the run (sanitized message only). |
| `cancelled` | User aborted (AbortError) before completion. |
| `rerun_requested` | Operator/user asked for a fresh run (bumps `retryCount`). |

Transitions are guarded by a pure state machine (`canTransition`) so a persisted
job can never record an illegal jump (e.g. resurrecting a completed job to
`preparing` without going through `rerun_requested`).

## Code map

| File | Role |
| --- | --- |
| `lib/analysis-jobs/types.ts` | The `AnalysisJob` contract + `JobStats` (isomorphic). |
| `lib/analysis-jobs/lifecycle.ts` | Pure status machine: stage→status map, transition guard, progress, review threshold, badge descriptors. |
| `lib/analysis-jobs/store.ts` | Local-first device store (localStorage `swingiq-analysis-jobs-v1`, capped 50, change notification). |
| `lib/analysis-jobs/useAnalysisJobs.ts` | `useSyncExternalStore` reactive view (jobs + stats). |
| `lib/analysis-jobs/recorder.ts` | Pipeline bridge: `beginAnalysisJob` / `recordedSink` / `finishAnalysisJob` / `failAnalysisJob`. All best-effort + flag-gated. |
| `lib/video/run-analysis.ts` | Wires the recorder around `runSwingAnalysis` (guarded — job tracking can never affect the analysis). |
| `app/admin/analysis-jobs/` | The admin **Job Monitor** (Video Analysis → Analysis Jobs). |

## Wiring & safety

`runSwingAnalysis` opens a job, wraps the progress sink so each stage is mirrored
onto the job, and finalizes on success/failure/cancel. **Everything is wrapped in
try/catch** — a store failure never surfaces to the user or breaks analysis.

Recording is gated by the operator kill-switch **`analysis_jobs.enabled`**
(default on, `lib/admin/flags.ts`). Off → `beginAnalysisJob` returns `null` and
the pipeline runs exactly as before; existing jobs stay visible in the monitor.

## Admin Job Monitor — `/admin/analysis-jobs`

Reads the device-local store reactively. Stat tiles (total / active / completed /
needs-review / failed / no-AI), status + sport filters, and per-job operator
actions — **send to / clear review**, **request rerun**, **notes**, **delete** —
each mirrored to the admin **audit log**. Gated by `logs.view`; `noindex`.

`Request rerun` records intent against a finished job (and bumps `retryCount`);
the fresh run happens when the swing is re-analyzed — we don't fake a re-execution
the device can't perform from here.

## Tests

- `__tests__/lifecycle.test.ts` — pure machine (stage map, transitions, review threshold, descriptors).
- `__tests__/store.test.ts` — create/advance/complete/fail/cancel/rerun/review/notes/delete + `computeStats` (node + localStorage polyfill).
- `__tests__/recorder.test.ts` — begin/mirror/finish/fail bridge, keyless path, no-op when disabled.

24 tests; `tsc --noEmit` clean.

## Next (deferred)

- **G3.2** Optional Supabase `analysis_jobs` mirror + authenticated write route → a true fleet-wide monitor.
- Surface the live job on the user's analysis screen (the lifecycle is already recorded).
- Feed `needs_human_review` jobs into the consolidated Human Review Queue (`/admin/approvals`).
