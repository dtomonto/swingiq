// ============================================================
// SwingVantage — Analysis Jobs: public surface
// ------------------------------------------------------------
// Every swing analysis becomes a traceable job with an honest lifecycle
// status, confidence, provider trace, and human-review flag — recorded
// device-local. See lib/analysis-jobs/types.ts for the contract.
// ============================================================

export * from './types';
export * from './lifecycle';
export {
  loadJobs,
  createJob,
  advanceJob,
  completeJob,
  failJob,
  cancelJob,
  requestRerun,
  setHumanReview,
  setAdminNotes,
  deleteJob,
  clearJobs,
  computeStats,
  subscribeJobs,
  getJobsVersion,
} from './store';
export {
  beginAnalysisJob,
  recordedSink,
  finishAnalysisJob,
  failAnalysisJob,
  ANALYSIS_JOBS_FLAG,
} from './recorder';
export { useAnalysisJobs } from './useAnalysisJobs';
export type { AnalysisJobsView } from './useAnalysisJobs';
