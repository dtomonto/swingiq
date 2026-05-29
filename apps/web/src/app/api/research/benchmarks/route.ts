// ============================================================
// GET /api/research/benchmarks
// Returns the active benchmark version info and metadata.
// Public endpoint — no auth required (shows version only, not internals).
// ============================================================

import { NextResponse } from 'next/server';
import { BASELINE_VERSION, benchmarkRegistry } from '@swingiq/core';

export async function GET() {
  const version = benchmarkRegistry.getActiveVersion();
  const allWindows = benchmarkRegistry.getAllWindows();
  const metricCount = Object.values(allWindows).reduce(
    (acc, windows) => acc + Object.keys(windows).length,
    0,
  );

  return NextResponse.json({
    active_version: {
      version: version.version,
      title: version.title,
      description: version.description,
      effective_date: version.effective_date,
      status: version.status,
      change_summary: version.change_summary,
    },
    metrics_count: metricCount,
    club_types_covered: Object.keys(allWindows),
    evidence_note:
      'SwingIQ benchmarks are periodically reviewed and updated based on current golf performance research. ' +
      'Values are evidence-informed and segmented by club type. ' +
      'Confidence ratings reflect the quality and quantity of supporting sources.',
    last_research_run: null, // TODO: fetch from DB
    next_review_date: null,  // TODO: fetch from DB
    baseline_sources: [
      'TrackMan University — Launch Parameter Education',
      'FlightScope Research Resources',
      'USGA Equipment Standards',
      'PGA of America Teaching Resources',
      'Sports Biomechanics Research Literature',
    ],
  });
}
